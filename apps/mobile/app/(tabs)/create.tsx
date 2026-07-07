import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreateScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-4">✨ AI 造梗工坊</Text>

      <Pressable className="bg-brand rounded-xl p-4 mb-3" onPress={() => router.push('/create/text')}>
        <Text className="text-white text-center font-semibold">文本造梗（3 候选）</Text>
      </Pressable>
      <Pressable className="bg-ink-soft rounded-xl p-4 mb-3" onPress={() => router.push('/create/image')}>
        <Text className="text-white text-center">图片造梗（1 候选 + 再来一次）</Text>
      </Pressable>
      <Pressable className="bg-ink-soft rounded-xl p-4 mb-3" onPress={() => router.push('/create/video')}>
        <Text className="text-white text-center">AI 视频生成（M2）</Text>
      </Pressable>
      <Pressable className="bg-ink-soft rounded-xl p-4" onPress={() => router.push('/create/agent')}>
        <Text className="text-white text-center">Pro Agent 模式（M2）</Text>
      </Pressable>
    </View>
  );
}
