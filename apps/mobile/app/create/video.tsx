import React from 'react';
import { View, Text } from 'react-native';

export default function CreateVideoScreen() {
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-2">AI 视频生成</Text>
      <Text className="text-gray-400">M2 接入：豆包 Seedance + 图片 TTS 兜底</Text>
    </View>
  );
}
