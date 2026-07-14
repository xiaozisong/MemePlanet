# 01 · 前端开发路由

> 覆盖：**移动端（apps/mobile，React Native + Expo Router）** + **Web（apps/web，Next.js 14 App Router）** + React + UI/设计。
>
> 项目栈：RN+Expo Router 5 Tab / Next.js 14 / Tailwind+shadcn-ui / Zustand + TanStack Query / expo-sqlite 缓存。

## Skills（按需 Read `.agents/skills/<name>/SKILL.md`）

### React 核心
| skill | 用途 | 何时读 |
|---|---|---|
| `react` | React 基础、组件、JSX | 写组件基础 |
| `react-hooks` | useState/useEffect/useMemo/useCallback 最佳实践 | 写 hooks |
| `react-patterns` | 复合组件、自定义 hook、状态共享模式 | 设计组件结构 |
| `react-performance` | memo、虚拟化、避免不必要渲染 | 性能优化 |
| `react-testing` | 组件测试 | 写组件单测 |

### React Native / Expo 移动端
| skill | 用途 | 何时读 |
|---|---|---|
| `react-native` | RN 核心、Metro、原生模块、发布 | 写 RN 页面/桥接 |
| `react-native-patterns` | RN 项目结构、导航、平台特定代码 | 组织 mobile 目录 |

### Next.js Web
| skill | 用途 | 何时读 |
|---|---|---|
| `nextjs` | App Router、RSC、路由、数据获取 | 写 web 页面 |
| `nextjs-turbopack` | Turbopack 构建配置 | 调构建/性能 |

### UI / 设计
| skill | 用途 | 何时读 |
|---|---|---|
| `frontend-design` | 前端设计原则、布局、配色 | 做 UI |
| `frontend-design-direction` | 设计方向选型 | 定 UI 风格 |
| `frontend-patterns` | 前端通用模式 | 组织前端代码 |
| `design-system` | 设计系统、Token、组件库 | 建设计系统 |
| `theme-factory` | 主题切换、暗色模式 | 做主题 |
| `ios-icon-gen` | iOS 应用图标生成 | 生成 app icon |

### 可访问性
| skill | 用途 | 何时读 |
|---|---|---|
| `frontend-a11y` | 前端 a11y 规范 | 做 a11y |
| `accessibility` | 通用 a11y（含 RN） | RN/Web a11y |

### 产物与展示
| skill | 用途 | 何时读 |
|---|---|---|
| `ui-demo` | UI demo 搭建 | 做 demo |
| `web-artifacts-builder` | Web 产物/演示页构建 | 搭演示 |
| `dashboard-builder` | 后台数据看板（admin） | 写运营后台 |
| `seo` | SEO、元信息、营销页优化 | 写落地页/营销 |

## Rules（自动加载，无需手动调用）

### React / RN / Web 专属（globs 匹配时注入）
| rule | 路径 | globs | 触发 |
|---|---|---|---|
| ecc-react-coding-style | `.cursor/rules/ecc-react-coding-style.mdc` | `**/*.tsx,**/*.jsx,components/**,hooks/**` | 写 React 组件/hooks |
| ecc-react-hooks | `.cursor/rules/ecc-react-hooks.mdc` | `**/*.tsx,**/*.jsx,hooks/**,use-*` | 写 hooks |
| ecc-react-patterns | `.cursor/rules/ecc-react-patterns.mdc` | 同上 | 设计 React 模式 |
| ecc-react-security | `.cursor/rules/ecc-react-security.mdc` | 同上 | React 安全（XSS 等） |
| ecc-react-testing | `.cursor/rules/ecc-react-testing.mdc` | 同上 | 测 React |
| ecc-react-native-coding-style | `.cursor/rules/ecc-react-native-coding-style.mdc` | `**/*.ts,**/*.tsx` | RN 代码风格 |
| ecc-react-native-hooks | `.cursor/rules/ecc-react-native-hooks.mdc` | 同上 | RN hooks |
| ecc-react-native-patterns | `.cursor/rules/ecc-react-native-patterns.mdc` | 同上 | RN 模式 |
| ecc-react-native-performance | `.cursor/rules/ecc-react-native-performance.mdc` | 同上 | RN 性能 |
| ecc-react-native-production-readiness | `.cursor/rules/ecc-react-native-production-readiness.mdc` | 同上 | RN 上线就绪 |
| ecc-react-native-security | `.cursor/rules/ecc-react-native-security.mdc` | 同上 | RN 安全 |
| ecc-react-native-testing | `.cursor/rules/ecc-react-native-testing.mdc` | 同上 | 测 RN |
| ecc-react-native-accessibility | `.cursor/rules/ecc-react-native-accessibility.mdc` | 同上 | RN a11y |
| ecc-web-coding-style | `.cursor/rules/ecc-web-coding-style.mdc` | `**/*.css,**/*.tsx,...` | Web 代码风格 |
| ecc-web-design-quality | `.cursor/rules/ecc-web-design-quality.mdc` | 同上 | Web 设计质量 |
| ecc-web-hooks | `.cursor/rules/ecc-web-hooks.mdc` | 同上 | Web hooks 规范 |
| ecc-web-patterns | `.cursor/rules/ecc-web-patterns.mdc` | 同上 | Web 模式 |
| ecc-web-performance | `.cursor/rules/ecc-web-performance.mdc` | 同上 | Web 性能 |
| ecc-web-security | `.cursor/rules/ecc-web-security.mdc` | 同上 | Web 安全 |
| ecc-web-testing | `.cursor/rules/ecc-web-testing.mdc` | 同上 | 测 Web |

> TS 通用规则见 `02-backend.md`（ecc-typescript-* 适用于所有 TS 文件，前后端共用）。

## MCP / 工具

- **playwright MCP**（见 `08-mcp-servers.md`）：Web E2E 浏览器自动化，写 Playwright 测试 / 抓页面时用。
- **chrome-devtools MCP**：调试 Web 性能、网络、控制台。
- **GenerateImage 工具**：生成 app 图标 / UI mockup（用户显式要求图像时）。

## 典型任务 → 工具选择

| 任务 | 用什么 |
|---|---|
| 新增 RN Tab 页面 | `react-native` + `react-native-patterns` skill + `10-coding-conventions.mdc` §前端 App |
| 写 Next.js 落地页 | `nextjs` skill + `frontend-design` + ecc-web-* rules + `seo` |
| 做后台数据看板 | `dashboard-builder` + `nextjs` + shadcn/ui（见 conventions） |
| 调 RN 性能 | `react-native` + `react-performance` + ecc-react-native-performance rule |
| 生成 app 图标 | `ios-icon-gen` skill 或 GenerateImage 工具 |
| Web E2E 测试 | `playwright` skill + playwright MCP |

## 项目硬约定（见 `10-coding-conventions.mdc`，勿违反）

- 移动端：Expo Router `app/` 目录，5 Tab，禁用 react-navigation 手动配置；状态 Zustand + TanStack Query；消息 expo-sqlite 缓存 100 条/会话；热更新 Expo Update。
- Web：App Router 禁用 Pages Router；Tailwind + shadcn/ui 禁裸写 CSS；RSC 优先，客户端组件标 `'use client'`。
- 禁用 Taro/uni-app（已定稿 RN+Expo）。
