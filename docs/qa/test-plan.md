# MemeChatAI 双端测试计划 · Test Plan

> 版本：v1.0 · 编写人：QA（Agent）· 日期：2026-07-07
> 范围：M1 S0/S1 阶段，Web + App 双端启动可用性 + 后端 API 冒烟。
> 目标：**双端可正常启动并使用**，整体通过率 ≥ 80%。

## 1. 测试矩阵

| 端 | 组件 | 端口 | 启动方式 |
|---|---|---|---|
| Backend | NestJS 10 | 3000 | `pnpm dev:backend` |
| Web | Next.js 14 | 3001 | `pnpm dev:web` |
| App | Expo RN 0.74 | 8081/8082 | `pnpm dev:mobile` |

## 2. 测试维度

### 2.1 冒烟测试（Smoke）—— 优先级 P0
验证三端可启动、核心入口可访问。

| ID | 用例 | 期望 | 类型 |
|---|---|---|---|
| S-01 | 后端 `/health` GET | 200 + `{status:"ok"}` | 冒烟 |
| S-02 | 后端 Swagger `/docs` GET | 200 HTML | 冒烟 |
| S-03 | 后端 34 路由全部注册 | 启动日志含所有 RoutesResolver | 冒烟 |
| S-04 | Web 首页 `/` GET | 200 + 含"梗星球" | 冒烟 |
| S-05 | Web `/privacy` GET | 200 | 冒烟 |
| S-06 | Web `/terms` GET | 200 | 冒烟 |
| S-07 | Web `/admin` GET | 200（SSR 不报错） | 冒烟 |
| S-08 | App Metro status | 200 + `"running"` | 冒烟 |
| S-09 | App iOS bundle | 200 + content-type js | 冒烟 |
| S-10 | 全仓 typecheck | exit 0 | 冒烟 |
| S-11 | 全仓 lint | exit 0（无 error） | 冒烟 |

### 2.2 功能测试（Functional）—— P1
验证后端 API 契约符合当前 M1 预期行为。

| ID | 用例 | 请求 | 期望 | 类型 |
|---|---|---|---|---|
| F-01 | 未授权访问受保护接口 | GET `/api/users/me` 无 token | 401 | 功能 |
| F-02 | 错误 token 访问 | GET `/api/users/me` 带 `Bearer invalid` | 401 | 功能 |
| F-03 | OTP 发送缺字段 | POST `/api/auth/otp/send` `{}` | 400 | 功能 |
| F-04 | OTP 发送非法手机号 | POST `/api/auth/otp/send` `{phone:"abc"}` | 400 | 功能 |
| F-05 | 未知路由 | GET `/api/no-such` | 404 | 功能 |
| F-06 | Feed 公开接口 | GET `/api/memes/feed` | 200/401（视守卫） | 功能 |
| F-07 | 健康检查响应字段 | GET `/health` | 含 uptime/env/version | 功能 |
| F-08 | 全局响应拦截器 | 任意成功接口 | body 形如 `{code,data,message}` | 功能 |
| F-09 | 全局异常过滤器 | 400/401/404 | body 形如 `{code,data,message}` | 功能 |
| F-10 | Web admin 子页渲染 | GET `/admin/users`、`/admin/audit`、`/admin/cost`、`/admin/analytics`、`/admin/pk` | 200 | 功能 |

### 2.3 性能测试（Performance）—— P2
| ID | 用例 | 指标 | 阈值 | 类型 |
|---|---|---|---|---|
| P-01 | `/health` 延迟 p50 | ms | ≤ 30ms | 性能 |
| P-02 | `/health` 延迟 p95 | ms | ≤ 80ms | 性能 |
| P-03 | `/health` 延迟 p99 | ms | ≤ 150ms | 性能 |
| P-04 | Web 首页 TTFB | ms | ≤ 500ms | 性能 |
| P-05 | App iOS bundle 首次构建 | ms | ≤ 30000ms | 性能 |

### 2.4 压力测试（Stress）—— P2
| ID | 用例 | 并发 | 期望 | 类型 |
|---|---|---|---|---|
| L-01 | `/health` 100 并发 200 次 | 100 | 错误率 0%，吞吐 ≥ 500 rps | 压力 |
| L-02 | `/api/users/me` 100 并发 200 次（401） | 100 | 100% 返 401，无 5xx | 压力 |

## 3. 测试基础设施

- **测试框架（已落地，非 .mjs 脚本）**：
  - **后端 API**：Jest 29 + supertest + @nestjs/testing
    - `apps/backend/test/e2e/`：01.smoke / 02.auth / 03.routes / 04.functional / 05.stress / 06.perf
    - 配置：`apps/backend/test/jest.e2e.config.json`
    - 运行：`pnpm --filter @memestar/backend test:e2e`
  - **根级黑盒冒烟**：Jest 29 + supertest
    - `tests/backend/api.smoke.test.ts`，配置 `jest.config.js`
    - 运行：`npx jest tests/backend/api.smoke.test.ts`
  - **Web 端**：Playwright 1.61（chromium，channel=chrome）
    - `apps/web/tests/e2e/`：01.smoke / 02.routes / 03.functional
    - 配置：`apps/web/playwright.config.ts`（内建 webServer 自动起 `next dev -p 3001`）
    - 运行：`pnpm --filter @memestar/web test:e2e`
  - **Mobile 端**：Jest 29 + ts-jest + 自建 RN/expo-router mock
    - `apps/mobile/__tests__/`：components / screens.smoke
    - 配置：`apps/mobile/jest.config.js`
    - 运行：`pnpm --filter @memestar/mobile test`
    - Bundle 编译验证：`cd apps/mobile && npx expo export --platform ios`
- **前置条件**：后端在 :3000 运行（`pnpm dev:backend`）；Web/Metro 由 Playwright webServer 自动拉起。
- **报告产物**：`docs/qa/test-report.md`（每次执行后更新）。

## 4. 通过率计算

`通过率 = 通过用例数 / 总用例数 × 100%`，目标 ≥ 80%。
P0 冒烟必须 100% 通过（双端可用底线）；P1/P2 允许 ≤ 20% 失败。

## 5. 缺陷分级

- **Blocker**：双端任一无法启动 → 立即修
- **Critical**：核心接口非预期 5xx → 立即修
- **Major**：接口返回不符合契约 → 修
- **Minor**：性能不达标但功能正常 → 记录
