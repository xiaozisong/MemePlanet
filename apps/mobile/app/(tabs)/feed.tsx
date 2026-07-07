import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';

export default function FeedScreen() {
  return (
    <ScrollView
      className="bg-ink flex-1"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => undefined} />}
    >
      <View className="p-4">
        <Text className="mb-2 text-2xl font-bold text-white">🔥 推荐 Feed</Text>
        <Text className="text-gray-400">M1 S4 接入：热度召回 + 多样性重排</Text>
        {/* TODO: 瀑布流 + 骨架屏 + LQIP */}
      </View>
    </ScrollView>
  );
}
