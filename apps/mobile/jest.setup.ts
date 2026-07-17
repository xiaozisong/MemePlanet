/**
 * Jest 全局 setup：在所有 test suite 加载前预置 fetch polyfill。
 * Node 18+ 内置 fetch/Response/Headers/Request，
 * 但 jest 环境需要显式挂到 globalThis 上。
 */

if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder: TE, TextDecoder: TD } = require('util');
  globalThis.TextEncoder = TE;
  globalThis.TextDecoder = TD;
}

if (typeof globalThis.fetch === 'undefined') {
  // 简易 mock：返回标准 envelope，避免组件渲染时抛网络错误
  const mockResponse: Response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    url: '',
    type: 'basic',
    redirected: false,
    body: null,
    bodyUsed: false,
    clone() {
      return mockResponse;
    },
    async json() {
      return { code: 0, data: null, message: 'mock' };
    },
    async text() {
      return JSON.stringify({ code: 0, data: null, message: 'mock' });
    },
    async arrayBuffer() {
      return new ArrayBuffer(0);
    },
    async blob() {
      return new Blob();
    },
    async formData() {
      return new FormData();
    },
  } as unknown as Response;

  globalThis.fetch = (async () => mockResponse) as unknown as typeof globalThis.fetch;
}
