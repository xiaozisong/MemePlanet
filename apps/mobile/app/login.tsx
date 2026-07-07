import React from 'react';
import { View, Text } from 'react-native';

export default function LoginScreen() {
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-4 text-2xl font-bold text-white">登录</Text>
      <Text className="text-gray-400">M1 S2 接入：手机号验证码 + 微信/Apple OAuth（M2）</Text>
    </View>
  );
}
