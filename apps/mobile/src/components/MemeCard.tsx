import React from 'react';
import { View, Text } from 'react-native';

export function MemeCard({ title }: { title: string }) {
  return (
    <View className="bg-ink-soft mb-3 rounded-xl p-4">
      <Text className="text-white">{title}</Text>
    </View>
  );
}
