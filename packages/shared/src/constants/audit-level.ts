export type AuditLevel = 1 | 2 | 3; // 1=拦截 2=审核 3=提示

export const AUDIT_LEVEL = {
  BLOCK: 1 as AuditLevel,
  REVIEW: 2 as AuditLevel,
  HINT: 3 as AuditLevel,
} as const;

export const SENSITIVE_CATEGORY = {
  POLITICAL: 'political',
  PORNOGRAPHIC: 'pornographic',
  VIOLENT: 'violent',
  FRAUD: 'fraud',
  MINOR: 'minor',
  TROLL: 'troll',
} as const;

export const AUDIT_ACTION = {
  MACHINE_PASS: 'machine_pass',
  MACHINE_REJECT: 'machine_reject',
  MANUAL_PASS: 'manual_pass',
  MANUAL_REJECT: 'manual_reject',
  HIDE: 'hide',
  DELETE: 'delete',
} as const;

export const MEE_CARD_STATUS = {
  DRAFT: 'draft',
  PENDING_AUDIT: 'pending_audit',
  PUBLISHED: 'published',
  MANUAL_REVIEW: 'manual_review',
  REJECTED: 'rejected',
  OFFLINE: 'offline',
} as const;
