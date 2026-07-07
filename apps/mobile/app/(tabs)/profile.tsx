import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-4 text-2xl font-bold text-white">👤 我的</Text>

      <View className="bg-ink-soft mb-3 rounded-xl p-4">
        <Text className="text-lg text-white">Lv.1 · 梗力值 0</Text>
        <Text className="mt-1 text-gray-400">能量 100 / 100</Text>
      </View>

      <Pressable
        className="bg-ink-soft mb-3 rounded-xl p-4"
        onPress={() => router.push('/settings')}
      >
        <Text className="text-white">设置</Text>
      </Pressable>
      <Pressable
        className="bg-ink-soft mb-3 rounded-xl p-4"
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
