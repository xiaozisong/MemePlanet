import { test, expect, type Page } from '@playwright/test';

/**
 * Web 端路由测试 · 全量页面可达且无 500
 * 覆盖营销页 + 运营后台全部子页。
 */
const ROUTES: Array<{ path: string; expectText?: string }> = [
  { path: '/', expectText: 'AI 造梗' },
  { path: '/privacy', expectText: '隐私政策 v0.1' },
  { path: '/terms', expectText: '用户协议 v0.1' },
  { path: '/admin', expectText: 'Dashboard' },
  { path: '/admin/login', expectText: '运营后台登录' },
  { path: '/admin/audit', expectText: '审核队列' },
  { path: '/admin/users', expectText: '用户管理' },
  { path: '/admin/pk' },
  { path: '/admin/analytics' },
  { path: '/admin/cost' },
];

test.describe('[Routes] 全量页面可达', () => {
  for (const r of ROUTES) {
    test(`${r.path} 返回 200 且渲染${r.expectText ? '含 "' + r.expectText + '"' : '正常'}`, async ({
      page,
    }: {
      page: Page;
    }) => {
      const res = await page.goto(r.path);
      expect(res?.status()).toBeLessThan(500);
      // Next.js notFound 返回 404 也算"路由可命中"，但这里要求主要页面 200
      if (r.path === '/admin/pk' || r.path === '/admin/analytics' || r.path === '/admin/cost') {
        // 这些是 TODO 占位页，允许 200 或 404，但不能 500
        expect(res?.status()).toBeLessThan(500);
      } else {
        expect(res?.status()).toBe(200);
      }
      if (r.expectText) {
        await expect(page.getByText(r.expectText).first()).toBeVisible();
      }
    });
  }
});
