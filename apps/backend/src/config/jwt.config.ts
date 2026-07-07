import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'change_me_in_dev_only',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
}));
