import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { REDIS } from '../../database/redis.module.js';
import { chatRooms, messages, messageReads, users } from '../../database/schema.js';
import { SensitiveWordService } from '../audit/sensitive-word.service.js';
import { and, eq, lt, desc, sql, count } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { SendMessageDto } from './dto.js';

const PAGE_SIZE = 50;
const MAX_ROOMS_PER_USER = 100;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly sensitive: SensitiveWordService,
  ) {}

  async listRooms(userId: string) {
    // List legion chat rooms and private chat rooms the user participates in
    const privateRooms = await this.db
      .select({
        roomId: chatRooms.roomId,
        type: chatRooms.type,
        lastMsgAt: chatRooms.lastMsgAt,
        userA: chatRooms.userA,
        userB: chatRooms.userB,
      })
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.type, 'private'),
          sql`(${chatRooms.userA} = ${userId} OR ${chatRooms.userB} = ${userId})`,
        ),
      )
      .orderBy(desc(chatRooms.lastMsgAt))
      .limit(MAX_ROOMS_PER_USER);

    // Get legion rooms with their legion info
    const legionRooms = await this.db
      .select({
        roomId: chatRooms.roomId,
        type: chatRooms.type,
        lastMsgAt: chatRooms.lastMsgAt,
        legionId: chatRooms.legionId,
      })
      .from(chatRooms)
      .where(eq(chatRooms.type, 'legion'))
      .orderBy(desc(chatRooms.lastMsgAt))
      .limit(MAX_ROOMS_PER_USER);

    // Get unread counts for all rooms
    const allRoomIds = [...legionRooms.map((r) => r.roomId), ...privateRooms.map((r) => r.roomId)];

    const unreadCounts = new Map<string, number>();
    for (const roomId of allRoomIds) {
      const [readRecord] = await this.db
        .select({ lastReadAt: messageReads.lastReadAt })
        .from(messageReads)
        .where(and(eq(messageReads.roomId, roomId), eq(messageReads.userId, userId)))
        .limit(1);

      if (readRecord?.lastReadAt) {
        const [unread] = await this.db
          .select({ total: count() })
          .from(messages)
          .where(
            and(eq(messages.roomId, roomId), sql`${messages.createdAt} > ${readRecord.lastReadAt}`),
          );
        unreadCounts.set(roomId, Number(unread?.total ?? 0));
      } else {
        unreadCounts.set(roomId, 0);
      }
    }

    const items = [
      ...legionRooms.map((r) => ({
        roomId: r.roomId,
        type: r.type,
        lastMsgAt: r.lastMsgAt,
        unreadCount: unreadCounts.get(r.roomId) ?? 0,
      })),
      ...privateRooms.map((r) => ({
        roomId: r.roomId,
        type: r.type,
        lastMsgAt: r.lastMsgAt,
        unreadCount: unreadCounts.get(r.roomId) ?? 0,
      })),
    ];

    return { items };
  }

  async listMessages(userId: string, roomId: string, cursor?: string) {
    // Verify room exists
    const [room] = await this.db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.roomId, roomId))
      .limit(1);

    if (!room) throw new NotFoundException('聊天室不存在');

    // For private rooms, verify user is participant
    if (room.type === 'private' && room.userA !== userId && room.userB !== userId) {
      throw new ForbiddenException('无权查看该聊天室');
    }

    const conditions = [eq(messages.roomId, roomId)];

    if (cursor) {
      // Cursor-based pagination: cursor is createdAt ISO string
      conditions.push(lt(messages.createdAt, new Date(cursor)));
    }

    const msgList = await this.db
      .select({
        messageId: messages.messageId,
        roomId: messages.roomId,
        senderId: messages.senderId,
        msgType: messages.msgType,
        content: messages.content,
        extra: messages.extra,
        createdAt: messages.createdAt,
        senderName: users.nickname,
        senderAvatar: users.avatarUrl,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.userId))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(PAGE_SIZE + 1);

    const hasMore = msgList.length > PAGE_SIZE;
    const items = hasMore ? msgList.slice(0, PAGE_SIZE) : msgList;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.createdAt.toISOString() : undefined;

    // Update read receipt
    if (items.length > 0) {
      await this.db
        .insert(messageReads)
        .values({
          roomId,
          userId,
          lastReadAt: new Date(),
          lastReadMsgId: items[0]?.messageId,
        })
        .onConflictDoUpdate({
          target: [messageReads.roomId, messageReads.userId],
          set: {
            lastReadAt: new Date(),
            lastReadMsgId: items[0]?.messageId,
          },
        });
    }

    return { roomId, items: items.reverse(), cursor: nextCursor };
  }

  async send(userId: string, dto: SendMessageDto) {
    // Verify room exists and user has access
    const [room] = await this.db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.roomId, dto.roomId))
      .limit(1);

    if (!room) throw new NotFoundException('聊天室不存在');

    if (room.type === 'private' && room.userA !== userId && room.userB !== userId) {
      throw new ForbiddenException('无权在该聊天室发言');
    }

    // DFA sensitive word check
    if (dto.content && this.sensitive.hasSensitive(dto.content)) {
      const matches = this.sensitive.match(dto.content);
      this.logger.warn(
        `Message blocked by DFA: user=${userId} room=${dto.roomId} words=${matches.map((m) => m.word).join(',')}`,
      );
      throw new BadRequestException('消息包含敏感词');
    }

    const [msg] = await this.db
      .insert(messages)
      .values({
        roomId: dto.roomId,
        senderId: userId,
        msgType: dto.msgType,
        content: dto.content,
        extra: dto.extra ?? {},
      })
      .returning();

    if (!msg) throw new Error('消息发送失败');

    // Update room's last_msg_at
    await this.db
      .update(chatRooms)
      .set({ lastMsgAt: new Date() })
      .where(eq(chatRooms.roomId, dto.roomId));

    // Redis pubsub broadcast
    await this.redis.publish(
      'chat:message',
      JSON.stringify({
        roomId: dto.roomId,
        messageId: msg.messageId,
        senderId: userId,
        msgType: dto.msgType,
        content: dto.content,
        createdAt: msg.createdAt.toISOString(),
      }),
    );

    return { messageId: msg.messageId };
  }
}
