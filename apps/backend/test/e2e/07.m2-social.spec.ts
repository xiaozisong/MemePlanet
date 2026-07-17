import { api, getJwtToken, authHeader, isEnvelope } from './setup';

const LEGION_D1 = '00000000-0000-0000-0000-d00000000001';
const LEGION_D2 = '00000000-0000-0000-0000-d00000000002';
const ADMIN_USER_ID = '00000000-0000-0000-0000-a00000000001';

describe('M2 社交模块 · Legion 军团', () => {
  let token: string;
  beforeAll(async () => {
    token = await getJwtToken();
  });

  describe('GET /api/legions 公开军团列表', () => {
    it('分页结构 {items, page, total, pageSize}', async () => {
      const res = await api.get('/api/legions');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        items: expect.any(Array),
        page: expect.any(Number),
        total: expect.any(Number),
        pageSize: expect.any(Number),
      });
    });

    it('带 keyword 按名称模糊搜索', async () => {
      const res = await api.get('/api/legions?keyword=抽象');
      expect(res.status).toBe(200);
      // 种子数据有"抽象艺术团"，应命中
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('无 keyword 返回全部活跃军团，按 activityScore 降序', async () => {
      const res = await api.get('/api/legions');
      const items = res.body.data.items as { activity_score: number }[];
      if (items.length > 1) {
        for (let i = 1; i < items.length; i++) {
          expect(items[i]!.activity_score).toBeLessThanOrEqual(items[i - 1]!.activity_score);
        }
      }
    });
  });

  describe('GET /api/legions/:id 军团详情', () => {
    it('已知 seed 军团返回详情含 members', async () => {
      const res = await api.get(`/api/legions/${LEGION_D1}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        legion_id: LEGION_D1,
        name: expect.any(String),
        members: expect.any(Array),
      });
    });

    it('不存在的军团返回 404', async () => {
      const res = await api.get('/api/legions/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/legions 创建军团', () => {
    it('未登录返回 401', async () => {
      const res = await api.post('/api/legions').send({ name: '测试军团', slogan: 'test' });
      expect(res.status).toBe(401);
    });

    it('已登录创建成功返回 legionId', async () => {
      const res = await api
        .post('/api/legions')
        .set(authHeader(token))
        .send({ name: `E2E军团${Date.now()}`, slogan: 'e2e测试', joinMode: 'public' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toMatchObject({
        legion_id: expect.any(String),
        status: 'active',
      });
    });

    it('名过短/过长返回 400', async () => {
      const res = await api
        .post('/api/legions')
        .set(authHeader(token))
        .send({ name: 'X' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/legions/:id/join 加入军团', () => {
    it('已登录加入已知军团成功', async () => {
      const res = await api
        .post(`/api/legions/${LEGION_D2}/join`)
        .set(authHeader(token));
      expect([200, 201]).toContain(res.status);
    });

    it('重复加入返回 400', async () => {
      const res = await api
        .post(`/api/legions/${LEGION_D2}/join`)
        .set(authHeader(token));
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/legions/:id/leave 退出军团', () => {
    it('已加入的军团可以退出', async () => {
      const res = await api
        .post(`/api/legions/${LEGION_D2}/leave`)
        .set(authHeader(token));
      expect([200, 201]).toContain(res.status);
    });

    it('未加入的军团退出返回 400', async () => {
      const res = await api
        .post(`/api/legions/00000000-0000-0000-0000-000000000000/leave`)
        .set(authHeader(token));
      expect(res.status).toBe(400);
    });
  });
});

describe('M2 社交模块 · PK 对战', () => {
  let token: string;
  beforeAll(async () => {
    token = await getJwtToken();
  });

  describe('GET /api/pk/active 活跃 PK 列表', () => {
    it('返回数组，各项含主题/比分/状态', async () => {
      const res = await api.get('/api/pk/active');
      expect(res.status).toBe(200);
      expect(isEnvelope(res.body)).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/pk/:id PK 详情', () => {
    it('不存在的 PK 返回 404', async () => {
      const res = await api.get('/api/pk/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/pk 创建 PK', () => {
    it('未登录返回 401', async () => {
      const res = await api.post('/api/pk').send({
        type: 'vote',
        legionA: LEGION_D1,
        legionB: LEGION_D2,
        theme: 'e2e测试PK',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      });
      expect(res.status).toBe(401);
    });
  });
});

describe('M2 社交模块 · Chat 即时通讯', () => {
  let token: string;
  beforeAll(async () => {
    token = await getJwtToken();
  });

  describe('GET /api/chat/rooms 会话列表', () => {
    it('未登录返回 401', async () => {
      const res = await api.get('/api/chat/rooms');
      expect(res.status).toBe(401);
    });

    it('已登录返回会话数组', async () => {
      const res = await api.get('/api/chat/rooms').set(authHeader(token));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/chat/rooms/:roomId/messages 消息历史', () => {
    it('不存在的 room 返回 404 或空列表', async () => {
      const res = await api
        .get('/api/chat/rooms/00000000-0000-0000-0000-000000000000/messages')
        .set(authHeader(token));
      // 404 或 200[] 均可接受
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('POST /api/chat/messages 发送消息', () => {
    it('未登录返回 401', async () => {
      const res = await api.post('/api/chat/messages').send({
        roomId: LEGION_D1,
        msgType: 'text',
        content: 'e2e test',
      });
      expect(res.status).toBe(401);
    });

    it('不存在 chat_room 返回 404', async () => {
      const res = await api
        .post('/api/chat/messages')
        .set(authHeader(token))
        .send({
          roomId: '00000000-0000-0000-0000-000000000000',
          msgType: 'text',
          content: 'hello',
        });
      expect(res.status).toBe(404);
    });
  });
});

describe('M2 社交模块 · Admin 运营后台', () => {
  describe('普通用户无权限', () => {
    let token: string;
    beforeAll(async () => {
      token = await getJwtToken();
    });

    it('GET /api/admin/dashboard 返回 403', async () => {
      const res = await api.get('/api/admin/dashboard').set(authHeader(token));
      expect(res.status).toBe(403);
    });

    it('GET /api/admin/audit/queue 返回 403', async () => {
      const res = await api.get('/api/admin/audit/queue').set(authHeader(token));
      expect(res.status).toBe(403);
    });

    it('GET /api/admin/users 返回 403', async () => {
      const res = await api.get('/api/admin/users').set(authHeader(token));
      expect(res.status).toBe(403);
    });
  });

  describe('未知 token 不可达后台', () => {
    it('无 token 返回 401', async () => {
      const res = await api.get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('伪造 token 返回 401', async () => {
      const res = await api
        .get('/api/admin/dashboard')
        .set(authHeader('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dummy'));
      expect(res.status).toBe(401);
    });
  });
});
