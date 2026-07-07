import { api, getJwtToken, authHeader } from './setup';
import type supertest from 'supertest';

interface RouteCase {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string; // 使用 :param 占位的模板
  public?: boolean;
  body?: unknown;
  samplePath?: string; // 替换 :param 的真实示例路径
}

// 全量路由清单（来自 Nest 启动日志，48 条）
const ROUTES: RouteCase[] = [
  { method: 'POST', path: '/api/auth/otp/send', public: true, body: { phone: '+8613800000000' } },
  { method: 'POST', path: '/api/auth/otp/verify', public: true, body: { phone: '+8613800000000', code: '123456' } },
  { method: 'POST', path: '/api/auth/oauth', public: true, body: { provider: 'wechat', token: 'x' } },
  { method: 'POST', path: '/api/auth/refresh' },
  { method: 'GET', path: '/api/users/me' },
  { method: 'PATCH', path: '/api/users/me', body: { nickname: 'tester' } },
  { method: 'PATCH', path: '/api/users/me/interest-tags', body: { tags: ['搞笑'] } },
  { method: 'GET', path: '/api/users/me/power' },
  { method: 'GET', path: '/api/memes/feed', public: true },
  { method: 'GET', path: '/api/memes/:id', public: true, samplePath: '/api/memes/00000000-0000-0000-0000-000000000000' },
  { method: 'POST', path: '/api/memes', body: { type: 'text', content: 'hi', visibility: 'public' } },
  { method: 'POST', path: '/api/creations', body: { type: 'text', prompt: '讲个段子' } },
  { method: 'GET', path: '/api/creations/:id', samplePath: '/api/creations/00000000-0000-0000-0000-000000000000' },
  { method: 'POST', path: '/api/creations/:id/choose', samplePath: '/api/creations/00000000-0000-0000-0000-000000000000/choose', body: { idx: 0 } },
  { method: 'POST', path: '/api/creations/:id/regenerate', samplePath: '/api/creations/00000000-0000-0000-0000-000000000000/regenerate' },
  { method: 'POST', path: '/api/videos', body: { sourceType: 'meme', sourceId: '00000000-0000-0000-0000-000000000000' } },
  { method: 'GET', path: '/api/videos/:id/status', samplePath: '/api/videos/00000000-0000-0000-0000-000000000000/status' },
  { method: 'POST', path: '/api/videos/:id/webhook', samplePath: '/api/videos/00000000-0000-0000-0000-000000000000/webhook', body: {} },
  { method: 'POST', path: '/api/ratings', body: { memeId: '00000000-0000-0000-0000-000000000000', score: 5 } },
  { method: 'GET', path: '/api/ratings/:memeId/comments', public: true, samplePath: '/api/ratings/00000000-0000-0000-0000-000000000000/comments' },
  { method: 'POST', path: '/api/ratings/comments', body: { memeId: '00000000-0000-0000-0000-000000000000', content: '好梗' } },
  { method: 'GET', path: '/api/legions', public: true },
  { method: 'GET', path: '/api/legions/:id', public: true, samplePath: '/api/legions/00000000-0000-0000-0000-000000000000' },
  { method: 'POST', path: '/api/legions', body: { name: '测试军团', slogan: 't' } },
  { method: 'POST', path: '/api/legions/:id/join', samplePath: '/api/legions/00000000-0000-0000-0000-000000000000/join' },
  { method: 'POST', path: '/api/legions/:id/leave', samplePath: '/api/legions/00000000-0000-0000-0000-000000000000/leave' },
  { method: 'GET', path: '/api/pk/active', public: true },
  { method: 'GET', path: '/api/pk/:id', public: true, samplePath: '/api/pk/00000000-0000-0000-0000-000000000000' },
  { method: 'POST', path: '/api/pk', body: { blueLegionId: '00000000-0000-0000-0000-000000000000', redLegionId: '00000000-0000-0000-0000-000000000000' } },
  { method: 'POST', path: '/api/pk/:id/vote', samplePath: '/api/pk/00000000-0000-0000-0000-000000000000/vote', body: { side: 'blue' } },
  { method: 'GET', path: '/api/chat/rooms' },
  { method: 'GET', path: '/api/chat/rooms/:roomId/messages', samplePath: '/api/chat/rooms/00000000-0000-0000-0000-000000000000/messages' },
  { method: 'POST', path: '/api/chat/messages', body: { roomId: '00000000-0000-0000-0000-000000000000', content: 'hi' } },
  { method: 'GET', path: '/api/recommend/feed' },
  { method: 'POST', path: '/api/audit/report', body: { targetType: 'meme', targetId: '00000000-0000-0000-0000-000000000000', reason: 'spam' } },
  { method: 'GET', path: '/api/admin/audit/queue' },
  { method: 'POST', path: '/api/admin/audit/:auditId/action', samplePath: '/api/admin/audit/00000000-0000-0000-0000-000000000000/action', body: { action: 'approve' } },
  { method: 'GET', path: '/api/admin/users' },
  { method: 'PATCH', path: '/api/admin/users/:userId/ban', samplePath: '/api/admin/users/00000000-0000-0000-0000-000000000000/ban', body: { reason: 'test' } },
  { method: 'GET', path: '/api/admin/dashboard' },
  { method: 'GET', path: '/api/notifications' },
  { method: 'POST', path: '/api/notifications/:id/read', samplePath: '/api/notifications/00000000-0000-0000-0000-000000000000/read' },
  { method: 'POST', path: '/api/notifications/read-all' },
  { method: 'POST', path: '/api/analytics/event', body: { name: 'page_view', props: { page: 'feed' } } },
  { method: 'POST', path: '/api/analytics/event/batch', public: true, body: { events: [{ name: 'page_view', props: {} }] } },
  { method: 'GET', path: '/api/ai-orch/providers/health' },
  { method: 'GET', path: '/api/ai-orch/cost/today' },
  { method: 'POST', path: '/api/ai-orch/policy/circuit/reset', body: { provider: 'deepseek' } },
];

function req(method: string, path: string, body?: unknown, headers?: Record<string, string>) {
  let r: supertest.Request = api[method.toLowerCase() as 'get'](path);
  if (headers) {
    for (const [k, v] of Object.entries(headers)) r = r.set(k, v);
  }
  if (body && ['post', 'patch', 'put', 'delete'].includes(method.toLowerCase())) {
    r = (r as supertest.Request).send(body);
  }
  return r;
}

describe('路由清单 · 全量 48 接口可路由', () => {
  let token: string;
  beforeAll(async () => {
    token = await getJwtToken();
  });

  ROUTES.forEach((route) => {
    const target = route.samplePath ?? route.path;
    const label = `${route.method} ${route.path}`;
    it(`${label} ${route.public ? '公开' : '受保护'} 路由可命中（非 Nest 默认 404）`, async () => {
      const res = await req(route.method, target, route.body, authHeader(token));
      // 区分"路由未注册"（Nest 默认 404，message 以 "Cannot " 开头）与"service 层 404"（数据不存在）
      const isRouteMissing = res.status === 404 && /Cannot /.test(res.body?.message ?? '');
      expect(isRouteMissing).toBe(false);
    });

    if (!route.public) {
      it(`${label} 无 token 返回 401`, async () => {
        const res = await req(route.method, target, route.body);
        expect(res.status).toBe(401);
      });
    }
  });
});
