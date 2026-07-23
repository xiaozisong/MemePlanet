import { z } from 'zod';

export const CreatePKSchema = z.object({
  type: z.enum(['creation', 'vote', 'hotness']),
  legionA: z.string().uuid(),
  legionB: z.string().uuid(),
  theme: z.string().min(1).max(140),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export type CreatePKDto = z.infer<typeof CreatePKSchema>;

export const PKVoteSchema = z.object({
  legionId: z.string().uuid(),
});

export type PKVoteDto = z.infer<typeof PKVoteSchema>;

export const AcceptPKSchema = z.object({});

export type AcceptPKDto = z.infer<typeof AcceptPKSchema>;

export const RejectPKSchema = z.object({});

export type RejectPKDto = z.infer<typeof RejectPKSchema>;
