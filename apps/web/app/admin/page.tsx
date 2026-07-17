'use client';

import { useEffect, useState } from 'react';
import { fetchDashboard, type DashboardData } from '@/lib/admin-api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="在线人数" value={String(data?.online ?? '—')} />
        <Card label="进行中 PK" value={String(data?.activePKs ?? '—')} />
        <Card label="今日造梗数" value={String(data?.memesCreatedToday ?? '—')} />
        <Card label="今日 AI 成本" value={`¥${((data?.aiCostTodayCents ?? 0) / 100).toFixed(2)}`} />
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
