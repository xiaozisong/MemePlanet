import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  async track(userId: string | undefined, dto: { name: string; props?: Record<string, unknown> }) {
    // TODO: 写入自建 analytics_event 表 + 关键事件双写 PostHog
    this.logger.log(`track user=${userId ?? 'anon'} name=${dto.name}`);
    return { ok: true };
  }
}
