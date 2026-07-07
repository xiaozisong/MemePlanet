import { api, getJwtToken, authHeader, isEnvelope } from './setup';

describe('功能测试 · 核心业务接口语义', () => {
  let token: string;
  beforeAll(async () => {
    token = await getJwtToken();
  });

  it('GET /api/memes/feed 分页结构 {items,page,pageSize,total,hasMore}', async () => {
    const res = await api.get('/api/memes/feed?page=1&pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      items: expect.any(Array),
      page: expect.any(Number),
      pageSize: expect.any(Number),
      total: expect.any(Number),
      hasMore: expect.any(Boolean),
    });
  });

  it('GET /api/recommend/feed 受保护，带 token 返回推荐流', async () => {
    const res = await api.get('/api/recommend/feed').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(isEnvelope(res.body)).toBe(true);
    expect(res.body.data).toMatchObject({ items: expect.any(Array) });
  });

  it('GET /api/legions 军团列表分页结构', async () => {
    const res = await api.get('/api/legions');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ items: expect.any(Array), total: expect.any(Number) });
  });

  it('GET /api/pk/active 当前 PK 活动列表', async () => {
    const res = await api.get('/api/pk/active');
    expect(res.status).toBe(200);
    expect(isEnvelope(res.body)).toBe(true);
  });

  it('GET /api/users/me 带 token 返回当前用户', async () => {
    const res = await api.get('/api/users/me').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      userId: expect.any(String),
      nickname: expect.any(String),
      level: expect.any(Number),
    });
  });

  it('POST /api/analytics/event 合法事件上报返回 OK', async () => {
    const res = await api
      .post('/api/analytics/event')
      .set(authHeader(token))
      .send({ name: 'test_event', props: { foo: 'bar' } });
    expect([200, 201]).toContain(res.status);
    expect(res.body.code).toBe(0);
  });

  it('POST /api/audit/report 举报上报受理成功', async () => {
    const res = await api
      .post('/api/audit/report')
      .set(authHeader(token))
      .send({ targetType: 'meme', targetId: '00000000-0000-0000-0000-000000000000', reason: 'spam' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data).toMatchObject({ status: expect.any(String) });
  });

  it('GET /api/ai-orch/providers/health 普通用户无权限返回 403', async () => {
    const res = await api.get('/api/ai-orch/providers/health').set(authHeader(token));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40300);
  });

  it('GET /api/ai-orch/cost/today 普通用户无权限返回 403', async () => {
    const res = await api.get('/api/ai-orch/cost/today').set(authHeader(token));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(40300);
  });
});
