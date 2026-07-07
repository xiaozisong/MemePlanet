import { z } from 'zod';

export const SendMessageSchema = z.object({
  roomId: z.string().uuid(),
  msgType: z.enum(['text', 'image', 'meme', 'voice']),
  content: z.string().max(5000).optional(),
  extra: z.record(z.unknown()).default({}),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;
