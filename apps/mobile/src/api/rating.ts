import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';
import { tracker, CORE_EVENTS } from '../tracker/sdk';

interface RatingResult {
  score_id: string;
  meme_id: string;
  user_id: string;
  star: number;
  is_judge: boolean;
  weight: number;
  meme_score_avg: number;
  meme_score_count: number;
  god_trash_triggered: boolean;
  created_at: string;
}

interface CommentItem {
  comment_id: string;
  meme_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  is_god_comment: boolean;
  status: 'published' | 'hidden' | 'deleted';
  created_at: string;
}

interface PagedResponse<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

interface CreateRatingPayload {
  meme_id: string;
  star: number;
  comment?: string;
  is_god_trash_vote?: boolean;
}

interface CreateCommentPayload {
  meme_id: string;
  content: string;
  parent_id?: string;
}

/** 评分（POST /ratings） */
export function useCreateRating() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      memeId: string;
      star: number;
      comment?: string;
      isGodTrashVote?: boolean;
    }) =>
      api.post<RatingResult>('/ratings', {
        meme_id: params.memeId,
        star: params.star,
        comment: params.comment,
        is_god_trash_vote: params.isGodTrashVote,
      } satisfies CreateRatingPayload),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['meme', vars.memeId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', vars.memeId] });
      tracker.trackCore(CORE_EVENTS.MEME_SCORE, {
        meme_id: vars.memeId,
        star: vars.star,
        is_god_trash: vars.isGodTrashVote,
        new_avg: data.meme_score_avg,
      });
      void tracker.flushNow();
    },
  });
}

/** 评分统计（GET /ratings/:memeId/score） */
export function useMemeScore(memeId: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['ratings', memeId, 'score'],
    queryFn: () =>
      api.get<{
        meme_id: string;
        avg_score: number;
        count: number;
        god_count: number;
        trash_count: number;
      }>(`/ratings/${memeId}/score`),
    enabled: !!memeId,
  });
}

/** 评论列表（GET /ratings/:memeId/comments） */
export function useComments(memeId: string, page = 1, pageSize = 20) {
  const api = useApi();
  return useQuery<PagedResponse<CommentItem>>({
    queryKey: ['comments', memeId, page, pageSize],
    queryFn: () =>
      api.get<PagedResponse<CommentItem>>(`/ratings/${memeId}/comments`, {
        page,
        page_size: pageSize,
      }),
    enabled: !!memeId,
  });
}

/** 发布评论（POST /ratings/comments） */
export function useCreateComment() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { memeId: string; content: string; parentId?: string }) =>
      api.post<CommentItem>('/ratings/comments', {
        meme_id: params.memeId,
        content: params.content,
        parent_id: params.parentId,
      } satisfies CreateCommentPayload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['comments', vars.memeId] });
      tracker.trackCore(CORE_EVENTS.MEME_COMMENT, {
        meme_id: vars.memeId,
        has_parent: !!vars.parentId,
      });
      void tracker.flushNow();
    },
  });
}

/** 神梗/烂梗判定（GET /ratings/:memeId/god-trash） */
export function useJudgeGodTrash(memeId: string) {
  const api = useApi();
  return useQuery<{ status: 'pending' | 'god' | 'trash'; god_count: number; trash_count: number }>({
    queryKey: ['ratings', memeId, 'god-trash'],
    queryFn: () => api.get(`/ratings/${memeId}/god-trash`),
    enabled: !!memeId,
  });
}
