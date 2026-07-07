import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiProvider } from '../src/api/provider.js';

// Sentry / PostHog 在生产环境按 EXPO_PUBLIC_* 初始化
// import * as Sentry from '@sentry/react-native';
// if (process.env.EXPO_PUBLIC_SENTRY_DSN) Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#0F0F12' },
              headerTintColor: '#fff',
              contentStyle: { backgroundColor: '#0F0F12' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ApiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
