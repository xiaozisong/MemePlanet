import React from 'react';
import { View, Text } from 'react-native';

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-4">登录</Text>
      <Text className="text-gray-400">M1 S2 接入：手机号验证码 + 微信/Apple OAuth（M2）</Text>
    </View>
  );
}
