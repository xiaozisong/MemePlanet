import { api, getJwtToken, authHeader, isEnvelope } from './setup';

const TEST_PHONE = '+8613800000000';

describe('鉴权模块 · OTP 登录流程', () => {
  it('POST /api/auth/otp/send 公开接口，合法手机号返回 sent=true', async () => {
    const res = await api.post('/api/auth/otp/send').send({ phone: TEST_PHONE });
    expect([200, 201]).toContain(res.status);
    expect(isEnvelope(res.body)).toBe(true);
    expect(res.body.data).toMatchObject({ sent: true, ttlSec: expect.any(Number) });
  });

  it('POST /api/auth/otp/send 非法手机号返回 400', async () => {
    const res = await api.post('/api/auth/otp/send').send({ phone: 'bad' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/otp/verify 错误验证码返回 401', async () => {
    const res = await api
      .post('/api/auth/otp/verify')
      .send({ phone: TEST_PHONE, code: '000000' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/otp/verify 正确验证码（123456）签发 JWT', async () => {
    const res = await api
      .post('/api/auth/otp/verify')
      .send({ phone: TEST_PHONE, code: '123456' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.token).toEqual(expect.any(String));
    const parts = res.body.data.token.split('.');
    expect(parts.length).toBe(3); // header.payload.signature
  });

  it('POST /api/auth/oauth 暂未启用，返回 401', async () => {
    const res = await api
      .post('/api/auth/oauth')
      .send({ provider: 'wechat', token: 'dummy' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/refresh 无 token 返回 401', async () => {
    const res = await api.post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/refresh 带合法 token 滚动签发新 token', async () => {
    const token = await getJwtToken();
    const res = await api.post('/api/auth/refresh').set(authHeader(token));
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.token).toEqual(expect.any(String));
  });
});
