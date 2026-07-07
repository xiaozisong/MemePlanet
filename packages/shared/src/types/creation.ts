// 对齐 docs/db/schema.sql §4 creations / creation_candidates / agent_jobs / prompt_templates

export type CreationMode = 'text' | 'image' | 'script';
export type CreationStatus = 'pending' | 'ready' | 'published' | 'failed';

export interface Creation {
  creationId: string;
  userId: string;
  mode: CreationMode;
  agentMode: boolean;
  agentJobId?: string;
  prompt: string;
  promptHash?: string;
  style?: string;
  templateId?: string;
  chosenCandidate?: number;
  energyCost: number;
  modelVersion?: string;
  status: CreationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreationCandidate {
  candidateId: string;
  creationId: string;
  idx: number;
  content?: string;
  imageUrl?: string;
  selfScore?: number;
  selfReason?: string;
  metadata?: Record<string, unknown>;
}

export type AgentJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'timeout';

export interface AgentJob {
  jobId: string;
  creationId: string;
  userId: string;
  stepsTotal: number;
  stepsDone: number;
  status: AgentJobStatus;
  fallbackUsed: boolean;
  costEstimate: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface PromptTemplate {
  templateId: string;
  mode: CreationMode;
  name: string;
  systemPrompt: string;
  userTemplate: string;
  style?: string;
  variables: string[];
  exampleOutput?: Record<string, unknown>;
  isOfficial: boolean;
  creatorId?: string;
  useCount: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}
