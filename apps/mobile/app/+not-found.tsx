import React from 'react';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 bg-ink items-center justify-center p-4">
      <Text className="text-white text-xl">404 · 页面不存在</Text>
    </View>
  );
}
