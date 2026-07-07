import React from 'react';
import { View, Text, FlatList } from 'react-native';

export default function LegionScreen() {
  return (
    <View className="bg-ink flex-1 p-4">
      <Text className="mb-2 text-2xl font-bold text-white">🛡️ 梗大军</Text>
      <Text className="text-gray-400">M2 接入：军团广场 + 创建 + 加入 + 群聊</Text>
      <FlatList
        data={[]}
        renderItem={null}
        ListEmptyComponent={<Text className="mt-4 text-gray-500">暂无军团</Text>}
      />
    </View>
  );
}
