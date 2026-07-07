import type { PKStatus } from '../types/pk.js';

export const PK_STATUS_FLOW: ReadonlyArray<PKStatus> = [
  'idle',
  'challenged',
  'accepted',
  'preparing',
  'battling',
  'judging',
  'settled',
  'archived',
];

export const PK_STATUS_LABEL: Record<PKStatus, string> = {
  idle: '待挑战',
  challenged: '已挑战',
  accepted: '已应战',
  preparing: '备战中',
  battling: 'PK 进行中',
  judging: '评审中',
  settled: '已结算',
  archived: '已归档',
};

export const PK_VOTE_PER_USER_PER_DAY = 3;
export const PK_DEFAULT_DURATION_HOURS = 24;
export const PK_MIN_LEGION_MEMBERS = 5;
