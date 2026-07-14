import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';
import { POSTHOG_CLIENT, type PostHogCapture } from './analytics.service.js';

/**
 * PostHog 客户端工厂
 *
 * 注入策略：
 * - POSTHOG_KEY 未配置 → 返回 null（service 层 graceful degradation）
 * - POSTHOG_KEY 已配置 → 返回 PostHogCapture 封装实例
 */
export const posthogClientProvider: Provider = {
  provide: POSTHOG_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): PostHogCapture | null => {
    const key = config.get<string>('POSTHOG_KEY');
    if (!key) return null;

    const host = config.get<string>('POSTHOG_HOST') ?? 'https://app.posthog.com';
    const client = new PostHog(key, { host });

    return {
      capture: (distinctId: string, event: string, properties?: Record<string, unknown>) => {
        client.capture({ distinctId, event, properties });
      },
    };
  },
};
