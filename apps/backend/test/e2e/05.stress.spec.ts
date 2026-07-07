import { api, getJwtToken, authHeader } from './setup';

async function concurrent(n: number, fn: () => Promise<{ ok: boolean; ms: number }>) {
  const start = Date.now();
  const results = await Promise.all(Array.from({ length: n }, () => fn()));
  const totalMs = Date.now() - start;
  const ok = results.filter((r) => r.ok).length;
  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  return { n, ok, totalMs, p50, p95 };
}

async function hit(path: string, headers?: Record<string, string>): Promise<{ ok: boolean; ms: number }> {
  const t0 = Date.now();
  try {
    const r = api.get(path);
    if (headers) for (const [k, v] of Object.entries(headers)) r.set(k, v);
    const res = await r;
    return { ok: res.status === 200, ms: Date.now() - t0 };
  } catch {
    return { ok: false, ms: Date.now() - t0 };
  }
}

describe('压力测试 · 并发吞吐', () => {
  let token: string;
  beforeAll(async () => {
    token = await getJwtToken();
  });

  it('/health 50 并发，成功率 ≥ 99%，p95 < 500ms', async () => {
    const r = await concurrent(50, () => hit('/health'));
    expect(r.ok / r.n).toBeGreaterThanOrEqual(0.99);
    expect(r.p95).toBeLessThan(500);
  });

  it('/api/memes/feed 30 并发（公开），成功率 ≥ 95%，p95 < 1000ms', async () => {
    const r = await concurrent(30, () => hit('/api/memes/feed'));
    expect(r.ok / r.n).toBeGreaterThanOrEqual(0.95);
    expect(r.p95).toBeLessThan(1000);
  });

  it('/api/recommend/feed 30 并发（带 token），成功率 ≥ 95%', async () => {
    const r = await concurrent(30, () => hit('/api/recommend/feed', authHeader(token)));
    expect(r.ok / r.n).toBeGreaterThanOrEqual(0.95);
  });

  it('混合公开接口 60 并发连续打，整体成功率 ≥ 95%', async () => {
    const paths = ['/health', '/api/memes/feed', '/api/legions', '/api/pk/active'];
    const r = await concurrent(60, () => hit(paths[Math.floor(Math.random() * paths.length)] ?? '/health'));
    expect(r.ok / r.n).toBeGreaterThanOrEqual(0.95);
  });
});
