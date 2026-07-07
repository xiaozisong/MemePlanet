// 对齐 docs/db/schema.sql §9 pk_matches / pk_submissions / pk_votes / pk_rewards

export type PKType = 'creation' | 'vote' | 'hotness';
export type PKStatus =
  | 'idle'
  | 'challenged'
  | 'accepted'
  | 'preparing'
  | 'battling'
  | 'judging'
  | 'settled'
  | 'archived';

export interface PKMatch {
  pkId: string;
  type: PKType;
  legionA: string;
  legionB: string;
  theme: string;
  startAt: string;
  endAt: string;
  status: PKStatus;
  scoreA: number;
  scoreB: number;
  winnerId?: string;
  mvpUserId?: string;
  rewardState: Record<string, unknown>;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PKSubmission {
  submissionId: string;
  pkId: string;
  memeId: string;
  legionId: string;
  userId: string;
  submittedAt: string;
}

export interface PKVote {
  voteId: string;
  pkId: string;
  userId: string;
  legionId: string;
  votedAt: string;
}

export type PKRewardType = 'win_member' | 'mvp' | 'loser_participation';

export interface PKReward {
  rewardId: string;
  pkId: string;
  userId: string;
  legionId: string;
  rewardType: PKRewardType;
  memePower: number;
  activityScore: number;
  badgeCode?: string;
  proDays: number;
  grantedAt: string;
}
