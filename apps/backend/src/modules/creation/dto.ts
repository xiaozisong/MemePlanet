import { z } from 'zod';

export const CreateCreationSchema = z.object({
  mode: z.enum(['text', 'image', 'script']),
  agentMode: z.boolean().default(false),
  prompt: z.string().min(1).max(500),
  style: z.string().max(32).optional(),
  templateId: z.string().uuid().optional(),
});

export type CreateCreationDto = z.infer<typeof CreateCreationSchema>;
