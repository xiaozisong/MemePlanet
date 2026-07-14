import { AnalyticsService } from './analytics.service.js';
import type { DbType } from '../../database/drizzle.module.js';

// ------------------------------------------------------------------ //
// Mock Drizzle DB
// ------------------------------------------------------------------ //
function createMockDb() {
  const returning = jest.fn().mockResolvedValue([{ eventId: 'evt-001' }]);
  const values = jest.fn().mockReturnValue({ returning });
  const insert = jest.fn().mockReturnValue({ values });
  return { insert } as unknown as DbType;
}

// ------------------------------------------------------------------ //
// Mock PostHog
// ------------------------------------------------------------------ //
function createMockPostHog() {
  return {
    capture: jest.fn(),
  };
}

// ------------------------------------------------------------------ //
// Tests
// ------------------------------------------------------------------ //
describe('AnalyticsService — T1.14', () => {
  let db: DbType;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createMockDb();
  });

  describe('track', () => {
    it('写入自建表并返回 eventId', async () => {
      const service = new AnalyticsService(db, null);

      const result = await service.track(
        { userId: 'u1', platform: 'app' },
        { name: 'meme_view', properties: { meme_id: 'm-001' } },
      );

      expect(result.eventId).toBe('evt-001');
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('有 PostHog 时双写', async () => {
      const ph = createMockPostHog();
      const service = new AnalyticsService(db, ph);

      await service.track(
        { userId: 'u1', platform: 'app', sessionId: 's1' },
        { name: 'meme_view', properties: { meme_id: 'm-001' } },
      );

      expect(ph.capture).toHaveBeenCalledWith('u1', 'meme_view', {
        meme_id: 'm-001',
        platform: 'app',
        session_id: 's1',
        device_id: undefined,
      });
    });

    it('无 PostHog 时不报错', async () => {
      const service = new AnalyticsService(db, null);

      await expect(service.track({ userId: 'u2' }, { name: 'app_launch' })).resolves.toEqual({
        eventId: 'evt-001',
      });
    });

    it('PostHog 抛出异常时仅 warn 不阻塞主流程', async () => {
      const ph = createMockPostHog();
      ph.capture.mockImplementation(() => {
        throw new Error('network');
      });
      const service = new AnalyticsService(db, ph);

      await expect(service.track({ userId: 'u3' }, { name: 'login_success' })).resolves.toEqual({
        eventId: 'evt-001',
      });
      // 自建表应仍然写入
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackBatch', () => {
    it('批量写入自建表', async () => {
      const service = new AnalyticsService(db, null);

      const result = await service.trackBatch({ userId: 'u1' }, [
        { name: 'meme_view', properties: { id: '1' } },
        { name: 'meme_view', properties: { id: '2' } },
      ]);

      expect(result.accepted).toBe(2);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('空数组返回 accepted=0，不写库', async () => {
      const service = new AnalyticsService(db, null);

      const result = await service.trackBatch({ userId: 'u1' }, []);

      expect(result.accepted).toBe(0);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('有 PostHog 时批量双写', async () => {
      const ph = createMockPostHog();
      const service = new AnalyticsService(db, ph);

      await service.trackBatch({ userId: 'u1' }, [
        { name: 'event_a', properties: { v: 1 } },
        { name: 'event_b', properties: { v: 2 } },
      ]);

      expect(ph.capture).toHaveBeenCalledTimes(2);
      expect(ph.capture).toHaveBeenCalledWith('u1', 'event_a', expect.any(Object));
      expect(ph.capture).toHaveBeenCalledWith('u1', 'event_b', expect.any(Object));
    });
  });
});
