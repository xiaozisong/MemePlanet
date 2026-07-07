import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="border-b border-ink-soft">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold">
            梗星球
          </Link>
          <nav className="text-sm text-gray-400 space-x-4">
            <Link href="/privacy" className="hover:text-white">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-white">
              用户协议
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16 prose-invert">{children}</main>
    </div>
  );
}
