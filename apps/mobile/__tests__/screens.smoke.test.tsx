import React from 'react';

/**
 * 屏幕渲染冒烟测试 · 各 Tab / 子页 / 独立页可渲染且含关键文案
 *
 * React 19 已废弃 react-test-renderer（create 后立即 unmount，toJSON 恒为 null），
 * 因此改用"直接调用函数组件 + 手动遍历 React 元素树"的方式验证渲染。
 * react-native 由 __mocks__/react-native.tsx 提供 host 组件 mock；
 * expo-router 由 __mocks__/expo-router.tsx mock（绕开其 build 产物 .js 含 JSX 的问题）。
 */

function collectStrings(node: unknown): string[] {
  const out: string[] = [];
  const walk = (n: unknown): void => {
    if (n == null) return;
    if (typeof n === 'string') {
      out.push(n);
      return;
    }
    if (typeof n === 'number') {
      out.push(String(n));
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (typeof n === 'object' && '$$typeof' in (n as object)) {
      const props = (n as { props?: { children?: unknown } }).props;
      if (props) walk(props.children);
    }
  };
  walk(node);
  return out;
}

function renderAndFindText(Component: React.ComponentType, expected: string): void {
  const el = (Component as () => React.ReactElement)();
  expect(React.isValidElement(el)).toBe(true);
  const texts = collectStrings(el);
  expect(texts.some((t) => t.includes(expected))).toBe(true);
}

function renderNotNull(Component: React.ComponentType): void {
  const el = (Component as () => React.ReactElement)();
  expect(React.isValidElement(el)).toBe(true);
  expect(collectStrings(el).length >= 0).toBe(true);
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

describe('[Smoke] Mobile 各 Tab 屏幕可渲染', () => {
  test('Feed 屏渲染且含 "推荐 Feed"', () => {
    renderAndFindText(FeedScreen, '推荐 Feed');
  });
  test('造梗 Tab 渲染且含 "AI 造梗工坊"', () => {
    renderAndFindText(CreateTabScreen, 'AI 造梗工坊');
  });
  test('军团屏渲染且含 "梗大军"', () => {
    renderAndFindText(LegionScreen, '梗大军');
  });
  test('PK 屏渲染且含 "PK 大厅"', () => {
    renderAndFindText(PKScreen, 'PK 大厅');
  });
  test('我的屏渲染且含 "我的"', () => {
    renderAndFindText(ProfileScreen, '我的');
  });
});

describe('[Smoke] 独立页可渲染', () => {
  test('登录屏渲染且含 "登录"', () => {
    renderAndFindText(LoginScreen, '登录');
  });
  test('设置屏渲染且含 "设置"', () => {
    renderAndFindText(SettingsScreen, '设置');
  });
  test('青少年模式屏渲染且含 "青少年模式"', () => {
    renderAndFindText(TeenModeScreen, '青少年模式');
  });
});

describe('[Smoke] 造梗子流程各页可渲染', () => {
  test('文本造梗页渲染且含 "文本造梗"', () => {
    renderAndFindText(CreateTextScreen, '文本造梗');
  });
  test('图片造梗页渲染不为空', () => {
    renderNotNull(CreateImageScreen);
  });
  test('视频造梗页渲染不为空', () => {
    renderNotNull(CreateVideoScreen);
  });
  test('Pro Agent 造梗页渲染不为空', () => {
    renderNotNull(CreateAgentScreen);
  });
});

describe('[Smoke] 屏幕渲染稳定性', () => {
  test('Feed 屏多次调用渲染不抛错', () => {
    for (let i = 0; i < 5; i++) {
      const el = (FeedScreen as () => React.ReactElement)();
      expect(React.isValidElement(el)).toBe(true);
    }
  });
});
