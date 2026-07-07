// 统一响应结构 { code, data, message }，对齐 NestJS ResponseInterceptor

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
  traceId?: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export type UUID = string;

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  version: string;
}
