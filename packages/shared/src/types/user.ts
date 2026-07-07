// 对齐 docs/db/schema.sql §3 users / user_profiles / user_badges / user_follows

export type UserStatus = 'active' | 'banned' | 'teen_mode' | 'deleted';
export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface User {
  userId: string;
  supabaseUid?: string;
  phone?: string;
  email?: string;
  nickname: string;
  avatarUrl?: string;
  gender?: Gender;
  birthday?: string; // ISO date
  bio?: string;
  level: number;
  memePower: number;
  defenseValue: number;
  energyBalance: number;
  legionCount: number;
  status: UserStatus;
  isPro: boolean;
  isOfficial: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserProfile {
  userId: string;
  interestTags: string[];
  badges: Badge[];
  privacy: Record<string, unknown>;
  notificationPref: Record<string, unknown>;
  teenModeUntil?: string;
  nicknameChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type BadgeType = 'achievement' | 'cosmetic';

export interface Badge {
  badgeCode: string;
  badgeType: BadgeType;
  acquiredAt: string;
  metadata?: Record<string, unknown>;
}

export interface UserFollow {
  followerId: string;
  followeeId: string;
  createdAt: string;
}
