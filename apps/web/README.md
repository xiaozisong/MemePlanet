# @memestar/web

梗星球 MemeChatAI Web 端 + 运营后台（Next.js 14 App Router + Tailwind + shadcn/ui 风格）。

## 启动

```bash
pnpm --filter @memestar/web dev   # http://localhost:3001
```

## 目录结构

- `app/` — App Router
  - `layout.tsx` / `page.tsx` — 落地页
  - `(marketing)/` — 隐私政策 / 用户协议展示
  - `admin/` — 运营后台骨架（登录 + dashboard + 审核 + 用户 + PK + 看板 + AI 成本）
- `components/` — 通用组件（Button / Card / ...）
- `lib/` — 工具（`cn` / `api`）

## 部署

- Vercel（推荐）：`pnpm build && pnpm start`
- Cloudflare Pages：备选
