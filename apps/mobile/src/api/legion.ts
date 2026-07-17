import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';

export interface LegionSummary {
  legion_id: string;
  name: string;
  slogan?: string;
  avatar_url?: string;
  theme_tags: string[];
  member_count: number;
  member_cap: number;
  join_mode: 'public' | 'approval';
  status: string;
  activity_score: number;
  pk_wins: number;
  pk_losses: number;
}

export interface LegionDetail extends LegionSummary {
  leader: { user_id: string; nickname: string; avatar_url?: string };
  members?: { user_id: string; nickname: string; role: string }[];
  created_at: string;
}

interface CreateLegionReq {
  name: string;
  slogan?: string;
  avatarUrl?: string;
  themeTags?: string[];
  joinMode?: 'public' | 'approval';
}

/** 军团列表（分页 + 关键词搜索） */
export function useLegions(page = 1, keyword?: string) {
  const api = useApi();
  return useQuery<{ list: LegionSummary[]; total: number }>({
    queryKey: ['legions', page, keyword],
    queryFn: () => api.get('/legions', { page: String(page), ...(keyword ? { keyword } : {}) }),
  });
}

/** 军团详情 */
export function useLegionDetail(id: string) {
  const api = useApi();
  return useQuery<LegionDetail>({
    queryKey: ['legion', id],
    queryFn: () => api.get(`/legions/${id}`),
    enabled: !!id,
  });
}

/** 创建军团 */
export function useCreateLegion() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLegionReq) => api.post('/legions', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legions'] });
    },
  });
}

/** 加入军团 */
export function useJoinLegion() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (legionId: string) => api.post(`/legions/${legionId}/join`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legion'] });
    },
  });
}

/** 退出军团 */
export function useLeaveLegion() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (legionId: string) => api.post(`/legions/${legionId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legion'] });
    },
  });
}
