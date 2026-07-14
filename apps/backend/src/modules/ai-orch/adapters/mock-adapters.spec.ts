import { MockLLMAdapter, FailLLMAdapter } from './mock-llm.adapter.js';
import { MockImageAdapter } from './mock-image.adapter.js';
import { MockVideoAdapter } from './mock-video.adapter.js';
import { MockTTSAdapter } from './mock-tts.adapter.js';

describe('AIOrch Mock Adapters — T1.9', () => {
  describe('MockLLMAdapter', () => {
    it('返回固定响应 + 计数 + 健康状态', async () => {
      const adapter = new MockLLMAdapter('m1', 'hello');
      const res = await adapter.chat({
        messages: [{ role: 'user', content: 'hi' }],
      });
      expect(res.content).toBe('hello');
      expect(res.tokensIn).toBeGreaterThan(0);
      expect(res.tokensOut).toBeGreaterThan(0);
      expect(res.finishReason).toBe('stop');
      expect(res.model).toBe('mock-llm');

      const health = await adapter.health();
      expect(health.name).toBe('m1');
      expect(health.healthy).toBe(true);
    });

    it('tools 字段触发空 toolCalls 数组返回', async () => {
      const adapter = new MockLLMAdapter('m2');
      const res = await adapter.chat({
        messages: [{ role: 'user', content: 'x' }],
        tools: [{ name: 'f', description: 'd', parameters: {} }],
      });
      expect(res.toolCalls).toEqual([]);
    });

    it('estimateCost 按元/百万 tokens 单价换算为分', () => {
      const adapter = new MockLLMAdapter();
      const cost = adapter.estimateCost(1_000_000, 1_000_000);
      // input 1元 + output 2元 = 3元 = 300 分
      expect(cost.costCents).toBe(300);
      expect(cost.currency).toBe('CNY');
    });

    it('FailLLMAdapter 抛错并报告不健康', async () => {
      const adapter = new FailLLMAdapter('boom', 'provider down');
      await expect(adapter.chat()).rejects.toThrow('provider down');
      const health = await adapter.health();
      expect(health.healthy).toBe(false);
      expect(health.errorRate).toBe(1);
    });
  });

  describe('MockImageAdapter', () => {
    it('按 count 返回 N 张占位图', async () => {
      const adapter = new MockImageAdapter();
      const res = await adapter.generate({
        prompt: 'a meme',
        count: 3,
        width: 512,
        height: 512,
      });
      expect(res).toHaveLength(3);
      for (const img of res) {
        expect(img.imageUrl).toContain('mock');
        expect(img.width).toBe(512);
        expect(img.height).toBe(512);
      }
      expect(new Set(res.map((r) => r.seed)).size).toBe(3);
    });

    it('estimateCost 按张数 × 单价计费', () => {
      const adapter = new MockImageAdapter();
      // 1 张 0.01 元 = 1 分
      const cost = adapter.estimateCost(1);
      expect(cost.costCents).toBe(1);
    });
  });

  describe('MockVideoAdapter', () => {
    it('submit 返回 queued 任务句柄，taskId 自增', async () => {
      const adapter = new MockVideoAdapter();
      const h1 = await adapter.submit({
        sourceType: 'text_to_video',
        duration: 5,
      });
      const h2 = await adapter.submit({
        sourceType: 'text_to_video',
        duration: 5,
      });
      expect(h1.status).toBe('queued');
      expect(h2.status).toBe('queued');
      expect(h2.taskId).not.toBe(h1.taskId);
    });

    it('poll 返回完整 VideoResult', async () => {
      const adapter = new MockVideoAdapter();
      const handle = await adapter.submit({
        sourceType: 'image_to_video',
        imageUrl: 'https://cdn.example.com/x.png',
        duration: 10,
      });
      const res = await adapter.poll(handle.taskId);
      expect(res.videoUrl).toContain(handle.taskId);
      expect(res.duration).toBe(10);
      expect(res.isFallback).toBe(false);
    });

    it('estimateCost 按秒数 × 单价计费', () => {
      const adapter = new MockVideoAdapter();
      // 10s × 0.1 元/s = 1 元 = 100 分
      expect(adapter.estimateCost(10).costCents).toBe(100);
    });
  });

  describe('MockTTSAdapter', () => {
    it('synthesize 返回固定 audioUrl + 时长', async () => {
      const adapter = new MockTTSAdapter();
      const res = await adapter.synthesize({
        text: '你好',
        voiceId: 'v1',
      });
      expect(res.audioUrl).toContain('.mp3');
      expect(res.durationMs).toBeGreaterThan(0);
    });

    it('estimateCost 按 1k chars × 单价计费', () => {
      const adapter = new MockTTSAdapter();
      // 1000 字 × 0.02 元/千字 = 0.02 元 = 2 分
      expect(adapter.estimateCost(1000).costCents).toBe(2);
    });
  });
});
