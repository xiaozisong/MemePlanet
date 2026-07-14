# 10 · 休眠资产路由

> 项目**不用**但按需保留的参考资产：其他语言/框架的 ECC rules + 归档 skill。这些不进入会话上下文，按需取回。
>
> **瘦身后**：体积 7.4M → 3.6M，休眠 rule 80→30，归档 skill 238→106。

## 休眠 Rules（按需参考，不注入）

> 这些规则在 `.cursor/rules/ecc-<lang>-*.mdc`，globs 限定对应语言文件（如 `**/*.go`/`**/*.rs`）。项目是纯 TS，不会激活。**保留是为按需参考**（如某天写 Go PK 服务）。

| 语言 | 规则数（5 条/语言） | 保留原因 |
|---|---|---|
| Go | 5（coding-style/hooks/patterns/security/testing） | 未来 PK 服务迁 Go 时 |
| Rust | 5 | 参考/性能敏感模块 |
| Java | 5 | 参考 |
| Kotlin | 5 | 参考 |
| Swift | 5 | 参考（跨平台逻辑） |
| Dart | 5 | 参考 |

**已删除**（永久不用的语言）：Angular / Vue / Nuxt / Python / Perl / PHP / Ruby / ArkTS — 共 40 个 `.mdc` 文件。

## 归档 Skills（106 个，在 `.cursor/ecc-reference/skills/`）

P0 瘦身时从 `.agents/skills/` 移出，或从 ECC 原始仓库保留参考。不进入 `available_skills`。按需取回：

### 归档分类（按领域）

| 领域 | 代表 skill | 数量 |
|---|---|---|
| Agent 工程 | agentic-os / autonomous-loops / continuous-agent-loop / continuous-learning / council / gan-style-harness / skill-comply / skill-scout / team-builder / blueprint / dynamic-workflow-mode / rules-distill / codehealth-mcp | ~13 |
| AI/ML 流水线 | ai-first-engineering / ai-regression-testing / data-scraper-agent / data-throughput-accelerator / iterative-retrieval / automation-audit-ops / click-path-audit / loop-design-check / fal-ai-media / remotion-video-creation / video-editing / videodb | ~12 |
| 工程模式 | hexagonal-architecture / tinystruct-patterns / react-native-project-creater / frontend-slides / api-connector-builder / generating-python-installer / maven-search | ~7 |
| 安全 | security-bounty-hunter / gateguard / repo-scan | ~3 |
| 测试框架 | vitest / detox / junit / pytest / cpp-testing / csharp-testing / fsharp-testing / kotlin-testing / rust-testing / golang-testing / perl-testing / python-testing / windows-desktop-e2e / cpp-coding-standards / selenium | ~15 |
| 语言参考 | golang-patterns / golang-testing / rust-patterns / rust-testing / swift-actor-persistence / swift-concurrency-6-2 / swift-protocol-di-testing / swiftui-patterns / kotlin-coroutines-flows / kotlin-exposed-patterns / kotlin-ktor-patterns / kotlin-patterns / kotlin-testing / java-code-comments / java-coding-standards / perl-patterns / perl-security / perl-testing / python-patterns / python-testing / bun-runtime / dart-sass | ~22 |
| Docker 深度 | docker-ai-ml / docker-build / docker-buildx / docker-cicd / docker-hub / docker-networking / docker-patterns / docker-scout / docker-storage / docker-testcontainers / docker-troubleshooting | ~11 |
| 消息/集成 | email-ops / messages-ops / unified-notifications-ops / x-api / exa-search / opensource-pipeline / production-audit / documentation-lookup / knowledge-ops / project-flow-ops / research-ops | ~11 |
| 产品/运营 | product-capability / product-lens | ~2 |
| Flutter/Dart | flutter / flutter-dart-code-review / flutter-project-creater / dart-flutter-patterns | ~4 |
| Motion 动效 | motion-advanced / motion-foundations / motion-patterns / motion-ui / liquid-glass-design | ~5 |
| ECC 编排（归档） | orch-add-feature / orch-change-feature / orch-fix-defect / orch-refine-code / agent-sort / autonomous-loops（已在 Agent 工程） | ~5 |

### 取回归档 skill

1. 把目录从 `.cursor/ecc-reference/skills/<name>/` 移回 `.agents/skills/<name>/`
2. 重启 Cursor 会话
3. **警告**：启用越多 skill，`available_skills` 列表注入上下文越多，挤压可用窗口。建议只在确实需要时启用单个。

### 本轮瘦身新增归档维护说明

对于新发现的 P0 瘦身、或从 `.agents/skills/` 新移入的 skill，统一追加到 `.cursor/ecc-reference/skills/`，并在本路由更新分类和计数。

## 维护

- 项目栈新增语言/框架时，把对应 `ecc-<lang>-*.mdc` 的 globs 调整为匹配项目文件，让其激活。
- 某归档 skill 变得需要时，移回 `.agents/skills/` 并更新本文件 + `README.md` 计数。

## 裁剪历史

| 日期 | 动作 | 影响 |
|---|---|---|
| 2026-07-13 | `vitest` / `detox` → 归档 | 活动 skill 107→105，归档 236→238 |
| 2026-07-14 | **归档激进瘦身**：删除区块链/Web3/网络运维/医疗物流/营销/科研/ITO/不相关框架/不相关集成等 ~132 个归档 skill | 归档 238→106（-55%），体积 7.4M→3.6M |
| 2026-07-14 | **休眠 rule 激进瘦身**：删除 Angular/Vue/Nuxt/Python/Perl/PHP/Ruby/ArkTS 共 8 语言 × 5 规则 = 40 个 .mdc 文件 | 休眠 rule 80→30（仅保留 Go/Rust/Java/Kotlin/Swift/Dart） |
