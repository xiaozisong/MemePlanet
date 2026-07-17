'use client';

import { useEffect, useState } from 'react';
import { fetchAICostLogs, type AICostLog } from '@/lib/admin-api';

export default function AdminCostPage() {
  const [records, setRecords] = useState<AICostLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAICostLogs()
      .then((r) => setRecords(r.list))
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const totalCost = records.reduce((sum, r) => sum + r.cost_cents, 0);

  if (loading) return <div className="text-gray-400">加载中...</div>;
  if (error) return <div className="text-red-400">加载失败：{error}</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI 成本</h1>
        <div className="rounded-xl bg-ink-soft px-4 py-2 text-right">
          <div className="text-xs text-gray-400">当前列表总成本</div>
          <div className="text-lg font-bold text-brand">
            ¥{(totalCost / 100).toFixed(2)}
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="text-gray-400">暂无 AI 调用记录</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-soft text-gray-400">
                <th className="pb-2 pr-3">时间</th>
                <th className="pb-2 pr-3">Provider</th>
                <th className="pb-2 pr-3">模型</th>
                <th className="pb-2 pr-3">类型</th>
                <th className="pb-2 pr-3">输入 Tokens</th>
                <th className="pb-2 pr-3">输出 Tokens</th>
                <th className="pb-2 pr-3">成本(分)</th>
                <th className="pb-2">耗时(ms)</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-ink-soft/50 text-xs"
                >
                  <td className="py-2 pr-3 text-gray-500">
                    {new Date(r.created_at).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 pr-3">{r.provider}</td>
                  <td className="py-2 pr-3 font-mono">{r.model}</td>
                  <td className="py-2 pr-3">{r.type}</td>
                  <td className="py-2 pr-3">{r.tokens_input.toLocaleString()}</td>
                  <td className="py-2 pr-3">{r.tokens_output.toLocaleString()}</td>
                  <td className="py-2 pr-3 font-semibold">{r.cost_cents}</td>
                  <td className="py-2">{r.latency_ms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
