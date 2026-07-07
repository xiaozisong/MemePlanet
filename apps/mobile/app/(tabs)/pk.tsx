import React from 'react';
import { View, Text } from 'react-native';

export default function PKScreen() {
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-2 text-2xl font-bold text-white">⚔️ PK 大厅</Text>
      <Text className="text-gray-400">M2 接入：进行中 PK + 投票 + 实时比分 + 战报</Text>
    </View>
  );
}
