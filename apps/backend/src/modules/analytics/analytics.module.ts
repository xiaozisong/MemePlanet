import { Module, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { posthogClientProvider } from './posthog.provider.js';

@Module({
  imports: [ConfigModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, posthogClientProvider],
  exports: [AnalyticsService],
})
export class AnalyticsModule implements OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsModule.name);

  onModuleDestroy(): void {
    this.logger.log('AnalyticsModule destroyed');
  }
}
