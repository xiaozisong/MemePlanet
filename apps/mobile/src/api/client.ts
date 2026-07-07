import { createApiClient, type ApiClient } from '@memestar/shared';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'memestar_jwt';
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export const apiClient: ApiClient = createApiClient({
  baseUrl,
  getAuthToken: async () => {
    try {
      return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? undefined;
    } catch {
      return undefined;
    }
  },
  timeout: 10000,
});

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
