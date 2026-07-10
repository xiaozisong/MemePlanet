import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../src/theme';

export default function TeenModeScreen() {
  return (
    <View
      style={{
        backgroundColor: colors.ink.DEFAULT,
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <Text style={{ fontSize: 24, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
        青少年模式
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontFamily: 'Poppins_400Regular',
          color: colors.text.secondary,
          marginTop: 8,
        }}
      >
        每日 ≤ 40 分钟 · 22:00-06:00 禁用 · 禁发布/评分/私信 · 仅展示正能量精选池
      </Text>
    </View>
  );
}
