// 对齐 docs/db/schema.sql §7 ratings / comments / shares / favorites

export interface Rating {
  scoreId: string;
  memeId: string;
  userId: string;
  star: number; // 1-5
  dimensions: { laugh?: number; creative?: number; spread?: number };
  isJudge: boolean;
  weight: number;
  isGodTrashVote: boolean;
  comment?: string;
  createdAt: string;
}

export interface Comment {
  commentId: string;
  memeId: string;
  userId: string;
  parentId?: string;
  content: string;
  likeCount: number;
  isGodComment: boolean;
  isMemeCard: boolean;
  refMemeId?: string;
  status: 'published' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Share {
  shareId: string;
  memeId: string;
  userId?: string;
  channel: 'in_app' | 'wechat' | 'douyin' | 'qq' | 'link';
  createdAt: string;
}

export interface Favorite {
  userId: string;
  memeId: string;
  createdAt: string;
}
