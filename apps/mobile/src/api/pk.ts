import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';

export interface PKMatchSummary {
  pk_id: string;
  type: string;
  theme: string;
  legion_a: { legion_id: string; name: string; avatar_url?: string };
  legion_b: { legion_id: string; name: string; avatar_url?: string };
  score_a: number;
  score_b: number;
  status: string;
  start_at: string;
  end_at: string;
  participant_count?: number;
}

export interface PKMatchDetail extends PKMatchSummary {
  created_by: string;
  winner?: string | null;
  settled_at?: string | null;
}

interface CreatePKReq {
  type: 'creation' | 'vote' | 'hotness';
  legionA: string;
  legionB: string;
  theme: string;
  startAt: string;
  endAt: string;
}

interface VoteReq {
  legionId: string;
}

/** 活跃 PK 列表 */
export function useActivePKs() {
  const api = useApi();
  return useQuery<PKMatchSummary[]>({
    queryKey: ['pk', 'active'],
    queryFn: () => api.get('/pk/active'),
    refetchInterval: 30_000,
  });
}

/** PK 详情 */
export function usePKDetail(id: string) {
  const api = useApi();
  return useQuery<PKMatchDetail>({
    queryKey: ['pk', id],
    queryFn: () => api.get(`/pk/${id}`),
    enabled: !!id,
  });
}

/** 创建 PK */
export function useCreatePK() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePKReq) => api.post('/pk', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pk', 'active'] });
    },
  });
}

/** PK 投票 */
export function useVotePK() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pkId, legionId }: { pkId: string; legionId: string }) =>
      api.post(`/pk/${pkId}/vote`, { legionId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pk', vars.pkId] });
    },
  });
}
