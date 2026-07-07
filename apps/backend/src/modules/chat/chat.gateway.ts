import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

/**
 * 军团群聊 WebSocket Gateway
 * - 客户端连接后 join legion:{legionId} room
 * - 消息通过 Redis pubsub 跨实例广播
 * - 心跳/重连/已读回执由客户端配合实现
 * MVP: 单进程 ~1w 连接；v1.5 评估 Centrifugo
 */
@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.log(`connect ${client.id}`);
    // TODO: 从 handshake auth 取 JWT，校验后 join legion room
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`disconnect ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { roomId: string }, client: Socket): void {
    void client.join(`room:${data.roomId}`);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: unknown): { ok: true } {
    // TODO: 入库 + 广播到 room
    this.logger.log(`ws message: ${JSON.stringify(data)}`);
    return { ok: true };
  }
}
