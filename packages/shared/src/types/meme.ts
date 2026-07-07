// 对齐 docs/db/schema.sql §5 meme_cards / meme_tags / meme_card_tags

export type MemeType = 'text' | 'image' | 'video';
export type MemeStatus =
  | 'draft'
  | 'pending_audit'
  | 'published'
  | 'manual_review'
  | 'rejected'
  | 'offline';
export type GodTrashStatus = 'pending' | 'god' | 'trash';

export interface MemeCard {
  memeId: string;
  authorId: string;
  creationId?: string;
  type: MemeType;
  coverUrl?: string;
  title: string;
  tags: string[];
  legionId?: string;
  scoreAvg: number;
  scoreCount: number;
  commentCount: number;
  shareCount: number;
  favoriteCount: number;
  viewCount: number;
  completionRate: number;
  hotScore: number;
  godTrashStatus: GodTrashStatus;
  status: MemeStatus;
  isAiGenerated: boolean;
  watermarked: boolean;
  publishedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemeTag {
  tagId: number;
  name: string;
  category?: string;
  useCount: number;
}

export interface MemeVideo {
  videoId: string;
  memeId: string;
  assetId?: string;
  sourceType: 'text_to_video' | 'image_to_video' | 'fallback_image_tts';
  sourceId?: string;
  duration: number;
  voiceId?: string;
  subtitleText?: string;
  status: 'generating' | 'reviewing' | 'published' | 'rejected' | 'timeout';
  modelVersion?: string;
  fileUrl?: string;
  coverUrl?: string;
  isFallback: boolean;
  aiCost: number;
  createdAt: string;
  updatedAt: string;
}
