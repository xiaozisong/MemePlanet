import Link from 'next/link';

const features = [
  {
    icon: '🎨',
    title: 'AI 造梗工坊',
    desc: '输入关键词，引用 DeepSeek / GLM 大模型生成梗文本，搭配 SiliconFlow 生成的图片和豆包生成的视频，一次给你 3 个候选。',
  },
  {
    icon: '⭐',
    title: '内容评分社区',
    desc: '1-5 星打分 + 神/烂梗双轨判定，社区投票决定梗卡命运。算法结合用户权重计算综合分，让好梗浮上水面。',
  },
  {
    icon: '⚔️',
    title: '军团 PK 对战',
    desc: '加入或创建军团，参与限时主题 PK。每日投票支持自家军团，胜出军团全团获梗力值加成与专属徽章。',
  },
  {
    icon: '💬',
    title: '实时聊天系统',
    desc: '私聊 + 军团群聊，敏感词 DFA 实时过滤，Redis Pub/Sub 实时消息广播，防骚扰安全可靠。',
  },
  {
    icon: '🤖',
    title: 'Pro Agent',
    desc: '订阅 Pro ¥18/月，解锁 AI 造梗智能 Agent，10 次/日 Agent 配额 + 视频生成 3 次/日 + 专属模板。',
  },
  {
    icon: '🛡️',
    title: '安全与合规',
    desc: '手机号验证码登录 + JWT 双轨认证；敏感词热更新；阿里云内容安全机审；AIGC 备案进行中；未成年人青少年模式。',
  },
];

const stats = [
  { value: 'AI', label: 'DeepSeek + GLM + SiliconFlow + 豆包' },
  { value: '50+', label: 'PostgreSQL 数据表 + pgvector' },
  { value: '34', label: 'RESTful API 接口' },
  { value: 'M1', label: '已完成 6 大核心模块' },
];

export default function HomePage() {
  return (
    <main className="bg-ink min-h-screen text-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
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

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
          AI 造梗 · 内容评分 · 阵营 PK
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          以「梗卡」为最小内容单元，构建「造梗 → 评分 → 神/烂梗判定 → 军团
          PK」的内容生产与对抗闭环。 AI 生成 + 社区评分 + 阵营对抗，四合一垂直社区。
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
            className="rounded-xl border border-gray-700 px-6 py-3 font-semibold hover:border-white"
          >
            隐私政策
          </Link>
          <Link
            href="/terms"
            className="rounded-xl border border-gray-700 px-6 py-3 font-semibold hover:border-white"
          >
            用户协议
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-ink-soft bg-ink-soft/30 border-y">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-brand text-3xl font-extrabold">{s.value}</div>
              <div className="mt-1 text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">六大核心能力</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="border-ink-soft bg-ink-soft/30 hover:border-brand rounded-2xl border p-6 transition-colors"
            >
              <div className="mb-4 text-4xl">{f.icon}</div>
              <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-ink-soft bg-ink-soft/30 border-t">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">从造梗到神梗，四步闭环</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: '01',
                title: 'AI 造梗',
                desc: '输入关键词，AI 生成 3 个候选梗文本/图片/视频',
              },
              { step: '02', title: '内容发布', desc: '选择满意的候选，发布为梗卡进入 feed 流' },
              { step: '03', title: '社区评分', desc: '1-5 星 + 神/烂梗判定，计算综合分进入推荐' },
              { step: '04', title: '军团 PK', desc: '组建军团参与主题 PK，赢得荣誉与梗力值' },
            ].map((s) => (
              <div key={s.step}>
                <div className="text-brand/40 mb-3 text-4xl font-extrabold">{s.step}</div>
                <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">下载体验</h2>
        <p className="mb-10 text-gray-400">M1 开发中 · 邀请制灰度即将开启</p>
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-64 items-center justify-center gap-3 rounded-xl border border-gray-700 px-6 py-3 font-semibold hover:border-white"
          >
            <span className="text-2xl"></span>
            <div className="text-left">
              <div className="text-xs text-gray-400">Download on the</div>
              <div className="text-lg">App Store</div>
            </div>
          </a>
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-64 items-center justify-center gap-3 rounded-xl border border-gray-700 px-6 py-3 font-semibold hover:border-white"
          >
            <span className="text-2xl">▶</span>
            <div className="text-left">
              <div className="text-xs text-gray-400">GET IT ON</div>
              <div className="text-lg">Google Play</div>
            </div>
          </a>
        </div>
        <p className="mt-12 text-sm text-gray-400">
          下载前请参阅
          <Link href="/privacy" className="text-brand mx-1 hover:underline">
            隐私政策
          </Link>
          与
          <Link href="/terms" className="text-brand mx-1 hover:underline">
            用户协议
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-ink-soft border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-400 md:flex-row">
          <div>© 2026 梗星球 MemeChatAI · AIGC 备案进行中</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-white">
              用户协议
            </Link>
            <Link href="/admin" className="hover:text-white">
              运营后台
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
