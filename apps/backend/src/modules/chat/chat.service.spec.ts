import { ChatService } from './chat.service.js';
import type { DbType } from '../../database/drizzle.module.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type Redis from 'ioredis';
import { SensitiveWordService } from '../audit/sensitive-word.service.js';
import type { SendMessageDto } from './dto.js';

function mockDb() {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<DbType>;
}

function mockRedis(): jest.Mocked<Redis> {
  return { publish: jest.fn().mockResolvedValue(0) } as unknown as jest.Mocked<Redis>;
}

function mockSensitive(): jest.Mocked<SensitiveWordService> {
  return {
    hasSensitive: jest.fn().mockReturnValue(false),
    match: jest.fn().mockReturnValue([]),
  } as unknown as jest.Mocked<SensitiveWordService>;
}

/** select → from → where → limit (single row lookup) */
function singleResult(row: unknown) {
  const limit = jest.fn().mockResolvedValue(row ? [row] : []);
  const where = jest.fn().mockReturnValue({ limit });
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → where → orderBy → limit (ordered list) */
function orderedResult(rows: unknown) {
  const limit = jest.fn().mockResolvedValue(rows);
  const orderBy = jest.fn().mockReturnValue({ limit });
  const where = jest.fn().mockReturnValue({ orderBy });
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → leftJoin → where → orderBy → limit */
function leftJoinOrderedResult(rows: unknown) {
  const limit = jest.fn().mockResolvedValue(rows);
  const orderBy = jest.fn().mockReturnValue({ limit });
  const where = jest.fn().mockReturnValue({ orderBy });
  const leftJoin = jest.fn().mockReturnValue({ where });
  const from = jest.fn().mockReturnValue({ leftJoin });
  return { from };
}

/** insert → values → returning */
function insertResult(returned: unknown) {
  const returning = jest.fn().mockResolvedValue(returned);
  const values = jest.fn().mockReturnValue({ returning });
  return { values };
}

/** insert → values → onConflictDoUpdate */
function insertWithConflict() {
  const onConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
  const values = jest.fn().mockReturnValue({ onConflictDoUpdate });
  return { values };
}

/** update → set → where */
function updateChain() {
  const where = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn().mockReturnValue({ where });
  return { set };
}

const mockRoom = {
  roomId: 'room-001',
  type: 'legion',
  legionId: 'legion-001',
  userA: null,
  userB: null,
  lastMsgAt: new Date(),
  createdAt: new Date(),
};

const mockPrivateRoom = {
  roomId: 'room-002',
  type: 'private',
  legionId: null,
  userA: 'user-001',
  userB: 'user-002',
  lastMsgAt: new Date(),
  createdAt: new Date(),
};

const mockMsg = {
  messageId: 'msg-001',
  roomId: 'room-001',
  senderId: 'user-001',
  msgType: 'text',
  content: 'hello',
  extra: {},
  createdAt: new Date(),
  senderName: '用户1',
  senderAvatar: null,
};

describe('ChatService', () => {
  let db: jest.Mocked<DbType>;
  let redis: jest.Mocked<Redis>;
  let sensitive: jest.Mocked<SensitiveWordService>;
  let service: ChatService;

  beforeEach(() => {
    db = mockDb();
    redis = mockRedis();
    sensitive = mockSensitive();
    service = new ChatService(
      db as unknown as DbType,
      redis as unknown as Redis,
      sensitive as unknown as SensitiveWordService,
    );
  });

  describe('listRooms', () => {
    it('should return rooms', async () => {
      // 1st select: private rooms
      (db.select as jest.Mock).mockReturnValueOnce({ from: orderedResult([mockPrivateRoom]).from });
      // 2nd select: legion rooms
      (db.select as jest.Mock).mockReturnValueOnce({ from: orderedResult([mockRoom]).from });
      // 3rd select: read record for room-001 (legion room) → null → unread=0
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      // 4th select: read record for room-002 (private room) → null → unread=0
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });

      const result = await service.listRooms('user-001');
      expect(result.items).toHaveLength(2);
    });

    it('should return empty', async () => {
      // Both queries return empty → no per-room queries
      (db.select as jest.Mock).mockReturnValueOnce({ from: orderedResult([]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: orderedResult([]).from });

      const result = await service.listRooms('user-003');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('listMessages', () => {
    it('should return messages paginated', async () => {
      // 1st select: room lookup
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockRoom).from });
      // 2nd select: messages with leftJoin
      (db.select as jest.Mock).mockReturnValueOnce({ from: leftJoinOrderedResult([mockMsg]).from });
      // insert: update read receipt (items.length > 0)
      (db.insert as jest.Mock).mockReturnValueOnce(insertWithConflict());

      const result = await service.listMessages('user-001', 'room-001');
      expect(result.roomId).toBe('room-001');
      expect(result.items).toHaveLength(1);
    });

    it('should throw for nonexistent room', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.listMessages('user-001', 'bad-room')).rejects.toThrow(NotFoundException);
    });

    it('should throw Forbidden for private room without access', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockPrivateRoom).from });
      await expect(service.listMessages('user-003', 'room-002')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('send', () => {
    const dto: SendMessageDto = { roomId: 'room-001', msgType: 'text', content: 'test', extra: {} };

    it('should send', async () => {
      // 1st select: room lookup
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockRoom).from });
      // insert: message with returning
      (db.insert as jest.Mock).mockReturnValueOnce(
        insertResult([{ messageId: 'msg-001', createdAt: new Date() }]),
      );
      // update: room lastMsgAt
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());

      const r = await service.send('user-001', dto);
      expect(r.messageId).toBe('msg-001');
      expect(redis.publish).toHaveBeenCalled();
    });

    it('should throw for nonexistent room', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.send('user-001', dto)).rejects.toThrow(NotFoundException);
    });

    it('should block sensitive content', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockRoom).from });
      sensitive.hasSensitive.mockReturnValue(true);
      sensitive.match.mockReturnValue([{ word: 'badword', start: 0, end: 7 }]);
      await expect(service.send('user-001', dto)).rejects.toThrow(BadRequestException);
    });
  });
});
