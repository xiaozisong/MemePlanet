# @memestar/mobile

梗星球 MemeChatAI 移动端（React Native + Expo，managed workflow + Expo Router）。

## 启动

```bash
pnpm --filter @memestar/mobile start
# i: iOS 模拟器 / a: Android 模拟器 / w: Web
```

## 目录结构

- `app/` — Expo Router 路由（文件式路由）
  - `_layout.tsx` — 根布局 + Provider（QueryClient / Sentry / PostHog）
  - `(tabs)/` — 5 Tab：Feed / Create / Legion / PK / Profile
- `src/api/` — 网络层，复用 `@memestar/shared` 的 api-client
- `src/components/` — 通用组件
- `src/store/` — Zustand 状态管理
- `src/hooks/` — 自定义 Hook
- `src/utils/` — 工具（埋点、设备指纹、弱网）

## 信息架构（5 Tab）

| Tab | 路径 | 说明 |
| --- | --- | --- |
| Feed | `(tabs)/feed.tsx` | 推荐 feed 瀑布流 |
| Create | `(tabs)/create.tsx` | AI 造梗工坊（文本/图片/视频） |
| Legion | `(tabs)/legion.tsx` | 梗大军广场 + 军团主页 |
| PK | `(tabs)/pk.tsx` | PK 大厅 + 投票 + 战报 |
| Profile | `(tabs)/profile.tsx` | 我的 + 设置 + 青少年模式 |
