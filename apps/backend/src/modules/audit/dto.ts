import { z } from 'zod';

export const ReportSchema = z.object({
  targetType: z.enum(['meme', 'comment', 'user', 'legion', 'message']),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(64),
  detail: z.string().max(500).optional(),
});

export type ReportDto = z.infer<typeof ReportSchema>;
