import { useMutation, useQuery } from '@tanstack/react-query';
import { useApi } from './provider';
import { tracker, CORE_EVENTS } from '../tracker/sdk';

interface CreationCandidate {
  candidate_id: string;
  idx: number;
  content: string | null;
  image_url: string | null;
  self_score: number | null;
}

interface CreationResult {
  creation_id: string;
  status: 'pending' | 'ready' | 'published' | 'failed';
  mode: string;
  candidates: CreationCandidate[];
  energy_cost: number;
  model_version: string;
  cached: boolean;
}

interface CreateCreationPayload {
  mode: 'text' | 'image' | 'script';
  prompt: string;
  style?: string;
  template_id?: string;
  prompt_hash?: string;
  legion_id?: string;
  agentMode?: boolean;
}

/** 发起造梗任务（POST /creations，返回 202 含 creation_id） */
export function useStartCreation() {
  const api = useApi();
  return useMutation({
    mutationFn: (params: {
      mode: 'text' | 'image' | 'script';
      prompt: string;
      style?: string;
      template_id?: string;
      legion_id?: string;
      agentMode?: boolean;
    }) => {
      tracker.trackCore(CORE_EVENTS.MEME_CREATE_START, {
        mode: params.mode,
        prompt_length: params.prompt.length,
      });
      return api.post<{ creation_id: string; status: string }>('/creations', {
        mode: params.mode,
        prompt: params.prompt,
        style: params.style,
        template_id: params.template_id,
        legion_id: params.legion_id,
        agentMode: params.agentMode ?? false,
      } satisfies CreateCreationPayload);
    },
  });
}

/** 获取造梗结果（GET /creations/:id） */
export function useCreationStatus(creationId: string | null) {
  const api = useApi();
  return useQuery<CreationResult>({
    queryKey: ['creation', creationId],
    queryFn: () => api.get<CreationResult>(`/creations/${creationId}`),
    enabled: !!creationId,
    refetchInterval: (query) => {
      const status = (query.state.data as { status?: string } | undefined)?.status;
      return status === 'pending' ? 2000 : false;
    },
  });
}

/** 选择候选作为正式梗卡（POST /creations/:id/choose） */
export function useChooseCandidate() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ creationId, idx }: { creationId: string; idx: number }) =>
      api.post<{ meme_id: string; status: 'published'; cover_url?: string }>(
        `/creations/${creationId}/choose`,
        { idx },
      ),
    onSuccess: (data, vars) => {
      tracker.trackCore(CORE_EVENTS.MEME_CREATE_SUCCESS, {
        creation_id: vars.creationId,
        candidate_idx: vars.idx,
        meme_id: data.meme_id,
      });
      tracker.trackCore(CORE_EVENTS.MEME_PUBLISH, {
        creation_id: vars.creationId,
        meme_id: data.meme_id,
      });
      void tracker.flushNow();
    },
  });
}

/** 重新生成候选（POST /creations/:id/regenerate） */
export function useRegenerate() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ creationId }: { creationId: string }) =>
      api.post<{ creation_id: string; status: string }>(`/creations/${creationId}/regenerate`),
  });
}
