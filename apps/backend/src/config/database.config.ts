import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'app',
  password: process.env.POSTGRES_PASSWORD ?? 'change_me_in_prod',
  database: process.env.POSTGRES_DB ?? 'meme',
  pgvector: (process.env.PGVECTOR_ENABLED ?? 'true') === 'true',
}));
