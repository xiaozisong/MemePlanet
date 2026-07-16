import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';

interface InterestTag {
  key: string;
  label: string;
  emoji?: string;
  category?: string;
}

interface InterestDictResponse {
  tags: InterestTag[];
  coldStart: {
    min_count: number;
    max_count: number;
    default_tags: string[];
  };
}

/** GET /users/me 返回值（camelCase，匹配 Drizzle select 显式重命名） */
interface UserProfile {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthday?: string | null;
  bio?: string | null;
  level: number;
  memePower: number;
  defenseValue: number;
  energyBalance: number;
  legionCount: number;
  isPro: boolean;
  interestTags: string[];
  badges: string[];
  status: 'active' | 'banned' | 'teen_mode' | 'deleted';
  lastLoginAt: string;
  createdAt: string;
}

/** GET /users/:id 返回值（camelCase） */
interface UserHome {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  memePower: number;
  defenseValue: number;
  isPro: boolean;
  isFollowing: boolean;
  legionIds: string[];
  stats: {
    memeCount: number;
    godMemeCount: number;
    avgScore: number;
    pkWins: number;
  };
  badges: string[];
}

/** GET /users/me/power 返回值（camelCase） */
interface MemePower {
  userId: string;
  memePower: number;
  level: number;
  defenseValue: number;
  energyBalance: number;
  maxEnergy: number;
  levelProgress: {
    currentLevel: number;
    currentLabel: string;
    currentMemePower: number;
    nextLevel: number | null;
    nextLabel: string | null;
    memePowerNeeded: number;
    progressPercent: number;
  };
}

/** 获取当前用户完整资料（GET /users/me） */
export function useMyProfile() {
  const api = useApi();
  return useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<UserProfile>('/users/me'),
    staleTime: 5 * 60 * 1000,
  });
}

/** 更新个人资料（PATCH /users/me） */
export function useUpdateProfile() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      nickname?: string;
      avatarUrl?: string;
      gender?: 'male' | 'female' | 'other' | 'unknown';
      bio?: string;
      birthday?: string;
    }) => api.patch<UserProfile>('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

/** 获取他人主页（GET /users/:id） */
export function useUserHome(userId: string) {
  const api = useApi();
  return useQuery<UserHome>({
    queryKey: ['user', 'home', userId],
    queryFn: () => api.get<UserHome>(`/users/${userId}`),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

/** 梗力值/能量概览（GET /users/me/power） */
export function useMemePower() {
  const api = useApi();
  return useQuery<MemePower>({
    queryKey: ['user', 'power'],
    queryFn: () => api.get<MemePower>('/users/me/power'),
    staleTime: 30 * 1000,
  });
}

/** 等级详情含进度（GET /users/me/level） */
export function useLevelDetail() {
  const api = useApi();
  return useQuery({
    queryKey: ['user', 'level'],
    queryFn: () => api.get('/users/me/level'),
    staleTime: 60 * 1000,
  });
}

/** 兴趣标签字典（GET /users/interest-tags/dictionary，公开） */
export function useInterestDictionary() {
  const api = useApi();
  return useQuery<InterestDictResponse>({
    queryKey: ['interest-tags', 'dictionary'],
    queryFn: () =>
      api.get<InterestDictResponse>('/users/interest-tags/dictionary', undefined, {
        skipAuth: true,
      }),
    staleTime: 30 * 60 * 1000,
  });
}

/** 我的兴趣标签（GET /users/me/interests） */
export function useMyInterests() {
  const api = useApi();
  return useQuery<string[]>({
    queryKey: ['user', 'me', 'interests'],
    queryFn: () => api.get<string[]>('/users/me/interests'),
    staleTime: 10 * 60 * 1000,
  });
}

/** 更新兴趣标签（PATCH /users/me/interests） */
export function useUpdateInterests() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tags: string[]) => api.patch('/users/me/interests', { tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'interests'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
