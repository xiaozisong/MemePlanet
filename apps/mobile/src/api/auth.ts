import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';
import { useUserStore } from '../store/user.store';
import { setAuthToken, clearAuthToken } from './client';
import { tracker, CORE_EVENTS } from '../tracker/sdk';
import type { User } from '@memestar/shared';

/** 发送验证码 */
export function useSendOtp() {
  const api = useApi();
  return useMutation({
    mutationFn: (phone: string) =>
      api.post<{ sent: boolean; ttlSec: number }>('/auth/otp/send', { phone }, undefined, {
        skipAuth: true,
      }),
  });
}

/** 验证码登录 */
export function useVerifyOtp() {
  const api = useApi();
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const res = await api.post<{ token: string; userId: string }>(
        '/auth/otp/verify',
        { phone, code },
        undefined,
        { skipAuth: true },
      );
      await setAuthToken(res.token);
      tracker.setUserId(res.userId);
      return res;
    },
    onSuccess: async (_, vars) => {
      const me = await queryClient.fetchQuery<User>({
        queryKey: ['user', 'me'],
        queryFn: () => api.get<User>('/users/me'),
      });
      setUser(me);
      tracker.trackCore(CORE_EVENTS.LOGIN_SUCCESS, { phone: vars.phone, user_id: me.userId });
      void tracker.flushNow();
    },
  });
}

/** 获取当前用户 */
export function useMe() {
  const api = useApi();
  const setUser = useUserStore((s) => s.setUser);

  return useQuery<User | null>({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      try {
        const me = await api.get<User>('/users/me');
        setUser(me);
        tracker.setUserId(me.userId);
        return me;
      } catch {
        setUser(null);
        tracker.setUserId(null);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/** 退出登录 */
export function useLogout() {
  const api = useApi();
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } finally {
        await clearAuthToken();
        setUser(null);
        tracker.setUserId(null);
        queryClient.clear();
      }
    },
  });
}
