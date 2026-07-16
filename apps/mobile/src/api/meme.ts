import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';
import type { MemeCardData } from '../../src/components/MemeCard';

interface MemeDetail extends MemeCardData {
  author?: {
    user_id: string;
    nickname: string;
    avatar_url: string | null;
    level: number;
    meme_power: number;
    is_pro: boolean;
  };
  legion?: {
    legion_id: string;
    name: string;
    avatar_url: string;
  } | null;
  favorite_count: number;
  view_count: number;
  completion_rate: number;
  my_rating: number | null;
  my_favorite: boolean;
  published_at: string | null;
  created_at: string;
}

interface MemePublishRequest {
  creation_id?: string;
  video_id?: string;
  type: 'text' | 'image' | 'video';
  title: string;
  tags?: string[];
  legion_id?: string;
  cover_url?: string;
  is_ai_generated: boolean;
}

/** 梗卡详情 */
export function useMemeDetail(id: string) {
  const api = useApi();
  return useQuery<MemeDetail>({
    queryKey: ['meme', id],
    queryFn: () => api.get<MemeDetail>(`/memes/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/** 发布梗卡 */
export function usePublishMeme() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: MemePublishRequest) => api.post('/memes', req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

/** 删除梗卡（软删除） */
export function useDeleteMeme() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/memes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['meme'] });
    },
  });
}

/** 梗卡状态查询 */
export function useMemeStatus(id: string) {
  const api = useApi();
  return useQuery<{ status: string; audit_result?: string }>({
    queryKey: ['meme', id, 'status'],
    queryFn: () => api.get(`/memes/${id}/status`),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 'pending_audit' ? 3000 : false),
  });
}
