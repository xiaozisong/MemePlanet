import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service.js';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import type { Server, Socket } from 'socket.io';

/**
 * 军团群聊 WebSocket Gateway
 * - 握手时通过 auth.token 字段传入 JWT，校验后 attach userId
 * - join room:roomId 后实时接收消息
 * - 消息通过 ChatService.send 入库 + Redis pubsub 跨实例广播
 */
@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      this.logger.warn(`connect rejected (no token): ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = await this.verifyToken(token);
      client.data.userId = payload.sub;
      client.data.roles = payload.roles ?? [];
      this.logger.log(`connect user=${payload.sub} id=${client.id}`);
    } catch {
      this.logger.warn(`connect rejected (bad token): ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId as string | undefined;
    this.logger.log(`disconnect user=${userId ?? '?'} id=${client.id}`);
  }

  /**
   * 加入聊天室房间
   * 客户端发送：{ roomId: string }
   * 仅验证消息格式，不验证权限（消息发送时验证）
   */
  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket): void {
    if (!data.roomId) {
      client.emit('error', { message: '缺少 roomId' });
      return;
    }
    void client.join(`room:${data.roomId}`);
    this.logger.log(`join user=${client.data.userId} room=${data.roomId}`);
  }

  /**
   * 客户端发送聊天消息
   * 客户端发送：{ roomId, msgType, content, extra? }
   * 流程：JWT 鉴权 → ChatService.send 入库 → 广播到 room
   */
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody()
    data: {
      roomId: string;
      msgType?: 'text' | 'image' | 'meme' | 'voice';
      content?: string;
      extra?: Record<string, unknown>;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<{ ok: boolean; messageId?: string }> {
    const userId = client.data.userId as string;
    if (!userId) {
      client.emit('error', { message: '未鉴权' });
      return { ok: false };
    }

    try {
      const result = await this.chatService.send(userId, {
        roomId: data.roomId,
        msgType: data.msgType ?? 'text',
        content: data.content ?? '',
        extra: data.extra ?? {},
      });

      // Broadcast the message to everyone in the room (including sender)
      this.server.to(`room:${data.roomId}`).emit('new_message', {
        messageId: result.messageId,
        roomId: data.roomId,
        senderId: userId,
        msgType: data.msgType ?? 'text',
        content: data.content ?? '',
        createdAt: new Date().toISOString(),
      });

      return { ok: true, messageId: result.messageId };
    } catch (err) {
      if (err instanceof Error) {
        this.logger.warn(`message error user=${userId} room=${data.roomId}: ${err.message}`);
        client.emit('error', { message: err.message });
      }
      return { ok: false };
    }
  }

  /** 双轨 JWT 校验（同 JwtAuthGuard） */
  private async verifyToken(token: string): Promise<JwtPayload> {
    const payload = this.decodePayload(token);
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    if (
      supabaseUrl &&
      payload &&
      typeof payload === 'object' &&
      'iss' in payload &&
      typeof payload.iss === 'string' &&
      payload.iss.startsWith(supabaseUrl)
    ) {
      const supabaseJwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET');
      if (!supabaseJwtSecret) {
        throw new UnauthorizedException('Supabase JWT 校验失败（未配置）');
      }
      const { default: jwtVerify } = await import('jsonwebtoken');
      return jwtVerify(token, supabaseJwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
    }

    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  private decodePayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = (parts[1] as string).replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }
}
