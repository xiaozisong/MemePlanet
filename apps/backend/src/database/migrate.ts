import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: ['.env', '../../.env'] });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: url });
  const logger = new Logger('Migrate');
  // TODO: 接入 drizzle 迁移 runner
  logger.log('TODO: 跑 drizzle 迁移（当前由 docker-entrypoint-initdb.d 自动建表）');
  await pool.end();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
