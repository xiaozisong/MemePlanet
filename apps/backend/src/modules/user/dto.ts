import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  nickname: z.string().min(2).max(32).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(140).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birthday: z.string().date().optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const UpdateInterestTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(32)).min(3).max(10),
});

export type UpdateInterestTagsDto = z.infer<typeof UpdateInterestTagsSchema>;
