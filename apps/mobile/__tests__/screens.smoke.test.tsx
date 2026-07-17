/**
 * @jest-environment jsdom
 */

import React from 'react';
import TestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider } from '../src/api/provider';

/**
 * 屏幕渲染冒烟测试 · 各 Tab / 子页 / 独立页可渲染
 *
 * 使用 react-test-renderer + jsdom 环境走真实 React 调和器，
 * 确保组件渲染不抛出异常。不使用 act() 包裹以规避 react-query
 * 异步错误被 AggregateError 遮蔽的问题（smoke test 只关心渲染不崩溃）。
 */

// jsdom 环境缺少 fetch，ApiClient 构造会引用它
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ code: 0, data: null, message: 'mock' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
}

import FeedScreen from '../app/(tabs)/feed';
import CreateTabScreen from '../app/(tabs)/create';
import LegionScreen from '../app/(tabs)/legion';
import PKScreen from '../app/(tabs)/pk';
import ProfileScreen from '../app/(tabs)/profile';
import LoginScreen from '../app/login';
import SettingsScreen from '../app/settings';
import TeenModeScreen from '../app/teen-mode';
import CreateTextScreen from '../app/create/text';
import CreateImageScreen from '../app/create/image';
import CreateVideoScreen from '../app/create/video';
import CreateAgentScreen from '../app/create/agent';

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0, staleTime: Infinity },
    mutations: { retry: false },
  },
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <ApiProvider>{children}</ApiProvider>
    </QueryClientProvider>
  );
}

function renderInApp<P extends object>(Component: React.ComponentType<P>) {
  TestRenderer.create(
    <TestWrapper>
      <Component {...({} as unknown as P)} />
    </TestWrapper>,
  );
  // 不抛出异常即视为渲染成功
}

describe('[Smoke] Mobile 各 Tab 屏幕可渲染', () => {
  test('Feed 屏', () => renderInApp(FeedScreen));
  test('造梗 Tab', () => renderInApp(CreateTabScreen));
  test('军团屏', () => renderInApp(LegionScreen));
  test('PK 屏', () => renderInApp(PKScreen));
  test('我的屏', () => renderInApp(ProfileScreen));
});

describe('[Smoke] 独立页可渲染', () => {
  test('登录屏', () => renderInApp(LoginScreen));
  test('设置屏', () => renderInApp(SettingsScreen));
  test('青少年模式屏', () => renderInApp(TeenModeScreen));
});

describe('[Smoke] 造梗子流程各页可渲染', () => {
  test('文本造梗页', () => renderInApp(CreateTextScreen));
  test('图片造梗页', () => renderInApp(CreateImageScreen));
  test('视频造梗页', () => renderInApp(CreateVideoScreen));
  test('Pro Agent 造梗页', () => renderInApp(CreateAgentScreen));
});
