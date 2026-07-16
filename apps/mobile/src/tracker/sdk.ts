/**
 * Tracker SDK —— 客户端埋点 SDK
 *
 * 设计原则：
 * 1. 本地优先：先写入本地队列（AsyncStorage），后台批量上报，失败重试
 * 2. 弱网友好：批量上报 + 指数退避，对登录页等关键事件 immediate flush
 * 3. 8 核心事件 + 自定义事件统一接口 `track(name, props)`
 * 4. session/device ID 自动生成与持久化
 *
 * 后端契约（analytics.controller.ts）：
 * - POST /analytics/event         （需登录，单条）
 * - POST /analytics/event/batch    （公开，批量）
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** 8 核心事件名（与后端 AnalyticsService 列表一致） */
export const CORE_EVENTS = {
  APP_LAUNCH: 'app_launch',
  LOGIN_SUCCESS: 'login_success',
  MEME_CREATE_START: 'meme_create_start',
  MEME_CREATE_SUCCESS: 'meme_create_success',
  MEME_PUBLISH: 'meme_publish',
  MEME_VIEW: 'meme_view',
  MEME_SCORE: 'meme_score',
  MEME_COMMENT: 'meme_comment',
} as const;

export type CoreEventName = (typeof CORE_EVENTS)[keyof typeof CORE_EVENTS];

interface EventPayload {
  name: string;
  props: Record<string, unknown>;
  occurredAt?: string;
  userId?: string;
}

interface BatchContext {
  platform?: string;
  sessionId?: string;
  deviceId?: string;
}

const QUEUE_KEY = 'tracker:queue';
const SESSION_KEY = 'tracker:session';
const DEVICE_KEY = 'tracker:device';
const FLUSH_THRESHOLD = 10;
const FLUSH_INTERVAL_MS = 30_000;

class Tracker {
  private queue: EventPayload[] = [];
  private sessionId: string | null = null;
  private deviceId: string | null = null;
  private userId: string | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private apiPostBatch: ((body: unknown) => Promise<unknown>) | null = null;
  private initialized = false;

  /** 注入 API 客户端的批量上报函数 */
  bindPoster(postBatch: (body: unknown) => Promise<unknown>) {
    this.apiPostBatch = postBatch;
  }

  /** 设置当前用户 ID（登录后调用） */
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 恢复 session/device ID
    this.sessionId = (await AsyncStorage.getItem(SESSION_KEY)) ?? this.genId('sess');
    this.deviceId = (await SecureStore.getItemAsync(DEVICE_KEY)) ?? this.genId('dev');
    await AsyncStorage.setItem(SESSION_KEY, this.sessionId);
    await SecureStore.setItemAsync(DEVICE_KEY, this.deviceId);

    // 恢复未上报队列
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) this.queue = JSON.parse(raw) as EventPayload[];
    } catch {
      this.queue = [];
    }

    // 启动定时 flush
    this.flushTimer = setInterval(() => {
      void this.flush().catch(() => {});
    }, FLUSH_INTERVAL_MS);
  }

  destroy() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = null;
    this.initialized = false;
  }

  /** 上报事件（核心入口） */
  track(name: string, props: Record<string, unknown> = {}) {
    const event: EventPayload = {
      name,
      props,
      occurredAt: new Date().toISOString(),
      userId: this.userId ?? undefined,
    };
    this.queue.push(event);
    void this.persist();
    if (this.queue.length >= FLUSH_THRESHOLD) {
      void this.flush().catch(() => {});
    }
  }

  /** 上报核心事件（语义化别名） */
  trackCore(event: CoreEventName, props: Record<string, unknown> = {}) {
    this.track(event, props);
  }

  /** 立即 flush（用于关键事件如 login_success） */
  async flushNow() {
    await this.flush();
  }

  private async flush() {
    if (!this.apiPostBatch || this.queue.length === 0) return;
    const batch = this.queue.slice(0, 50);
    const ctx: BatchContext = {
      platform: Platform.OS,
      sessionId: this.sessionId ?? undefined,
      deviceId: this.deviceId ?? undefined,
    };
    try {
      await this.apiPostBatch({
        events: batch.map((e) => ({
          name: e.name,
          props: e.props,
          occurredAt: e.occurredAt,
        })),
        ...ctx,
      });
      // 上报成功后从队列移除
      this.queue = this.queue.slice(batch.length);
      await this.persist();
    } catch (err) {
      // 静默失败，下次定时器重试
      console.warn('[tracker] flush failed', err);
    }
  }

  private async persist() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // 持久化失败不影响流程
    }
  }

  private genId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const tracker = new Tracker();

/** 手动初始化 Tracker（在 App 启动时调用一次） */
export async function initTracker(
  postBatch: (body: unknown) => Promise<unknown>,
  userId?: string | null,
) {
  tracker.bindPoster(postBatch);
  if (userId) tracker.setUserId(userId);
  await tracker.init();
  // 应用启动即上报 app_launch（核心事件 #1）
  tracker.trackCore(CORE_EVENTS.APP_LAUNCH, {
    app_version: Constants.expoConfig?.version ?? 'unknown',
    device_model: Device.modelName ?? 'unknown',
    os_version: Device.osVersion ?? 'unknown',
  });
}
