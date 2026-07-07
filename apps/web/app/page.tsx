import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-white">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="text-xl font-bold">梗星球</div>
        <div className="space-x-4 text-sm text-gray-400">
          <Link href="/admin" className="hover:text-white">
            运营后台
          </Link>
          <a href="https://apps.apple.com" className="hover:text-white">
            iOS
          </a>
          <a href="https://play.google.com" className="hover:text-white">
            Android
          </a>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          AI 造梗 · 内容评分 · 阵营 PK
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          以「梗卡」为最小内容单元，构建「造梗 → 评分 → 神/烂梗判定 → 军团 PK」的内容生产与对抗闭环。
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a
            href="#download"
            className="bg-brand hover:bg-brand-dark rounded-xl px-6 py-3 font-semibold"
          >
            下载 App
          </a>
          <Link
            href="/privacy"
            className="border border-gray-700 hover:border-white rounded-xl px-6 py-3 font-semibold"
          >
            隐私政策
          </Link>
        </div>
      </section>

      <section id="download" className="max-w-5xl mx-auto px-6 pb-32 text-center">
        <p className="text-gray-400">M1 开发中 · 邀请制灰度即将开启</p>
      </section>
    </main>
  );
}
