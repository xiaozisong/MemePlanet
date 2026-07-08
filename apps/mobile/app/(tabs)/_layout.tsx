import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
  TabFeedIcon,
  TabCreateIcon,
  TabLegionIcon,
  TabPkIcon,
  TabProfileIcon,
} from '@/components/icons';
import { colors, layout } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand.DEFAULT,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.ink.DEFAULT,
          borderTopColor: colors.ink.soft,
          borderTopWidth: 1,
          height: layout.tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        headerStyle: { backgroundColor: colors.ink.DEFAULT },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontSize: 18, fontWeight: '700' as const },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabFeedIcon focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '造梗',
          tabBarIcon: ({ focused }) => <TabCreateIcon focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="legion"
        options={{
          title: '军团',
          tabBarIcon: ({ focused }) => <TabLegionIcon focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="pk"
        options={{
          title: 'PK',
          tabBarIcon: ({ focused }) => <TabPkIcon focused={focused} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => <TabProfileIcon focused={focused} size={24} />,
        }}
      />
    </Tabs>
  );
}
