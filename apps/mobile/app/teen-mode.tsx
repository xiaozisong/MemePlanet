import React from 'react';
import { View, Text } from 'react-native';

export default function TeenModeScreen() {
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="text-2xl font-bold text-white">青少年模式</Text>
      <Text className="mt-2 text-gray-400">
        每日 ≤ 40 分钟 · 22:00-06:00 禁用 · 禁发布/评分/私信 · 仅展示正能量精选池
      </Text>
    </View>
  );
}
