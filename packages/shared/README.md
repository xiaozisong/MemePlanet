# @memestar/shared

梗星球 MemeChatAI 三端共享层（Web / Mobile / Backend 共用）。

## 模块

- `types/` — 与 `docs/db/schema.sql` 对齐的 TS 类型（User / MemeCard / Legion / PK / Rating / Comment 等）
- `api-client/` — 基于 `fetch` 的统一 API client，复用 `openapi-typescript` 生成的类型（`generated.ts`）
- `constants/` — 错误码、PK 状态、Agent 状态机、内容安全等级等枚举与常量
- `prompts/` — AI prompt 模板（5 个官方模板：抽象 / 阴阳 / 谐音 / 反转 / 表情包配文）

## 生成 API 类型

```bash
pnpm gen:api
```

该命令读取 `docs/openapi.yaml`，生成 `src/api-client/generated.ts`。**请勿手动编辑此文件**。

## 构建

```bash
pnpm --filter @memestar/shared build
```
