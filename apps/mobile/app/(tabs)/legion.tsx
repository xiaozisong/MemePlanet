import React from 'react';
import { View, Text, FlatList } from 'react-native';

export default function LegionScreen() {
  return (
    <View className="flex-1 bg-ink p-4">
      <Text className="text-white text-2xl font-bold mb-2">🛡️ 梗大军</Text>
      <Text className="text-gray-400">M2 接入：军团广场 + 创建 + 加入 + 群聊</Text>
      <FlatList
        data={[]}
        renderItem={null}
        ListEmptyComponent={<Text className="text-gray-500 mt-4">暂无军团</Text>}
      />
    </View>
  );
}
