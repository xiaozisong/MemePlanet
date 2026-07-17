'use client';

import { useEffect, useState } from 'react';
import { fetchAdminActivePKs, type AdminPKMatch } from '@/lib/admin-api';

const STATUS_LABEL: Record<string, string> = {
  preparing: '即将开始',
  battling: '进行中',
  judging: '评审中',
  settled: '已结算',
  cancelled: '已取消',
};

const STATUS_COLOR: Record<string, string> = {
  preparing: 'text-blue-300 bg-blue-500/20',
  battling: 'text-green-300 bg-green-500/20',
  judging: 'text-yellow-300 bg-yellow-500/20',
  settled: 'text-gray-400 bg-gray-500/20',
  cancelled: 'text-red-300 bg-red-500/20',
};

export default function AdminPKPage() {
  const [matches, setMatches] = useState<AdminPKMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchAdminActivePKs()
      .then(setMatches)
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) return <div className="text-gray-400">加载中...</div>;
  if (error) return <div className="text-red-400">加载失败：{error}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">PK 运营</h1>
      {matches.length === 0 ? (
        <p className="text-gray-400">暂无活跃 PK</p>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={m.pk_id} className="border-ink-soft bg-ink-soft/30 rounded-xl border p-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[m.status] ?? 'text-gray-400'}`}
                >
                  {STATUS_LABEL[m.status] ?? m.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(m.start_at).toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="font-medium">{m.theme}</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-gray-400">{m.legion_a}</span>
                <span className="font-bold text-brand">
                  {m.score_a} : {m.score_b}
                </span>
                <span className="text-gray-400">{m.legion_b}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
