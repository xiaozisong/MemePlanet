import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';

export interface PKMatchSummary {
  pkId: string;
  type: string;
  theme: string;
  legionA: string;
  legionB: string;
  legionAName: string;
  legionBName: string;
  scoreA: number;
  scoreB: number;
  status: string;
  startAt: string;
  endAt: string;
  participant_count?: number;
}

export interface PKMatchDetail {
  pkId: string;
  type: string;
  theme: string;
  legionA: string;
  legionB: string;
  legionAName: string;
  legionAAvatarUrl?: string | null;
  legionBName: string;
  legionBAvatarUrl?: string | null;
  scoreA: number;
  scoreB: number;
  status: string;
  startAt: string;
  endAt: string;
  winnerId?: string | null;
  mvpUserId?: string | null;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreatePKReq {
  type: 'creation' | 'vote' | 'hotness';
  legionA: string;
  legionB: string;
  theme: string;
  startAt: string;
  endAt: string;
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
