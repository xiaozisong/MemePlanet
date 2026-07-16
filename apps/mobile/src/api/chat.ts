import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './provider';

export interface ChatRoomSummary {
  room_id: string;
  type: 'legion' | 'private';
  name: string;
  last_message?: {
    content: string;
    msg_type: string;
    sent_at: string;
  };
  unread_count: number;
  legion_id?: string;
  peer_user_id?: string;
  peer_nickname?: string;
  peer_avatar_url?: string;
}

export interface ChatMessage {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_nickname?: string;
  sender_avatar_url?: string;
  msg_type: 'text' | 'image' | 'meme' | 'voice';
  content?: string;
  extra?: Record<string, unknown>;
  sent_at: string;
  is_mine: boolean;
}

interface SendMessageReq {
  roomId: string;
  msgType: 'text' | 'image' | 'meme' | 'voice';
  content?: string;
  extra?: Record<string, unknown>;
}

/** 聊天会话列表 */
export function useChatRooms() {
  const api = useApi();
  return useQuery<ChatRoomSummary[]>({
    queryKey: ['chat', 'rooms'],
    queryFn: () => api.get('/chat/rooms'),
  });
}

/** 聊天历史消息（游标分页） */
export function useChatMessages(roomId: string, cursor?: string) {
  const api = useApi();
  return useQuery<{ list: ChatMessage[]; nextCursor: string | null }>({
    queryKey: ['chat', 'messages', roomId, cursor],
    queryFn: () => api.get(`/chat/rooms/${roomId}/messages`, cursor ? { cursor } : {}),
    enabled: !!roomId,
  });
}

/** 发送消息 */
export function useSendMessage() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SendMessageReq) => api.post('/chat/messages', dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['chat', 'messages', vars.roomId] });
      qc.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    },
  });
}
