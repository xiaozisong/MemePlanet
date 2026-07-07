import { z } from 'zod';

export const CreateRatingSchema = z.object({
  memeId: z.string().uuid(),
  star: z.number().int().min(1).max(5),
  dimensions: z
    .object({
      laugh: z.number().min(0).max(5).optional(),
      creative: z.number().min(0).max(5).optional(),
      spread: z.number().min(0).max(5).optional(),
    })
    .default({}),
  isGodTrashVote: z.boolean().default(false),
  comment: z.string().max(500).optional(),
});

export type CreateRatingDto = z.infer<typeof CreateRatingSchema>;

export const CreateCommentSchema = z.object({
  memeId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(1).max(500),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
