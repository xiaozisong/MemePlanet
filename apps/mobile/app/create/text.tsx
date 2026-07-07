import React from 'react';
import { View, Text } from 'react-native';

export default function CreateTextScreen() {
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-2 text-2xl font-bold text-white">文本造梗</Text>
      <Text className="text-gray-400">M1 S3：关键词输入 → 3 候选盲盒 → 微调发布</Text>
    </View>
  );
}
