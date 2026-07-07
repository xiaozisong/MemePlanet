import { createApiClient, type ApiClient } from '@memestar/shared';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

let _client: ApiClient | undefined;

export function getApiClient(): ApiClient {
  if (!_client) {
    _client = createApiClient({
      baseUrl,
      getAuthToken: () => {
        if (typeof window === 'undefined') return undefined;
        return localStorage.getItem('memestar_jwt') ?? undefined;
      },
      timeout: 10000,
    });
  }
  return _client;
}
