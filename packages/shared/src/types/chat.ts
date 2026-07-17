// 对齐 docs/db/schema.sql §10 chat_rooms / messages / notifications

export type ChatRoomType = 'private' | 'legion' | 'system';
export type MessageType = 'text' | 'image' | 'meme' | 'voice' | 'system';

export interface ChatRoom {
  roomId: string;
  type: ChatRoomType;
  legionId?: string;
  userA?: string;
  userB?: string;
  lastMsgAt?: string;
  createdAt: string;
}

export interface Message {
  messageId: string;
  roomId: string;
  senderId: string;
  msgType: MessageType;
  content?: string;
  extra?: Record<string, unknown>;
  createdAt: string;
}

export type NotificationType =
  'rating' | 'god_meme' | 'pk' | 'reward' | 'violation' | 'pro' | 'agent_done';

export interface Notification {
  notifId: string;
  userId: string;
  type: NotificationType;
  title?: string;
  body?: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  pushStatus: 'pending' | 'sent' | 'failed' | 'skipped';
  createdAt: string;
}
