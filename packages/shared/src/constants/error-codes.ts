// 统一错误码，对齐 NestJS ResponseInterceptor
// 0=成功；4xx=客户端错误；5xx=服务端错误；自定义业务码用 1xxxx

export const ErrorCode = {
  OK: 0,
  // ---- 通用 ----
  BAD_REQUEST: 40000,
  UNAUTHORIZED: 40100,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  METHOD_NOT_ALLOWED: 40500,
  CONFLICT: 40900,
  UNPROCESSABLE: 42200,
  RATE_LIMITED: 42900,
  INTERNAL_ERROR: 50000,
  NOT_IMPLEMENTED: 50100,
  SERVICE_UNAVAILABLE: 50300,
  GATEWAY_TIMEOUT: 50400,
  // ---- 业务：用户 ----
  USER_NOT_FOUND: 10001,
  USER_BANNED: 10002,
  USER_PHONE_EXISTS: 10003,
  USER_NICKNAME_TAKEN: 10004,
  USER_OTP_INVALID: 10005,
  USER_OTP_EXPIRED: 10006,
  USER_OTP_RATE_LIMITED: 10007,
  USER_NICKNAME_COOLDOWN: 10008,
  // ---- 业务：能量 / 配额 ----
  ENERGY_INSUFFICIENT: 10101,
  QUOTA_EXCEEDED: 10102,
  PRO_REQUIRED: 10103,
  // ---- 业务：梗卡 / 创作 ----
  MEME_NOT_FOUND: 10201,
  MEME_STATUS_INVALID: 10202,
  CREATION_NOT_FOUND: 10203,
  CREATION_STATUS_INVALID: 10204,
  PROMPT_DUPLICATED_24H: 10205,
  // ---- 业务：评分 / 评论 ----
  RATING_DUPLICATED: 10301,
  RATING_OUT_OF_RANGE: 10302,
  COMMENT_SENSITIVE: 10303,
  // ---- 业务：军团 / PK ----
  LEGION_NOT_FOUND: 10401,
  LEGION_NAME_TAKEN: 10402,
  LEGION_MEMBER_CAP: 10403,
  LEGION_ALREADY_JOINED: 10404,
  PK_NOT_FOUND: 10405,
  PK_VOTE_EXHAUSTED: 10406,
  PK_STATUS_INVALID: 10407,
  // ---- 业务：审核 ----
  AUDIT_REJECTED: 10501,
  AUDIT_PENDING: 10502,
  SENSITIVE_WORD_HIT: 10503,
  // ---- 业务：AI 编排 ----
  AI_PROVIDER_UNAVAILABLE: 10601,
  AI_BUDGET_EXCEEDED: 10602,
  AI_CIRCUIT_OPEN: 10603,
  AI_TIMEOUT: 10604,
  AGENT_JOB_NOT_FOUND: 10605,
  // ---- 业务：支付 ----
  PAYMENT_FAILED: 10701,
  PAYMENT_ORDER_INVALID: 10702,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorMessage: Record<number, string> = {
  [ErrorCode.OK]: 'OK',
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期',
  [ErrorCode.FORBIDDEN]: '无权访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.RATE_LIMITED]: '请求过于频繁，请稍后再试',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',
  [ErrorCode.ENERGY_INSUFFICIENT]: '梗能量不足',
  [ErrorCode.QUOTA_EXCEEDED]: '配额已用完',
  [ErrorCode.PRO_REQUIRED]: 'Pro 会员专属功能',
  [ErrorCode.SENSITIVE_WORD_HIT]: '内容包含敏感词',
  [ErrorCode.AI_BUDGET_EXCEEDED]: 'AI 日预算已达上限，已自动降级',
  [ErrorCode.AI_CIRCUIT_OPEN]: 'AI 服务熔断中，请稍后再试',
};
