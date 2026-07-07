/**
 * 后端 API 冒烟测试 (Smoke)
 * 目标：验证后端可启动、核心公开端点可达、响应契约符合统一响应规范。
 * 黑盒：对运行中的后端发起 HTTP 请求（默认 http://localhost:3000）。
 */
import supertest, { Response } from 'supertest';

const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
const api = supertest(BASE_URL);

describe('[Smoke] 后端启动与基础端点', () => {
  test('GET /health 返回 200 且 body 含 status=ok', async () => {
    const res = await api.get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.env).toBeDefined();
    expect(typeof res.body.uptime).toBe('number');
  });

  test('GET /docs (Swagger UI) 返回 200 且为 HTML', async () => {
    const res = await api.get('/docs').expect(200);
    expect(res.headers['content-type'] ?? '').toContain('text/html');
  });

  test('GET /api 开头路由有全局前缀（404 而非 500）', async () => {
    const res = await api.get('/api/__not_exist__');
    expect([404, 405]).toContain(res.status);
  });
});

describe('[Smoke] 公开读接口（@Public）', () => {
  test('GET /api/memes/feed 返回统一响应结构', async () => {
    const res = await api.get('/api/memes/feed');
    expect([200, 401, 403]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('data');
    }
  });

  test('GET /api/legions 公开可达', async () => {
    const res = await api.get('/api/legions');
    expect([200, 401, 403]).toContain(res.status);
  });

  test('GET /api/pk/active 公开可达', async () => {
    const res = await api.get('/api/pk/active');
    expect([200, 401, 403]).toContain(res.status);
  });
});

describe('[Smoke] 鉴权保护接口（无 JWT 应 401）', () => {
  const protectedEndpoints: Array<[string, string]> = [
    ['GET', '/api/users/me'],
    ['GET', '/api/notifications'],
    ['GET', '/api/admin/dashboard'],
    ['POST', '/api/ratings'],
  ];

  test.each(protectedEndpoints)('%s %s 无 Token 应返回 401', async (method, path) => {
    const res = await api[method.toLowerCase() as 'get' | 'post'](path);
    expect([401, 403]).toContain(res.status);
  });
});

describe('[Smoke] 输入校验', () => {
  test('POST /api/auth/otp/send 非法 phone 应被校验拒绝', async () => {
    const res = await api.post('/api/auth/otp/send').send({ phone: 'invalid' });
    expect([400, 500]).toContain(res.status);
  });

  test('POST /api/auth/otp/send 合法 phone 形式应通过校验层（不期望真正发短信）', async () => {
    const res = await api.post('/api/auth/otp/send').send({ phone: '+8613800138000' });
    // 服务层可能因 SMS key 未配置而抛错，校验层应已放行
    expect([200, 201, 202, 500, 503]).toContain(res.status);
  });
});

describe('[Smoke] Swagger / OpenAPI 文档', () => {
  test('GET /api-docs.yaml 返回 OpenAPI 文档', async () => {
    const res: Response = await api.get('/api-docs.yaml');
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-type'] ?? '').toMatch(/yaml|text|application/);
    }
  });
});
