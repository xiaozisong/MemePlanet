import { z } from 'zod';

export const CreateMemeSchema = z.object({
  creationId: z.string().uuid().optional(),
  type: z.enum(['text', 'image', 'video']),
  title: z.string().min(1).max(140),
  coverUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1).max(32)).max(10).default([]),
  legionId: z.string().uuid().optional(),
});

export type CreateMemeDto = z.infer<typeof CreateMemeSchema>;
