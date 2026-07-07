import React from 'react';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="bg-ink flex-1 items-center justify-center p-4">
      <Text className="text-xl text-white">404 · 页面不存在</Text>
    </View>
  );
}
