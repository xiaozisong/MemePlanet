import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreateScreen() {
  const router = useRouter();
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-4 text-2xl font-bold text-white">✨ AI 造梗工坊</Text>

      <Pressable
        className="bg-brand mb-3 rounded-xl p-4"
        onPress={() => router.push('/create/text')}
      >
        <Text className="text-center font-semibold text-white">文本造梗（3 候选）</Text>
      </Pressable>
      <Pressable
        className="bg-ink-soft mb-3 rounded-xl p-4"
        onPress={() => router.push('/create/image')}
      >
        <Text className="text-center text-white">图片造梗（1 候选 + 再来一次）</Text>
      </Pressable>
      <Pressable
        className="bg-ink-soft mb-3 rounded-xl p-4"
        onPress={() => router.push('/create/video')}
      >
        <Text className="text-center text-white">AI 视频生成（M2）</Text>
      </Pressable>
      <Pressable
        className="bg-ink-soft rounded-xl p-4"
        onPress={() => router.push('/create/agent')}
      >
        <Text className="text-center text-white">Pro Agent 模式（M2）</Text>
      </Pressable>
    </View>
  );
}
