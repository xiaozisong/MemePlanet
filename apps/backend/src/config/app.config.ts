import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  name: process.env.APP_NAME ?? 'memechatai',
  corsOrigins: (process.env.CORS_ORIGINS ?? '*').split(','),
}));
