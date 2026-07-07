import React from 'react';
import { View, Text } from 'react-native';

export default function CreateAgentScreen() {
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-2">Pro Agent 造梗</Text>
      <Text className="text-gray-400">
        M2 接入：RAG 检索 → 3 候选 → 自评选优（10 次/日硬配额 + 日预算熔断）
      </Text>
    </View>
  );
}
