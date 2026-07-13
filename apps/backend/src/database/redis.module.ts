import { Module, Global, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS_TOKEN');

@Global()
@Module({
  imports: [ConfigModule],
  exports: [REDIS],
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        return new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            const delay = Math.min(times * 200, 3000);
            return delay;
          },
          lazyConnect: false,
        });
      },
    },
  ],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onModuleInit(): Promise<void> {
    const host = this.redis.options.host ?? 'unknown';
    const port = this.redis.options.port ?? 6379;
    this.logger.log(`Redis connected: ${host}:${port}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
