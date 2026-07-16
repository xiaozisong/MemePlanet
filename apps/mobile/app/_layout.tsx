import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import * as Font from 'expo-font';

import '../src/styles/global.css';
import { ApiProvider } from '../src/api/provider';
import { colors } from '@/theme';
import { useMe } from '../src/api/auth';
import { useTrackerBootstrap } from '../src/tracker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Poppins_400Regular: require('../assets/fonts/Poppins_400Regular.ttf'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Poppins_500Medium: require('../assets/fonts/Poppins_500Medium.ttf'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Poppins_600SemiBold: require('../assets/fonts/Poppins_600SemiBold.ttf'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Poppins_700Bold: require('../assets/fonts/Poppins_700Bold.ttf'),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Poppins_800ExtraBold: require('../assets/fonts/Poppins_800ExtraBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.ink.DEFAULT,
        }}
      >
        <ActivityIndicator color={colors.brand.DEFAULT} size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

/** 应用启动时自动恢复登录态 + 初始化 Tracker */
function AppBoot() {
  useMe();
  useTrackerBootstrap();
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ApiProvider>
          <StatusBar style="light" />
          <FontLoader>
            <AppBoot />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.ink.DEFAULT },
                headerTintColor: colors.text.primary,
                headerTitleStyle: {
                  fontFamily: 'Poppins_600SemiBold',
                  fontSize: 18,
                  fontWeight: '600' as const,
                },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.ink.DEFAULT },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </FontLoader>
        </ApiProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
