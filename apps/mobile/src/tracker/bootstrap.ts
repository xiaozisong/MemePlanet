/**
 * Tracker 与 API client 集成的入口 hook
 *
 * 在 App 根部调用 useTrackerBootstrap()，自动完成：
 * 1. 注入 API 客户端的 batch 上报函数
 * 2. 同步当前 userStore 的 userId 到 tracker
 * 3. 在 mount 时初始化 SDK（上报 app_launch）
 */

import { useEffect } from 'react';
import { useApi } from '../api/provider';
import { useUserStore } from '../store/user.store';
import { initTracker, tracker } from './sdk';

export function useTrackerBootstrap() {
  const api = useApi();
  const user = useUserStore((s) => s.user);

  // 初次挂载：注入 poster + init SDK（只跑一次）
  useEffect(() => {
    void initTracker(
      (body) => api.post('/analytics/event/batch', body, undefined, { skipAuth: true }),
      user?.userId ?? null,
    );
  }, []);

  // 用户态变化：同步 userId
  useEffect(() => {
    tracker.setUserId(user?.userId ?? null);
  }, [user?.userId]);
}
