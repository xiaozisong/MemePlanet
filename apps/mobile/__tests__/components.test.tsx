import React from 'react';
import { MemeCard } from '../src/components/MemeCard';
import type { MemeCardData } from '../src/components/MemeCard';

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

function makeMockMeme(title: string): MemeCardData {
  return {
    meme_id: 'test-1',
    title,
    author_nickname: '测试用户',
    author_avatar_url: null,
    type: 'text',
    cover_url: null,
    score_avg: 8.5,
    score_count: 10,
    comment_count: 5,
    favorite_count: 20,
    share_count: 3,
    is_ai_generated: false,
    tags: [],
    published_at: '2026-07-08T12:00:00Z',
  };
}

describe('[Component] MemeCard 组件', () => {
  test('渲染 title 文案', () => {
    const el = MemeCard({ meme: makeMockMeme('测试梗卡'), onPress: undefined });
    const texts = collectStrings(el);
    expect(texts.some((t) => t.includes('测试梗卡'))).toBe(true);
  });

  test('不同 title 多次渲染不抛错', () => {
    for (let i = 0; i < 5; i++) {
      const el = MemeCard({ meme: makeMockMeme(`梗${i}`), onPress: undefined });
      const texts = collectStrings(el);
      expect(texts.some((t) => t.includes(`梗${i}`))).toBe(true);
    }
  });

  test('渲染产物是合法 React 元素', () => {
    const el = MemeCard({ meme: makeMockMeme('x'), onPress: undefined });
    expect(React.isValidElement(el)).toBe(true);
  });
});
