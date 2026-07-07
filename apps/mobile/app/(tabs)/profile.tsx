import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-4">👤 我的</Text>

      <View className="bg-ink-soft rounded-xl p-4 mb-3">
        <Text className="text-white text-lg">Lv.1 · 梗力值 0</Text>
        <Text className="text-gray-400 mt-1">能量 100 / 100</Text>
      </View>

      <Pressable className="bg-ink-soft rounded-xl p-4 mb-3" onPress={() => router.push('/settings')}>
        <Text className="text-white">设置</Text>
      </Pressable>
      <Pressable
        className="bg-ink-soft rounded-xl p-4 mb-3"
        onPress={() => router.push('/teen-mode')}
      >
        <Text className="text-white">青少年模式</Text>
      </Pressable>
      <Pressable className="bg-ink-soft rounded-xl p-4" onPress={() => router.push('/login')}>
        <Text className="text-white">登录 / 切换账号</Text>
      </Pressable>
    </View>
  );
}
