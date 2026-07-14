# 05 · 质量与测试路由

> 覆盖：**测试框架（Jest/Playwright）** + **安全评审** + **代码评审** + **TDD** + **E2E**。
>
> 项目现状：双端 QA 测试套件 166 用例全通过（backend e2e 114 + 根 api.smoke 13 + web Playwright 23 + mobile jest 16）。详见 `docs/qa/test-report.md`。

## Skills（按需 Read `.agents/skills/<name>/SKILL.md`）

### 测试框架
| skill | 用途 | 何时读 |
|---|---|---|
| `jest` | Jest 配置、mock、断言 | 写 backend e2e / mobile jest（项目用 Jest） |
| `playwright` | Playwright 浏览器 E2E | 写 web E2E（`apps/web/tests/e2e/`） |

### 测试策略
| skill | 用途 | 何时读 |
|---|---|---|
| `test-writer` | 测试编写辅助 | 写新测试 |
| `tdd-workflow` | TDD 流程（RED→GREEN→REFACTOR） | 新功能用 TDD |
| `e2e-testing` | E2E 通用策略 | 设计 E2E 套件 |
| `webapp-testing` | Web 应用测试 | 测 web |
| `browser-qa` | 浏览器 QA | 浏览器手工/自动 QA |
| `verification-loop` | 验证循环、回归 | 改动后回归验证 |

### 安全与评审
| skill | 用途 | 何时读 |
|---|---|---|
| `security-review` | 安全评审 | 安全敏感改动前/提交前 |
| `security-scan` | 安全扫描 | 跑安全扫描 |
| `coding-standards` | 编码标准核查 | 代码质量检查 |
| `plankton-code-quality` | 代码质量审计 | 代码健康度审计 |

> 代码评审 agent 见 `06-agent-harness.md`（`ecc-agent-code-reviewer` / `ecc-agent-security-reviewer`）。

## Rules（自动加载）

| rule | 路径 | 加载 | 用途 |
|---|---|---|---|
| ecc-common-testing | `.cursor/rules/` | alwaysApply | 测试要求（80% 覆盖率、TDD 强制） |
| ecc-common-code-review | `.cursor/rules/` | alwaysApply | 代码评审标准、严重级别、触发时机 |
| ecc-common-security | `.cursor/rules/` | alwaysApply | 安全清单（密钥/SQL注入/XSS/CSRF/鉴权/限流） |
| ecc-typescript-testing | `.cursor/rules/` | globs `**/*.ts,**/*.tsx` | TS 测试规范 |
| ecc-react-testing / ecc-react-native-testing / ecc-web-testing | `.cursor/rules/` | globs | 各端测试规范 |
| `10-coding-conventions.mdc` | `.cursor/rules/` | globs `apps/**,packages/**` | TS strict、ESLint+Prettier、禁 console.log |

## MCP / 工具

- **playwright MCP** / **chrome-devtools MCP**（见 `08-mcp-servers.md`）：浏览器 E2E 自动化、性能/网络调试。
- **Cursor Task `bugbot` / `security-review` subagent**（见 `06-agent-harness.md`）：本地改动评审 / 安全评审（用户显式要求时）。

## 典型任务 → 工具选择

| 任务 | 用什么 |
|---|---|
| 写 backend e2e 测试 | `jest` + `nestjs-patterns`（supertest）+ 看 `apps/backend/test/e2e/`（6 spec 已就位） |
| 写 mobile 组件测试 | `jest` + `react-testing` + 看 `apps/mobile/__tests__/`（已就位） |
| 写 web E2E | `playwright` skill + playwright MCP + 看 `apps/web/tests/e2e/` |
| 提交前安全检查 | `security-review` + `security-scan` + ecc-common-security 清单 |
| 写完代码评审 | `ecc-agent-code-reviewer` 技能（Read SKILL.md）或 Task `bugbot` subagent |
| 新功能 TDD | `tdd-workflow`（先写测试 RED → 实现 GREEN → 重构） |
| 改动后回归 | `verification-loop` + 跑 `pnpm test` |

## 项目测试现状（166 用例）

| 套件 | 位置 | 用例数 | 框架 |
|---|---|---|---|
| backend e2e | `apps/backend/test/e2e/`（6 spec：冒烟/鉴权/全量路由/功能/压力/性能） | 114 | Jest + supertest |
| 根级冒烟 | `tests/backend/api.smoke.test.ts` | 13 | Jest |
| web E2E | `apps/web/tests/e2e/`（3 spec：冒烟/路由/功能） | 23 | Playwright chromium |
| mobile | `apps/mobile/__tests__/`（2 spec：组件/13 屏渲染冒烟） | 16 | Jest + ts-jest + RN/expo-router mock |

## 项目硬约定

- TS strict + `noUncheckedIndexedAccess: true`；ESLint + Prettier + husky pre-commit + commitlint。
- 禁 `console.log` 调试语句残留。
- 安全敏感代码（auth/payments/user data）改动前必评审（ecc-common-security）。
- 测试覆盖率目标 80%（ecc-common-testing）。
