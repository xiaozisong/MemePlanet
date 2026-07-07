import { z } from 'zod';

export const CreateLegionSchema = z.object({
  name: z.string().min(2).max(32),
  slogan: z.string().max(140).optional(),
  avatarUrl: z.string().url().optional(),
  themeTags: z.array(z.string().max(32)).max(10).default([]),
  joinMode: z.enum(['public', 'approval']).default('approval'),
});

export type CreateLegionDto = z.infer<typeof CreateLegionSchema>;
