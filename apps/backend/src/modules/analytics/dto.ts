import { z } from 'zod';

export const TrackEventSchema = z.object({
  name: z.string().min(1).max(64),
  props: z.record(z.unknown()).default({}),
  occurredAt: z.string().datetime().optional(),
});

export type TrackEventDto = z.infer<typeof TrackEventSchema>;
