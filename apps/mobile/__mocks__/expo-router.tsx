import React from 'react';

/**
 * expo-router jest mock：绕开 expo-router 6 build 产物里 .js 文件含 JSX
 * 导致 ts-jest 无法解析的问题。仅提供 App 当前用到的 API。
 */

type Props = { children?: React.ReactNode; [k: string]: unknown };

const Passthrough = ({ children }: Props) => (children != null ? <>{children}</> : null);

export const Stack = Object.assign(Passthrough, {
  Screen: (_props: unknown) => null,
});

export const Tabs = Object.assign(Passthrough, {
  Screen: (_props: unknown) => null,
});

export const Link = Passthrough;

const router = {
  push: (_href: string) => undefined,
  replace: (_href: string) => undefined,
  back: () => undefined,
  navigate: (_href: string) => undefined,
};

export function useRouter() {
  return router;
}

export function usePathname(): string {
  return '/';
}

export function useSegments(): string[] {
  return [];
}

export default { Stack, Tabs, Link, useRouter, usePathname, useSegments };
