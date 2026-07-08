import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../src/styles/global.css';
import { ApiProvider } from '../src/api/provider';
import { colors } from '@/theme';

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
              headerStyle: { backgroundColor: colors.ink.DEFAULT },
              headerTintColor: colors.text.primary,
              headerTitleStyle: { fontSize: 18, fontWeight: '700' as const },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.ink.DEFAULT },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ApiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
