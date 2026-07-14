import { z } from 'zod';

/**
 * 单条事件上报 DTO
 */
export const TrackEventSchema = z.object({
  name: z.string().min(1).max(64),
  props: z.record(z.unknown()).default({}),
  occurredAt: z.string().datetime().optional(),
  platform: z.string().max(16).optional(),
  sessionId: z.string().max(128).optional(),
  deviceId: z.string().max(128).optional(),
});

export type TrackEventDto = z.infer<typeof TrackEventSchema>;

/**
 * 批量事件上报 DTO
 */
export const TrackBatchSchema = z.object({
  events: z.array(z.unknown()).min(1).max(100),
  platform: z.string().max(16).optional(),
  sessionId: z.string().max(128).optional(),
  deviceId: z.string().max(128).optional(),
});

export type TrackBatchDto = z.infer<typeof TrackBatchSchema>;
