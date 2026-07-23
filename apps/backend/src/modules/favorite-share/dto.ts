import { z } from 'zod';

/**
 * 收藏 / 取消收藏 DTO
 */
export const FavoriteSchema = z.object({
  memeId: z.string().uuid(),
});

export type FavoriteDto = z.infer<typeof FavoriteSchema>;

/**
 * 转发 DTO —— channel: 站内 / 微信 / QQ / 抖音 / 链接复制
 */
export const ShareSchema = z.object({
  memeId: z.string().uuid(),
  channel: z.enum(['in_app', 'wechat', 'qq', 'douyin', 'link']),
});

export type ShareDto = z.infer<typeof ShareSchema>;
