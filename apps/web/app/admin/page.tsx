export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="在线人数" value="0" />
        <Card label="进行中 PK" value="0" />
        <Card label="今日造梗数" value="0" />
        <Card label="今日 AI 成本" value="¥0.00" />
      </div>
      <p className="mt-8 text-gray-400">
        TODO：M2 接入实时数据（在线人数 / PK 比分 / 造梗数 / AI 成本）。
      </p>
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
