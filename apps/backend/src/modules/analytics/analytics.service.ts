import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { analyticsEvents } from '../../database/schema.js';

/** PostHog 客户端抽象（可选注入，key 未配置时为 null） */
export const POSTHOG_CLIENT = Symbol('POSTHOG_CLIENT');

export interface PostHogCapture {
  capture(distinctId: string, event: string, properties?: Record<string, unknown>): void;
}

export interface TrackContext {
  userId?: string;
  platform?: string;
  sessionId?: string;
  deviceId?: string;
  clientIp?: string;
}

export interface TrackPayload {
  name: string;
  properties?: Record<string, unknown>;
  occurredAt?: string;
}

/**
 * AnalyticsService —— 埋点双写
 *
 * 策略：
 * 1. 自建 analytics_events 表：所有事件均写入（可靠性优先）
 * 2. PostHog 云：配置了 key 时双写，key 缺失时仅日志（graceful degradation）
 *
 * 关键事件列表（PRD §10.3 / TechnicalDesign §14.3）：
 * app_launch, login_success, meme_create_start, meme_create_success,
 * meme_publish, meme_view, meme_score, meme_comment, meme_share,
 * god_meme_trigger, trash_meme_trigger
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    @Optional() @Inject(POSTHOG_CLIENT) private readonly posthog: PostHogCapture | null,
  ) {
    if (this.posthog) {
      this.logger.log('AnalyticsService: PostHog dual-write enabled');
    } else {
      this.logger.log('AnalyticsService: PostHog key not configured, local-only mode');
    }
  }

  /**
   * 单条事件上报
   */
  async track(ctx: TrackContext, payload: TrackPayload): Promise<{ eventId: string }> {
    const props = payload.properties ?? {};

    // 1. 写入自建表（可靠存储）
    const rows = await this.db
      .insert(analyticsEvents)
      .values({
        eventName: payload.name,
        userId: ctx.userId ?? null,
        properties: props,
        platform: ctx.platform ?? 'app',
        sessionId: ctx.sessionId ?? null,
        deviceId: ctx.deviceId ?? null,
        clientIp: ctx.clientIp ?? null,
      })
      .returning({ eventId: analyticsEvents.eventId });

    const eventId = rows[0]?.eventId ?? '';

    // 2. 双写 PostHog（graceful degradation：失败不阻塞主流程）
    if (this.posthog) {
      try {
        this.posthog.capture(ctx.userId ?? 'anonymous', payload.name, {
          ...props,
          platform: ctx.platform,
          session_id: ctx.sessionId,
          device_id: ctx.deviceId,
        });
      } catch (err) {
        this.logger.warn(`PostHog capture failed for event=${payload.name}`, err);
      }
    }

    return { eventId };
  }

  /**
   * 批量事件上报
   */
  async trackBatch(ctx: TrackContext, events: TrackPayload[]): Promise<{ accepted: number }> {
    if (events.length === 0) return { accepted: 0 };

    const values = events.map((e) => ({
      eventName: e.name,
      userId: ctx.userId ?? null,
      properties: e.properties ?? {},
      platform: ctx.platform ?? 'app',
      sessionId: ctx.sessionId ?? null,
      deviceId: ctx.deviceId ?? null,
      clientIp: ctx.clientIp ?? null,
    }));

    // 批量写入自建表
    await this.db.insert(analyticsEvents).values(values);

    // 批量双写 PostHog
    if (this.posthog) {
      for (const e of events) {
        try {
          this.posthog.capture(ctx.userId ?? 'anonymous', e.name, {
            ...e.properties,
            platform: ctx.platform,
            session_id: ctx.sessionId,
            device_id: ctx.deviceId,
          });
        } catch (err) {
          this.logger.warn(`PostHog batch capture failed for event=${e.name}`, err);
        }
      }
    }

    return { accepted: events.length };
  }
}
