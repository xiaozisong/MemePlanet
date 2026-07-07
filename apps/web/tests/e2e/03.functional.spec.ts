import { test, expect, type Page } from '@playwright/test';

/**
 * Web 端功能测试 · 导航与交互闭环
 * 目标：验证关键用户路径可走通（首页→隐私、后台侧边栏切换、后台登录表单存在）。
 */
test.describe('[Functional] 导航与交互', () => {
  test('首页点击"隐私政策"跳转到 /privacy', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '隐私政策' }).first().click();
    await page.waitForURL('**/privacy');
    await expect(page.getByRole('heading', { name: '隐私政策 v0.1' })).toBeVisible();
  });

  test('首页点击"运营后台"进入 /admin Dashboard', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '运营后台' }).click();
    await page.waitForURL('**/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    // Dashboard 四张卡片（用 exact 避免匹配到 TODO 段落里的同名文字）
    await expect(page.getByText('在线人数', { exact: true })).toBeVisible();
    await expect(page.getByText('今日 AI 成本', { exact: true })).toBeVisible();
  });

  test('后台侧边栏可在各子页面间切换', async ({ page }: { page: Page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: '审核队列' }).click();
    await page.waitForURL('**/admin/audit');
    await expect(page.getByRole('heading', { name: '审核队列' })).toBeVisible();

    await page.getByRole('link', { name: '用户管理' }).click();
    await page.waitForURL('**/admin/users');
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('**/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('后台登录页含账号/密码输入与登录按钮', async ({ page }: { page: Page }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('heading', { name: '运营后台登录' })).toBeVisible();
    await expect(page.getByPlaceholder('账号')).toBeVisible();
    await expect(page.getByPlaceholder('密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('营销页头部导航 privacy/terms 链接可跳转', async ({ page }: { page: Page }) => {
    await page.goto('/privacy');
    await page.getByRole('link', { name: '用户协议' }).click();
    await page.waitForURL('**/terms');
    await expect(page.getByRole('heading', { name: '用户协议 v0.1' })).toBeVisible();
  });
});

test.describe('[Functional] 性能 · 首屏加载基准', () => {
  test('首页 LCP < 5s（dev 模式宽松阈值）', async ({ page }: { page: Page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.getByRole('heading', { level: 1 }).waitFor();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5_000);
  });
});
