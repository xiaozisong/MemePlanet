# 梗星球 MemeChatAI · UI Plan

> 本文档记录"梗星球"移动端 App 的 UI/UX 设计落地计划。
> 基于用户提供的 Figma 设计文件作为**视觉风格参考**，并非精确的页面结构还原。

---

## 参考来源

- **Figma 设计稿**：[Online Game Streaming Mobile App — Community](https://www.figma.com/design/3ktAZ9eJ1FmAPhNYjx8BYh/Online-Game-Streaming-Mobile-App--Community-?node-id=0-1&p=f&t=xgWpcwaQSiAMThm6-0)
- **使用方式**：借用其**视觉语言**（色彩系统、卡片样式、间距节奏、品牌氛围），**不是**页面结构或交互逻辑的直接复制
- **语义映射**：LIVE / 游戏直播 → 梗 / 造梗 / 军団 / PK / 我的；Viewers → 浏览数 / 参与数；Game Categories → 梗分类；Streamer → 热门梗卡作者

---

## 设计 Token

### 色彩系统（已落地 ✅）

| Token | 值 | 用途 |
|-------|-----|------|
| `brand.DEFAULT` | `#F7B84B` | 品牌金黄 — 主 CTA、active Tab、高亮元素 |
| `brand.light` | `#F9CE6E` | 金黄浅色 |
| `brand.dark` | `#D49C2E` | 金黄深色 — 按压态 |
| `ink.DEFAULT` | `#1E1D1A` | 背景深棕 — 整体底色 |
| `ink.soft` | `#2A2A30` | 软背景 — 卡片／输入框 |
| `ink.elevated` | `#353545` | 抬高背景 — 浮层／选中态 |
| `text.primary` | `#FFFFFF` | 主文字 |
| `text.muted` | `#5E6468` | 弱化文字 |
| `status.success` | `#5ED36A` | 成功绿色 |
| `status.error` | `#FF4444` | 错误红色 |

详见 `src/theme/colors.ts`。

### 字体系统（已落地 ✅）

5 字重 Poppins，通过 `expo-font` `loadAsync` 从 `assets/fonts/` 加载（不依赖 NPM 包，避免 pnpm hoisting 兼容问题）。

| 字重 | 字体名 | 文件 |
|------|--------|------|
| 400 Regular | `Poppins_400Regular` | `assets/fonts/Poppins_400Regular.ttf` |
| 500 Medium | `Poppins_500Medium` | `assets/fonts/Poppins_500Medium.ttf` |
| 600 SemiBold | `Poppins_600SemiBold` | `assets/fonts/Poppins_600SemiBold.ttf` |
| 700 Bold | `Poppins_700Bold` | `assets/fonts/Poppins_700Bold.ttf` |
| 800 ExtraBold | `Poppins_800ExtraBold` | `assets/fonts/Poppins_800ExtraBold.ttf` |

### 间距 & 圆角（已落地 ✅）

| Token | 值 |
|-------|-----|
| `pagePadding` | 20px |
| `cardGap` | 12px |
| `radius.lg` | 12px |
| `radius.pill` | 9999px |

详见 `src/theme/spacing.ts` / `radius.ts` / `shadow.ts`。

---

## 各页面状态

### P0 — 已落地 ✅

| 页面 / 模块 | 状态 | 说明 |
|-------------|------|------|
| Theme Tokens（色彩/字体/间距/圆角/投影） | ✅ | `src/theme/` 全套 |
| Tailwind 色板同步 | ✅ | `tailwind-colors.cjs` + `tailwind.config.js` |
| Tab 栏（5 Tab） | ✅ | 金黄 active + Poppins 字体 | 
| SVG 图标系统 | ✅ | 30+ 图标 + Tab 5 图标金黄主色 |
| Feed 首页 | ✅ | 搜索栏 + 分类胶囊 + 梗卡 |
| 登录页 | ✅ | 深黑氛围 + 金黄 CTA |
| 字体加载 | ✅ | `app/_layout.tsx` FontLoader + asset 方式 |
| Metro / pnpm 兼容 | ✅ | 适配 monorepo 结构 |

### P1 — 已落地 ✅

| 页面 | 说明 |
|------|------|
| 造梗入口页 (`create.tsx`) | 4 模式卡片，按 Figma Game Category 风格，inline style + Poppins |
| 个人主页 (`profile.tsx`) | Banner + 头像 + LV 徽章 + 三段数据 + Tab，inline style + theme tokens + Poppins |

### P2 — 已落地 ✅

| 页面 / 组件 | 说明 |
|-------------|------|
| 军团页 (`legion.tsx`) | 色彩 / 风格对齐新色板，inline style |
| PK 页 (`pk.tsx`) | 色彩 / 风格对齐新色板，inline style |
| 通用组件通刷 | EmptyState / PrimaryButton / Tag / IconButton / AppScreen 改用 theme token |
| MemeCard 硬编码色 | AI tag / God/Trash 改用 colorsFlat |
| 占位页面通刷 | settings / teen-mode / create/{text,image,video,agent} / +not-found — inline style + Poppins |
| 全局 className 清理 | apps/mobile 下零 className 残留 |

### P3 — 远期 / 可暂缓

- 暗色详情页细调
- 交互动画、骨架屏完善
- Gesture handler 手势操作

---

## 执行顺序

```
P0 (已完成) → P1 (造梗 + 个人主页) → P2 (军团/PK + 组件通刷 + 占位页面) → P3 (动效)
```

- 每次迭代保持 `pnpm typecheck` + `pnpm lint` 零错误
- 每完成一个模块更新 `activeContext.md` 和本文件
- 如需变更设计 Token，先与用户讨论

---

## 校验

- `pnpm typecheck` — ✅ apps/mobile 通过
- `pnpm lint` — ✅ 零 errors / 零 warnings
- `apps/web` 的 pre-existing TS2742 错误 — 与移动端改动无关

*最后更新：2026-07-10*
