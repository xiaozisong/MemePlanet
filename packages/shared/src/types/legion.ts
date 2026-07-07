// 对齐 docs/db/schema.sql §8 legions / legion_members

export type LegionJoinMode = 'public' | 'approval';
export type LegionStatus = 'active' | 'frozen' | 'dissolved';
export type LegionRole = 'leader' | 'vice_leader' | 'member';

export interface Legion {
  legionId: string;
  name: string;
  slogan?: string;
  avatarUrl?: string;
  themeTags: string[];
  leaderId: string;
  level: number;
  activityScore: number;
  memberCount: number;
  memberCap: number;
  joinMode: LegionJoinMode;
  badges: string[];
  pkWins: number;
  pkLosses: number;
  status: LegionStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LegionMember {
  membershipId: string;
  legionId: string;
  userId: string;
  role: LegionRole;
  contribution: number;
  joinedAt: string;
  leftAt?: string;
}
