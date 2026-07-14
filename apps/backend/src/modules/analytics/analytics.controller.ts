import { Body, Controller, Ip, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { AnalyticsService, type TrackContext, type TrackPayload } from './analytics.service.js';
import { TrackEventSchema, TrackBatchSchema } from './dto.js';

function buildContext(
  userId: string | undefined,
  ip: string,
  body: { platform?: string; sessionId?: string; deviceId?: string },
): TrackContext {
  return {
    userId,
    platform: body.platform,
    sessionId: body.sessionId,
    deviceId: body.deviceId,
    clientIp: ip,
  };
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * POST /analytics/event
   * 单条事件上报（需登录）
   */
  @UseGuards(JwtAuthGuard)
  @Post('event')
  async track(@CurrentUser() user: CurrentUser, @Ip() ip: string, @Body() body: unknown) {
    const parsed = TrackEventSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid event payload',
        issues: parsed.error.issues,
      });
    }

    const dto = parsed.data;
    const ctx = buildContext(user?.sub, ip, dto);
    const payload: TrackPayload = {
      name: dto.name,
      properties: dto.props as Record<string, unknown>,
      occurredAt: dto.occurredAt,
    };

    return this.analytics.track(ctx, payload);
  }

  /**
   * POST /analytics/event/batch
   * 批量事件上报（公开，用于 SDK 本地缓存后批量传输）
   */
  @Public()
  @Post('event/batch')
  async batch(@Ip() ip: string, @Body() body: unknown) {
    const parsed = TrackBatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid batch payload',
        issues: parsed.error.issues,
      });
    }

    const dto = parsed.data;

    // 逐条校验每个事件
    const events: TrackPayload[] = dto.events.map((e) => {
      const r = TrackEventSchema.safeParse(e);
      if (!r.success) {
        throw new BadRequestException({
          message: 'Invalid event in batch',
          issues: r.error.issues,
        });
      }
      return {
        name: r.data.name,
        properties: r.data.props as Record<string, unknown>,
        occurredAt: r.data.occurredAt,
      };
    });

    const ctx = buildContext(undefined, ip, dto);
    return this.analytics.trackBatch(ctx, events);
  }
}
