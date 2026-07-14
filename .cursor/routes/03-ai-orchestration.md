# 03 · AI 编排路由

> 覆盖：**AI 生成链路（LLM/图像/视频/TTS）** + **成本熔断** + **Prompt 工程** + **推荐/RAG** + **AIGC 合规** + **AI 评测**。
>
> 项目栈：Vercel AI SDK + 自建 adapter 抽象层；DeepSeek V3 主 + GLM-4 Flash 兜底；SiliconFlow FLUX + 通义万相；豆包 Seedance 2.0 mini 视频；火山引擎 TTS；pgvector RAG。

## Skills（按需 Read `.agents/skills/<name>/SKILL.md`）

### 成本与熔断
| skill | 用途 | 何时读 |
|---|---|---|
| `cost-aware-llm-pipeline` | LLM 流水线成本优化、降级 | 设计 AI 调用链 |
| `cost-tracking` | 成本追踪埋点 | 写 `ai_cost_logs` + Policy Engine |

### Prompt 与生成
| skill | 用途 | 何时读 |
|---|---|---|
| `prompt-optimizer` | Prompt 优化、模板设计 | 写/改 AI prompt 模板（`packages/shared`） |
| `regex-vs-llm-structured-text` | 结构化文本：正则 vs LLM 取舍 | 解析 AI 输出/候选 |

### 推荐与检索
| skill | 用途 | 何时读 |
|---|---|---|
| `recsys-pipeline-architect` | 推荐系统架构、feed 排序 | **做梗卡 feed 推荐**（recommend Module） |
| `content-hash-cache-pattern` | 内容哈希缓存（避免重复生成） | 缓存 AI 产物 |

### 合规与评测
| skill | 用途 | 何时读 |
|---|---|---|
| `safety-guard` | AI 安全护栏、内容过滤 | AIGC 合规、机审（audit Module） |
| `eval-harness` | AI 评测框架 | 评测造梗质量 |
| `agent-eval` | Agent 评测 | 评测 Pro Agent 3 步流程 |
| `agent-self-evaluation` | 自评选优 | **Pro Agent 第 3 步**：生成 3 候选后 LLM 自评选优 |

## Rules（自动加载）

| rule | 路径 | 用途 |
|---|---|---|
| `10-coding-conventions.mdc` §AI 编排层 | `.cursor/rules/` | **AI 编排契约**：必走 AIOrchModule、adapter interface、降级链、Pro Agent 3 步、配额 |
| `00-project-context.mdc` §核心约定 5/6 | `.cursor/rules/` | 异步任务统一模式、成本硬熔断、配额 |

## 关联 skill（在其他路由）

- **异步任务执行**：`bullmq-queue`（见 `02-backend.md`）——AI 生成接口的队列契约。
- **向量存储**：`drizzle-orm` §pgvector（见 `02-backend.md`）——RAG 检索的存储层。
- **Pro Agent 编排**：`06-agent-harness.md` 的 `plan-orchestrate` / `orch-build-mvp`——多步 Agent 流程。

## MCP / 工具

- **sequential-thinking MCP**（见 `08-mcp-servers.md`）：复杂 AI 编排决策时用，分步推理。
- **context7 MCP**：查 Vercel AI SDK / DeepSeek / 豆包 API 文档。

## 典型任务 → 工具选择

| 任务 | 用什么 |
|---|---|
| 写文本造梗接口 | `bullmq-queue`（队列契约）+ `prompt-optimizer`（prompt 模板）+ `cost-tracking`（埋点）+ `10-coding-conventions` §AI 编排 |
| 写 Pro 造梗 Agent（3 步） | `prompt-optimizer` + `agent-self-evaluation`（第 3 步自评）+ `plan-orchestrate`（多步编排）+ `cost-aware-llm-pipeline` |
| 写图片/视频/TTS adapter | `10-coding-conventions` §AI 编排层（adapter interface + 注册 + 降级链）+ 对应 provider 文档（context7 MCP 查） |
| 做梗卡推荐 feed | `recsys-pipeline-architect` + `drizzle-orm` §pgvector（向量化+检索） |
| 写机审（内容安全） | `safety-guard` + 阿里云内容安全 API（S1 阻塞项需申请 key） |
| 配成本熔断 | `cost-tracking` + `cost-aware-llm-pipeline` + Policy Engine（日预算 Agent ¥80/视频 ¥200） |
| 评测造梗质量 | `eval-harness` + `agent-eval` |

## 项目硬约定（见 `10-coding-conventions.mdc` §AI 编排层，勿违反）

- **必走 `AIOrchModule`**：`LLMProvider`/`ImageProvider`/`VideoProvider`/`TTSProvider` interface 在 `adapters/interfaces.ts`；新增 provider 实现 interface + 注册 `adapters/index.ts` + 配降级链。
- **降级链**：DeepSeek→GLM→Qwen；SiliconFlow FLUX→通义万相；豆包 Seedance→即梦→SiliconFlow→图片+TTS 兜底。
- **Pro Agent 3 步**：RAG 检索（pgvector top5）→ 生成 3 候选 → LLM 自评选优。仅 Pro，10 次/日硬配额。
- **异步契约**：POST→202+job_id→轮询 GET 或 WS 推送；状态机 `queued→running→succeeded/failed/timeout`。
- **成本硬熔断**：Agent 日预算 ¥80、视频日预算 ¥200，超限自动降级；配额：免费视频 1次/周·Pro 3次/日；Pro Agent 10次/日。
- **AIGC 合规**：所有 AI 生成内容带"AI 生成"标识；M3 上线前完成生成式 AI 服务备案（上线 gate）。
