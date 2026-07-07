import type { ApiResponse } from '../types/common.js';

export interface ApiClientOptions {
  baseUrl: string;
  /** 返回 token 的函数（支持异步刷新） */
  getAuthToken?: () => string | Promise<string | undefined> | undefined;
  /** 默认超时 ms */
  timeout?: number;
  /** 自定义 fetch（RN/Node/Web 都原生支持 fetch） */
  fetchImpl?: typeof fetch;
  /** 默认 headers */
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly status: number,
    message: string,
    public readonly traceId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface InternalOptions extends RequestInit {
  /** 该请求允许的最长耗时 ms */
  timeoutMs?: number;
  /** 是否跳过自动加 token（如登录接口） */
  skipAuth?: boolean;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: ApiClientOptions['getAuthToken'];
  private readonly defaultTimeout: number;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(opts: ApiClientOptions) {
    if (!opts.baseUrl) throw new Error('ApiClient: baseUrl is required');
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.getAuthToken = opts.getAuthToken;
    this.defaultTimeout = opts.timeout ?? 10000;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(opts.headers ?? {}),
    };
  }

  async get<T>(path: string, query?: Record<string, unknown>, init?: InternalOptions): Promise<T> {
    return this.request<T>('GET', path, query, undefined, init);
  }

  async post<T>(
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    init?: InternalOptions,
  ): Promise<T> {
    return this.request<T>('POST', path, query, body, init);
  }

  async patch<T>(
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    init?: InternalOptions,
  ): Promise<T> {
    return this.request<T>('PATCH', path, query, body, init);
  }

  async put<T>(
    path: string,
    body?: unknown,
    init?: InternalOptions,
  ): Promise<T> {
    return this.request<T>('PUT', path, undefined, body, init);
  }

  async delete<T>(path: string, init?: InternalOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, undefined, init);
  }

  private async request<T>(
    method: string,
    path: string,
    query?: Record<string, unknown>,
    body?: unknown,
    init?: InternalOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const headers: Record<string, string> = { ...this.defaultHeaders };

    if (!init?.skipAuth) {
      const token = await this.getAuthToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const timeoutMs = init?.timeoutMs ?? this.defaultTimeout;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await this.fetchImpl(url, {
        ...init,
        method,
        headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: init?.signal ?? controller.signal,
      });

      const raw: unknown = await res.json().catch(() => ({}));
      const payload = raw as ApiResponse<T>;

      if (!res.ok || typeof payload.code !== 'number') {
        throw new ApiError(
          payload?.code ?? res.status,
          res.status,
          payload?.message ?? res.statusText,
          payload?.traceId,
          payload?.data,
        );
      }
      return payload.data;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    if (!query || Object.keys(query).length === 0) return url;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      qs.append(k, String(v));
    }
    const s = qs.toString();
    return s ? `${url}?${s}` : url;
  }
}

/** 创建默认实例的工厂 */
export function createApiClient(opts: ApiClientOptions): ApiClient {
  return new ApiClient(opts);
}
