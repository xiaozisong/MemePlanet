import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

export const DRIZZLE = Symbol('DRIZZLE_TOKEN');

export type DbType = NodePgDatabase<typeof schema>;

@Global()
@Module({
  imports: [ConfigModule],
  exports: [DRIZZLE],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): DbType => {
        const url = config.get<string>('DATABASE_URL');
        const pool = new Pool({
          connectionString: url,
          max: 10,
          idleTimeoutMillis: 30_000,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
})
export class DrizzleModule implements OnModuleInit {
  private readonly logger = new Logger(DrizzleModule.name);
  onModuleInit(): void {
    this.logger.log('Drizzle ORM initialized (pg pool)');
  }
}
