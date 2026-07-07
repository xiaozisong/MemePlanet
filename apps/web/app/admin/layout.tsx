import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-white flex">
      <aside className="w-56 bg-ink-soft p-4 space-y-2 hidden md:block">
        <div className="font-bold mb-4">运营后台</div>
        <Link href="/admin" className="block py-1 hover:text-brand">Dashboard</Link>
        <Link href="/admin/audit" className="block py-1 hover:text-brand">审核队列</Link>
        <Link href="/admin/users" className="block py-1 hover:text-brand">用户管理</Link>
        <Link href="/admin/pk" className="block py-1 hover:text-brand">PK 运营</Link>
        <Link href="/admin/analytics" className="block py-1 hover:text-brand">数据看板</Link>
        <Link href="/admin/cost" className="block py-1 hover:text-brand">AI 成本</Link>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
