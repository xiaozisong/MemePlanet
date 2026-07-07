import React from 'react';
import { View, Text } from 'react-native';

export default function CreateImageScreen() {
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-2">图片造梗</Text>
      <Text className="text-gray-400">M1 S3：描述输入 → 风格选择 → 1 候选 → 再来一次</Text>
    </View>
  );
}
