import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ink min-h-screen text-white">
      <header className="border-ink-soft border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-bold">
            梗星球
          </Link>
          <nav className="space-x-4 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-white">
              用户协议
            </Link>
          </nav>
        </div>
      </header>
      <main className="prose-invert mx-auto max-w-3xl px-6 py-16">{children}</main>
    </div>
  );
}
