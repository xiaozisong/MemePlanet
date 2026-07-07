import supertest from 'supertest';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
export const api = supertest(BASE_URL);

const TEST_PHONE = '+8613800000000';
const TEST_OTP_CODE = '123456';

let cachedToken: string | undefined;

export async function getJwtToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  await api.post('/api/auth/otp/send').send({ phone: TEST_PHONE }).expect((r) => r.status < 500);
  const verify = await api
    .post('/api/auth/otp/verify')
    .send({ phone: TEST_PHONE, code: TEST_OTP_CODE });
  if (![200, 201].includes(verify.status) || !verify.body?.data?.token) {
    throw new Error(`获取 JWT 失败: status=${verify.status} body=${JSON.stringify(verify.body)}`);
  }
  cachedToken = verify.body.data.token as string;
  return cachedToken;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function isEnvelope(v: unknown): v is { code: number; data: unknown; message: string } {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.code === 'number' && 'data' in o && typeof o.message === 'string';
}
