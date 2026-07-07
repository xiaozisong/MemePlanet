import { test, expect, type Page } from '@playwright/test';

/**
 * Web 端冒烟测试 · 首屏可用性
 * 目标：验证 Next.js Web 可启动、首页渲染、关键文案与导航存在、无控制台报错。
 */
test.describe('[Smoke] 首页渲染与基础可用性', () => {
  test('首页 / 返回 200 且渲染主标题与品牌', async ({ page }: { page: Page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/AI 造梗/);
    await expect(page.getByText('梗星球').first()).toBeVisible();
    await expect(page.getByRole('link', { name: '运营后台' })).toBeVisible();
    await expect(page.getByRole('link', { name: '隐私政策' })).toBeVisible();

    // 关键页面不应有未捕获的运行时错误（忽略静态资源 404，那不是运行时错误）
    const runtimeErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('Failed to load resource'),
    );
    expect(runtimeErrors).toEqual([]);
  });

  test('首页下载按钮与 iOS/Android 外链存在', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: '下载 App' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'iOS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Android' })).toBeVisible();
  });
});

test.describe('[Smoke] 落地页无 500 错误', () => {
  const routes = ['/', '/privacy', '/terms', '/admin', '/admin/login'];
  for (const route of routes) {
    test(`GET ${route} 不返回 5xx`, async ({ page }: { page: Page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBeLessThan(500);
    });
  }
});
