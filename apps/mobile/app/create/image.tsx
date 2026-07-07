import React from 'react';
import { View, Text } from 'react-native';

export default function CreateImageScreen() {
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-2 text-2xl font-bold text-white">图片造梗</Text>
      <Text className="text-gray-400">M1 S3：描述输入 → 风格选择 → 1 候选 → 再来一次</Text>
    </View>
  );
}
