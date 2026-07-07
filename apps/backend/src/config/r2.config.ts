import { registerAs } from '@nestjs/config';

export default registerAs('r2', () => ({
  accountId: process.env.R2_ACCOUNT_ID,
  accessKey: process.env.R2_ACCESS_KEY,
  secretKey: process.env.R2_SECRET_KEY,
  bucket: process.env.R2_BUCKET ?? 'memestar',
  endpoint: process.env.R2_ENDPOINT,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  region: process.env.R2_REGION ?? 'auto',
}));
