'use client';

import { useEffect, useState } from 'react';
import { fetchAuditQueue, performAuditAction, type AuditItem } from '@/lib/admin-api';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已驳回',
};

export default function AuditQueuePage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchAuditQueue()
      .then((r) => setItems(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAction(id: string, action: 'approve' | 'reject' | 'takedown') {
    setActing(id);
    try {
      await performAuditAction(id, action);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return <div className="text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">审核队列</h1>
        <button
          onClick={load}
          className="rounded-lg border border-gray-700 px-4 py-1 text-sm hover:border-white"
        >
          刷新
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400">暂无待审核项</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border-ink-soft bg-ink-soft/30 rounded-xl border p-4">
              <div className="mb-2 flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.type === 'report'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {item.type === 'report' ? '举报' : '机审复核'}
                </span>
                <span className="text-xs text-gray-500">
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
                <span className="text-xs text-gray-500">{formatTime(item.createdAt)}</span>
              </div>
              <p className="mb-1 text-sm font-medium">{item.detail}</p>
              <p className="mb-3 text-xs text-gray-400">原因：{item.reason}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(item.id, 'approve')}
                  disabled={acting === item.id}
                  className="rounded-lg bg-green-600 px-4 py-1 text-sm font-semibold hover:bg-green-500 disabled:opacity-50"
                >
                  {acting === item.id ? '处理中...' : '通过'}
                </button>
                <button
                  onClick={() => handleAction(item.id, 'reject')}
                  disabled={acting === item.id}
                  className="rounded-lg bg-red-600 px-4 py-1 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
                >
                  驳回
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
