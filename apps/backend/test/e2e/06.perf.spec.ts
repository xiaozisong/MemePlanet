import { api } from './setup';

interface PerfResult {
  path: string;
  samples: number;
  p50: number;
  p95: number;
  avg: number;
}

const SAMPLES = 20;
const results: PerfResult[] = [];

async function measure(path: string, samples = SAMPLES): Promise<PerfResult> {
  // 预热：丢弃首个冷启动样本（含 TCP 连接建立 / Express 首请求初始化），避免毛刺污染 p95
  try {
    await api.get(path);
  } catch {
    // 忽略
  }
  const latencies: number[] = [];
  for (let i = 0; i < samples; i++) {
    const t0 = Date.now();
    try {
      await api.get(path);
    } catch {
      // 忽略网络抖动
    }
    latencies.push(Date.now() - t0);
  }
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  const avg = latencies.reduce((s, x) => s + x, 0) / latencies.length;
  return { path, samples, p50, p95, avg };
}

describe('性能测试 · 延迟基准', () => {
  it('/health p95 < 100ms', async () => {
    const r = await measure('/health');
    results.push(r);
    expect(r.p95).toBeLessThan(100);
  });

  it('/api/memes/feed p95 < 800ms', async () => {
    const r = await measure('/api/memes/feed');
    results.push(r);
    expect(r.p95).toBeLessThan(800);
  });

  it('/api/recommend/feed p95 < 800ms', async () => {
    const r = await measure('/api/recommend/feed');
    results.push(r);
    expect(r.p95).toBeLessThan(800);
  });

  it('/api/legions p95 < 800ms', async () => {
    const r = await measure('/api/legions');
    results.push(r);
    expect(r.p95).toBeLessThan(800);
  });

  afterAll(() => {
    // eslint-disable-next-line no-console
    console.log('\n========== 性能基准报告 ==========');
    // eslint-disable-next-line no-console
    console.table(results);
  });
});
