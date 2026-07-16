export default function AdminCostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">AI 成本</h1>
      <p className="text-gray-400">
        实时看板：日/月成本、单用户成本、按 module/provider 聚合（来自 ai_cost_logs）。
      </p>
    </div>
  );
}
