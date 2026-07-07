import React from 'react';

/**
 * 最小化 react-native mock，供 jest 单元/组件测试使用。
 * 仅覆盖 App 当前用到的 host 组件：View / Text / ScrollView / RefreshControl / Pressable / FlatList。
 * className 等 nativewind props 在测试环境下直接透传忽略（不应用样式）。
 */

type Props = { children?: React.ReactNode; [k: string]: unknown };

const host = (tag: string) => ({ children, ...rest }: Props) =>
  React.createElement(tag, rest as Record<string, unknown>, children);

export const View = host('View');
export const Text = host('Text');
export const ScrollView = host('ScrollView');
export const Pressable = host('Pressable');

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

export default {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
};
