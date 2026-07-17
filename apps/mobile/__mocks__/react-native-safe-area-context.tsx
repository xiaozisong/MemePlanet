import React from 'react';

/**
 * Mock react-native-safe-area-context for jest tests.
 * 提供最小的 SafeAreaView / SafeAreaProvider 实现，无需 native module。
 */
type Props = { children?: React.ReactNode; [k: string]: unknown };

export const SafeAreaProvider: React.FC<Props> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

export const SafeAreaView: React.FC<Props> = ({ children, ...rest }) =>
  React.createElement('SafeAreaView', rest as Record<string, unknown>, children);

export const useSafeAreaInsets = () => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

export const useSafeAreaFrame = () => ({
  x: 0,
  y: 0,
  width: 375,
  height: 812,
});

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
  useSafeAreaFrame,
};
