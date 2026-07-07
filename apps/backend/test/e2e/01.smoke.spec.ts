import { api, isEnvelope } from './setup';

describe('冒烟测试 · 服务可用性', () => {
  it('GET /health 返回 200 且包含 status=ok', async () => {
    const res = await api.get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.env).toBe('development');
  });

  it('GET /docs (Swagger UI) 返回 200 HTML', async () => {
    const res = await api.get('/docs').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  it('GET /docs-json (OpenAPI JSON 规范) 返回 200', async () => {
    const res = await api.get('/docs-json').expect(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toMatchObject({ openapi: expect.any(String), paths: expect.any(Object) });
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
  });

  it('未定义路由 GET /api/__not_found__ 返回 404', async () => {
    const res = await api.get('/api/__not_found__');
    expect(res.status).toBe(404);
  });

  it('统一响应信封：公开接口 body 为 {code,data,message}', async () => {
    const res = await api.get('/api/memes/feed');
    expect(res.status).toBe(200);
    expect(isEnvelope(res.body)).toBe(true);
    expect(res.body.code).toBe(0);
    expect(res.body.message).toBe('OK');
  });
});
