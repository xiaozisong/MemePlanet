'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
      setReady(true);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="bg-ink flex min-h-screen items-center justify-center text-white">
        校验登录状态...
      </div>
    );
  }

  return (
    <div className="bg-ink flex min-h-screen text-white">
      <aside className="bg-ink-soft hidden w-56 p-4 md:block">
        <div className="mb-4 font-bold">运营后台</div>
        <nav className="space-y-1 text-sm">
          <Link href="/admin" className="hover:text-brand block py-1">
            Dashboard
          </Link>
          <Link href="/admin/audit" className="hover:text-brand block py-1">
            审核队列
          </Link>
          <Link href="/admin/users" className="hover:text-brand block py-1">
            用户管理
          </Link>
          <Link href="/admin/pk" className="hover:text-brand block py-1">
            PK 运营
          </Link>
          <Link href="/admin/analytics" className="hover:text-brand block py-1">
            数据看板
          </Link>
          <Link href="/admin/cost" className="hover:text-brand block py-1">
            AI 成本
          </Link>
          <hr className="my-3 border-gray-700" />
          <button
            className="block py-1 text-left hover:text-red-400"
            onClick={() => {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user_id');
              router.replace('/admin/login');
            }}
          >
            退出登录
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
