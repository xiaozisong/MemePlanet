import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  async listRooms(userId: string) {
    // TODO: 私聊走 Supabase Realtime，军团群聊走 chat_rooms (type=legion)
    void userId;
    return { items: [] as unknown[] };
  }

  async listMessages(userId: string, roomId: string, cursor?: string) {
    // TODO: 游标分页查 messages
    void userId;
    return { roomId, items: [] as unknown[], cursor };
  }

  async send(userId: string, dto: Record<string, unknown>) {
    // TODO: DFA 敏感词 + 抽样阿里云 + INSERT messages + Redis pubsub 广播
    this.logger.log(`send user=${userId} dto=${JSON.stringify(dto)}`);
    return { messageId: 'placeholder' };
  }
}
