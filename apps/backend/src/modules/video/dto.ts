import { z } from 'zod';

export const CreateVideoSchema = z.object({
  memeId: z.string().uuid().optional(),
  sourceType: z.enum(['text_to_video', 'image_to_video', 'fallback_image_tts']),
  script: z.string().max(2000).optional(),
  duration: z.union([z.literal(5), z.literal(10), z.literal(15)]).default(5),
  voiceId: z.string().max(32).optional(),
});

export type CreateVideoDto = z.infer<typeof CreateVideoSchema>;
