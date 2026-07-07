import React from 'react';
import { View, Text } from 'react-native';

export default function PKScreen() {
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-2">⚔️ PK 大厅</Text>
      <Text className="text-gray-400">M2 接入：进行中 PK + 投票 + 实时比分 + 战报</Text>
    </View>
  );
}
