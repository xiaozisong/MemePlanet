import { useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useApi } from './provider';
import { useUserStore } from '../store/user.store';
import { tracker, CORE_EVENTS } from '../tracker/sdk';
import type { MemeCardData } from '../components/MemeCard';

interface FeedListResponse {
  list: MemeCardData[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

interface HotListResponse {
  list: MemeCardData[];
  total: number;
}

/** 热度榜（公开端点 GET /recommend/hot?limit=N） */
export function useHotRank(limit = 20) {
  const api = useApi();
  return useQuery<HotListResponse>({
    queryKey: ['feed', 'hot', limit],
    queryFn: () => api.get<HotListResponse>('/recommend/hot', { limit }, { skipAuth: true }),
    staleTime: 5 * 60 * 1000,
  });
}

/** 个性化推荐 feed（需登录 GET /recommend/feed?page=N） */
export function usePersonalizedFeed(pageSize = 20) {
  const api = useApi();
  return useInfiniteQuery<FeedListResponse>({
    queryKey: ['feed', 'personalized', pageSize],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 1;
      return api.get<FeedListResponse>('/recommend/feed', { page });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    staleTime: 60 * 1000,
  });
}

/** 公开 meme feed（游客可读 GET /memes/feed?page=&pageSize=） */
export function useMemeFeed(pageSize = 20) {
  const api = useApi();
  return useInfiniteQuery<FeedListResponse>({
    queryKey: ['feed', 'public', pageSize],
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 1;
      return api.get<FeedListResponse>('/memes/feed', { page, pageSize }, { skipAuth: true });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.page + 1 : undefined),
    staleTime: 60 * 1000,
  });
}

/** 综合首页 feed：登录态走个性化，游客走公开 */
export function useHomeFeed() {
  const user = useUserStore((s) => s.user);
  return user ? usePersonalizedFeed() : useMemeFeed();
}

/** 上报 meme_view（直接调用，不依赖 React Query） */
export function trackMemeView(memeId: string) {
  tracker.trackCore(CORE_EVENTS.MEME_VIEW, { meme_id: memeId });
  void tracker.flushNow();
}

/** Hook 形态：返回一个稳定的 track 函数 */
export function useTrackMemeView() {
  return useCallback((memeId: string) => {
    trackMemeView(memeId);
  }, []);
}
