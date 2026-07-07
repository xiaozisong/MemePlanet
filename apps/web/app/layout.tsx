import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '梗星球 MemeChatAI · AI 造梗 + 内容评分 + 阵营 PK',
  description:
    'AI 造梗 + 内容评分社区 + 阵营化社交 + 实时聊天四合一，以"梗卡"为最小内容单元，构建造梗→评分→神/烂梗判定→军团 PK 的闭环。',
  metadataBase: new URL('https://memestar.xyz'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
