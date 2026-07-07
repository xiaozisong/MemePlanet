import type { AgentJobStatus } from '../types/creation.js';

export const AGENT_STATE_FLOW: ReadonlyArray<AgentJobStatus> = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'timeout',
];

export const AGENT_STATES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
} as const;

export const AGENT_STEPS = {
  RAG_RETRIEVE: 'rag_retrieve',
  GENERATE: 'generate',
  SELF_SCORE: 'self_score',
} as const;

export const AGENT_DAILY_QUOTA_PRO = 10;
export const AGENT_DAILY_BUDGET_CENTS_DEFAULT = 8000;
export const AGENT_FALLBACK_TO_SINGLE_PROMPT = true;
export const AGENT_STEP_TIMEOUT_MS = 30000;
