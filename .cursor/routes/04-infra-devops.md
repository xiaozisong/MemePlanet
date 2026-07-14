# 04 · 基础设施 / DevOps 路由

> 覆盖：**Docker** + **GitHub Actions CI/CD** + **部署** + **监控** + **Git 工作流** + **终端操作**。
>
> 项目栈：Docker（docker-compose.dev.yml + Dockerfile.backend）+ 国内轻量云 2C2G + Cloudflare 边缘 + GitHub Actions + Sentry/PostHog/UptimeRobot + husky/lint-staged/commitlint。

## Skills（按需 Read `.agents/skills/<name>/SKILL.md`）

### Docker
| skill | 用途 | 何时读 |
|---|---|---|
| `docker-basics` | Docker 基础、容器生命周期 | 写/跑容器 |
| `docker-compose` | 多容器编排、网络、卷 | 改 `docker-compose.dev.yml` |
| `docker-dockerfile` | Dockerfile 最佳实践 | 写 `Dockerfile.backend` |
| `docker-run` | docker run 参数、调试 | 调容器 |
| `docker-production` | 生产部署、资源限制 | 生产配置 |
| `docker-security` | 容器安全、镜像扫描 | 安全加固 |

> 其余 docker skill（buildx/cicd/hub/networking/storage/scout/testcontainers/troubleshooting/ai-ml/build）已归档，见 `10-dormant.md`，按需从 `.cursor/ecc-reference/skills/` 取回。

### CI/CD 与部署
| skill | 用途 | 何时读 |
|---|---|---|
| `github-ops` | GitHub 操作、PR、release | 写 GitHub Actions / `gh` 命令 |
| `deployment-patterns` | 部署策略（蓝绿/滚动/canary） | 规划部署 |
| `delivery-gate` | 上线 gate、发布门禁 | **M3 上线 gate**（AIGC 备案） |
| `canary-watch` | 灰度监控、告警 | 灰度发布（豆包成本风险，DAU≤500~2000） |

### Git 与终端
| skill | 用途 | 何时读 |
|---|---|---|
| `git-workflow` | Git 分支、提交、PR 流程 | 提交代码 |
| `terminal-ops` | 终端操作技巧 | 跑命令 |

### 文档
| skill | 用途 | 何时读 |
|---|---|---|
| `documentation-builder` | 文档生成、结构 | 写/生成 docs |

## Rules（自动加载）

| rule | 路径 | 加载 | 用途 |
|---|---|---|---|
| ecc-common-git-workflow | `.cursor/rules/` | alwaysApply | Git 提交格式、PR 流程（项目 `10-coding-conventions.mdc` §提交规范优先） |
| `30-context-maintenance.mdc` | `.cursor/rules/` | alwaysApply | PR 自动校验（`.github/workflows/context-sync.yml`）、`pnpm check:context` |

## Hooks

- **beforeShellExecution**（见 `09-hooks.md`）：阻断 `git --no-verify` / `--no-gpg-sign`，保护 husky pre-commit/commit-msg/pre-push。

## MCP / 工具

- **cloudflare-docs MCP**（见 `08-mcp-servers.md`）：查 Cloudflare R2/边缘部署文档。
- **Cursor `cursor-app-control` MCP**：create_project / move_agent_to_root / open_resource 等。

## 典型任务 → 工具选择

| 任务 | 用什么 |
|---|---|
| 改 docker-compose 加服务 | `docker-compose` + `docker-basics` |
| 写后端 Dockerfile | `docker-dockerfile` + `docker-production`（多阶段构建、资源限制 2C2G） |
| 写 GitHub Actions | `github-ops` + 看 `.github/workflows/`（context-sync.yml 已就位） |
| 配部署（Cloudflare 边缘） | `deployment-patterns` + cloudflare-docs MCP |
| 灰度发布监控 | `canary-watch` + Sentry/PostHog/UptimeRobot 接入 |
| 上线 gate 检查 | `delivery-gate`（AIGC 备案号是 M3 硬 gate） |
| 提交代码 | `git-workflow` + commitlint conventional（`<type>(<scope>): <subject>`）+ husky 自动 lint-staged |
| 跑上下文校验 | `terminal-ops` + `pnpm check:context` |

## 项目命令速查（见 `00-project-context.mdc`）

```bash
pnpm db:init       # 起 PG+Redis 容器 + 跑 schema/seed
pnpm gen:api       # 从 openapi.yaml 生成 TS 类型
pnpm dev:backend   # :3000（Swagger /docs, /health）
pnpm dev:web       # :3001
pnpm dev:mobile    # Expo :8081
pnpm check:context # 10 项上下文一致性校验
```

## 项目硬约定

- 部署：国内轻量云 2C2G + Cloudflare 边缘 + Docker（成本最优）。
- CI：GitHub Actions；commitlint conventional + husky pre-commit。
- 监控：Sentry（错误）+ PostHog（行为）+ UptimeRobot（可用性）。
- **豆包视频成本是最大风险**：MVP 灰度 DAU ≤ 500~2000。
