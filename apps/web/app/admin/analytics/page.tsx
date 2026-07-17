'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard, type DashboardData } from '@/lib/admin-api';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400">加载中...</div>;

  // 留存/漏斗/AB 实验需后续接入专门事件表，当前先用 dashboard 数据展示
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">数据看板</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="在线人数" value={String(data?.online ?? '—')} />
        <Card label="活跃 PK" value={String(data?.activePKs ?? '—')} />
        <Card label="今日造梗" value={String(data?.memesCreatedToday ?? '—')} />
        <Card label="今日 AI 成本" value={`¥${((data?.aiCostTodayCents ?? 0) / 100).toFixed(2)}`} />
      </div>
      <div className="border-ink-soft bg-ink-soft/30 mt-8 rounded-xl border p-4 text-sm text-gray-400">
        <p>
          留存/漏斗/AB 实验看板需后续接入专门事件埋点表（计划在 M2/M3 完成），当前复用 dashboard
          实时指标。
        </p>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-soft rounded-xl p-4">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
