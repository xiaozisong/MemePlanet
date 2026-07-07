import React from 'react';
import { View, Text } from 'react-native';

export default function CreateTextScreen() {
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-2">文本造梗</Text>
      <Text className="text-gray-400">M1 S3：关键词输入 → 3 候选盲盒 → 微调发布</Text>
    </View>
  );
}
