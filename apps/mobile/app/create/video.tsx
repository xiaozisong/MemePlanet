import React from 'react';
import { View, Text } from 'react-native';

export default function CreateVideoScreen() {
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-2 text-2xl font-bold text-white">AI 视频生成</Text>
      <Text className="text-gray-400">M2 接入：豆包 Seedance + 图片 TTS 兜底</Text>
    </View>
  );
}
