import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';

export type NotifType = 'comment' | 'like' | 'legion_invite' | 'pk_invite' | 'system';

export interface NotificationItem {
  notifId: string;
  type: NotifType;
  title?: string | null;
  body?: string | null;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResp {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** 通知列表（分页） */
export function useNotifications(page = 1, pageSize = 20) {
  const api = useApi();
  return useQuery<NotificationListResp>({
    queryKey: ['notifications', page, pageSize],
    queryFn: () =>
      api.get('/notifications', {
        page: String(page),
        pageSize: String(pageSize),
      }),
  });
}

/** 标记单条为已读 */
export function useMarkNotifRead() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notifId: string) => api.post(`/notifications/${notifId}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/** 标记全部为已读 */
export function useMarkAllNotifsRead() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
