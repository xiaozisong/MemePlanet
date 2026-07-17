import React from 'react';

/**
 * 最小化 react-native mock，供 jest 单元/组件测试使用。
 * 覆盖 App 当前用到的 host 组件 + Platform / Image / TextInput / ActivityIndicator / KeyboardAvoidingView。
 * className 等 nativewind props 在测试环境下直接透传忽略（不应用样式）。
 */

type Props = { children?: React.ReactNode; [k: string]: unknown };

const host =
  (tag: string) =>
  ({ children, ...rest }: Props) =>
    React.createElement(tag, rest as Record<string, unknown>, children);

export const View = host('View');
export const Text = host('Text');
export const ScrollView = host('ScrollView');
export const Pressable = host('Pressable');
export const TextInput = host('TextInput');
export const ActivityIndicator = ({ ...rest }: Props) =>
  React.createElement('ActivityIndicator', rest as Record<string, unknown>, null);
export const KeyboardAvoidingView = host('KeyboardAvoidingView');
export const Image = ({ ...rest }: Props) =>
  React.createElement('Image', rest as Record<string, unknown>, null);
export const SafeAreaView = host('SafeAreaView');

export const RefreshControl: React.FC<Props> = () => null;

export const FlatList: React.FC<{
  data?: unknown[];
  renderItem?: (info: { item: unknown; index: number }) => React.ReactNode;
  ListEmptyComponent?: React.ComponentType;
  [k: string]: unknown;
}> = ({ data, renderItem, ListEmptyComponent }) => {
  if (!data || data.length === 0) {
    return ListEmptyComponent ? React.createElement(ListEmptyComponent) : null;
  }
  return React.createElement(
    'FlatList',
    null,
    data.map((d, i) => (renderItem ? renderItem({ item: d, index: i }) : null)),
  );
};

/** Platform.select 在 node 环境回退到 default 分支 */
export const Platform = {
  OS: 'ios',
  select: (options: Record<string, unknown> | unknown): unknown => {
    if (
      options &&
      typeof options === 'object' &&
      'default' in (options as Record<string, unknown>)
    ) {
      const opts = options as Record<string, unknown>;
      return opts.ios ?? opts.android ?? opts.default;
    }
    return options;
  },
};

/** StyleSheet.create 在测试环境下原样返回（不做样式转换） */
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown): Record<string, unknown> => {
    if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean));
    return (style as Record<string, unknown>) ?? {};
  },
  hairlineWidth: 1,
};

/** Dimensions 简单 mock：返回固定窗口尺寸 */
export const Dimensions = {
  get: (): { width: number; height: number; scale: number; fontScale: number } => ({
    width: 375,
    height: 812,
    scale: 1,
    fontScale: 1,
  }),
  addEventListener: () => () => undefined,
  removeEventListener: () => undefined,
};

/** useColorScheme 在测试环境下默认返回 light */
export const useColorScheme = (): 'light' | 'dark' | null => 'light';

/** Easing 简单 1:1 mock */
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  in: (t: number) => t,
  out: (t: number) => t,
  inOut: (t: number) => t,
};

/** Animated 简单 mock */
export const Animated = {
  Value: class {
    constructor(public value = 0) {}
  },
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
  spring: () => ({ start: (cb?: () => void) => cb?.() }),
  loop: () => ({ start: () => undefined, stop: () => undefined }),
  View: ({ children }: Props) => children ?? null,
  Text: ({ children }: Props) => children ?? null,
};

/** StatusBar 在测试环境下 noop */
export const StatusBar = {
  setBarStyle: () => undefined,
  setHidden: () => undefined,
  setNetworkActivityIndicatorVisible: () => undefined,
  setBackgroundColor: () => undefined,
  setTranslucent: () => undefined,
  currentHeight: 44,
};

export default {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  SafeAreaView,
  RefreshControl,
  FlatList,
  Platform,
  StyleSheet,
  Dimensions,
  useColorScheme,
  Easing,
  Animated,
  StatusBar,
};
