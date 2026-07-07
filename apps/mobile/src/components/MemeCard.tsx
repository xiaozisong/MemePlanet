import React from 'react';
import { View, Text } from 'react-native';

export function MemeCard({ title }: { title: string }) {
  return (
    <View className="bg-ink-soft rounded-xl p-4 mb-3">
      <Text className="text-white">{title}</Text>
    </View>
  );
}
