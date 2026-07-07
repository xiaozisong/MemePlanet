import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const tabIcon = (label: string) => () => <Text className="text-xs">{label}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF5A1F',
        tabBarStyle: { backgroundColor: '#0F0F12', borderTopColor: '#1A1A20' },
        headerStyle: { backgroundColor: '#0F0F12' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{ title: 'Feed', tabBarIcon: tabIcon('🔥') }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: '造梗', tabBarIcon: tabIcon('✨') }}
      />
      <Tabs.Screen
        name="legion"
        options={{ title: '军团', tabBarIcon: tabIcon('🛡️') }}
      />
      <Tabs.Screen
        name="pk"
        options={{ title: 'PK', tabBarIcon: tabIcon('⚔️') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '我的', tabBarIcon: tabIcon('👤') }}
      />
    </Tabs>
  );
}
