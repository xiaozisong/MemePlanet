import React from 'react';
import { MemeCard } from '../src/components/MemeCard';

/**
 * React 19 已废弃 react-test-renderer（create 后立即 unmount，toJSON 恒为 null）。
 * 这里改为直接调用函数组件拿到 React 元素树（普通 JS 对象），手动递归遍历
 * props.children 收集字符串叶子，验证渲染内容。
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

function render<C extends React.ComponentType>(Component: C, props?: React.ComponentProps<C>): string[] {
  const el = (Component as (p: React.ComponentProps<C>) => React.ReactElement)(props as React.ComponentProps<C>);
  return collectStrings(el);
}

describe('[Component] MemeCard 组件', () => {
  test('渲染 title 文案', () => {
    const texts = render(MemeCard, { title: '测试梗卡' });
    expect(texts.some((t) => t.includes('测试梗卡'))).toBe(true);
  });

  test('不同 title 多次渲染不抛错', () => {
    for (let i = 0; i < 5; i++) {
      const texts = render(MemeCard, { title: `梗${i}` });
      expect(texts.some((t) => t.includes(`梗${i}`))).toBe(true);
    }
  });

  test('渲染产物是合法 React 元素', () => {
    const el = (MemeCard as (p: { title: string }) => React.ReactElement)({ title: 'x' });
    expect(React.isValidElement(el)).toBe(true);
  });
});
