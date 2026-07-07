---
name: vite
description: Guidance for Vite using the official Guide, Config Reference, and Plugins pages. Use when the user needs Vite setup, configuration, or plugin selection details.
license: Complete terms in LICENSE.txt
---

## When to use this skill

Use this skill whenever the user wants to:
- Follow Vite Guide topics from getting started to performance
- Configure Vite using the official config reference
- Select or understand Vite plugins from the official plugins page
- Use Vite CLI, HMR API, or JavaScript API
- Handle SSR, backend integration, or deployment scenarios in Vite

## How to use this skill

1. **Identify the topic** from the user request.
2. **Open the matching guide example** file in `examples/guide/`.
3. **If configuration is needed**, open the matching file in `examples/config/`.
4. **If plugin selection is needed**, open `examples/plugins.md`.
5. **Follow official docs verbatim** and keep output consistent with the referenced page.

### Guide mapping (one-to-one with https://cn.vitejs.dev/guide/)

**Introduction**
- `examples/guide/getting-started.md` → https://cn.vitejs.dev/guide/
- `examples/guide/philosophy.md` → https://cn.vitejs.dev/guide/philosophy.html
- `examples/guide/why-vite.md` → https://cn.vitejs.dev/guide/why.html

**Guide**
- `examples/guide/features.md` → https://cn.vitejs.dev/guide/features.html
- `examples/guide/cli.md` → https://cn.vitejs.dev/guide/cli.html
- `examples/guide/using-plugins.md` → https://cn.vitejs.dev/guide/using-plugins.html
- `examples/guide/dep-pre-bundling.md` → https://cn.vitejs.dev/guide/dep-pre-bundling.html
- `examples/guide/assets.md` → https://cn.vitejs.dev/guide/assets.html
- `examples/guide/build.md` → https://cn.vitejs.dev/guide/build.html
- `examples/guide/static-deploy.md` → https://cn.vitejs.dev/guide/static-deploy.html
- `examples/guide/env-and-mode.md` → https://cn.vitejs.dev/guide/env-and-mode.html
- `examples/guide/ssr.md` → https://cn.vitejs.dev/guide/ssr.html
- `examples/guide/backend-integration.md` → https://cn.vitejs.dev/guide/backend-integration.html
- `examples/guide/troubleshooting.md` → https://cn.vitejs.dev/guide/troubleshooting.html
- `examples/guide/performance.md` → https://cn.vitejs.dev/guide/performance.html
- `examples/guide/migration.md` → https://cn.vitejs.dev/guide/migration.html

**APIs**
- `examples/guide/api-plugin.md` → https://cn.vitejs.dev/guide/api-plugin.html
- `examples/guide/api-hmr.md` → https://cn.vitejs.dev/guide/api-hmr.html
- `examples/guide/api-javascript.md` → https://cn.vitejs.dev/guide/api-javascript.html

**Environment API**
- `examples/guide/api-environment.md` → https://cn.vitejs.dev/guide/api-environment.html
- `examples/guide/api-environment-instances.md` → https://cn.vitejs.dev/guide/api-environment-instances.html
- `examples/guide/api-environment-plugins.md` → https://cn.vitejs.dev/guide/api-environment-plugins.html
- `examples/guide/api-environment-frameworks.md` → https://cn.vitejs.dev/guide/api-environment-frameworks.html
- `examples/guide/api-environment-runtimes.md` → https://cn.vitejs.dev/guide/api-environment-runtimes.html

### Config mapping (one-to-one with https://cn.vitejs.dev/config/)

- `examples/config/configuring-vite.md` → https://cn.vitejs.dev/config/
- `examples/config/shared-options.md` → https://cn.vitejs.dev/config/shared-options.html
- `examples/config/server-options.md` → https://cn.vitejs.dev/config/server-options.html
- `examples/config/build-options.md` → https://cn.vitejs.dev/config/build-options.html
- `examples/config/preview-options.md` → https://cn.vitejs.dev/config/preview-options.html
- `examples/config/dep-optimization-options.md` → https://cn.vitejs.dev/config/dep-optimization-options.html
- `examples/config/ssr-options.md` → https://cn.vitejs.dev/config/ssr-options.html
- `examples/config/worker-options.md` → https://cn.vitejs.dev/config/worker-options.html

### Plugins mapping (one-to-one with https://cn.vitejs.dev/plugins/)

- `examples/plugins.md` → https://cn.vitejs.dev/plugins/

## Resources
- Guide: https://cn.vitejs.dev/guide/
- Config: https://cn.vitejs.dev/config/
- Plugins: https://cn.vitejs.dev/plugins/

## Keywords
Vite, build tool, dev server, HMR, config, plugins, SSR, CLI, dependency pre-bundling, assets

## 国内适配

- 支持中文文档和中文注释
- 示例代码兼容国内开发环境
- 提供中文 FAQ 和常见问题解答

## 能力边界

### ✅ 适用场景
- 当你需要使用此技能对应的技术栈时
- 当项目需要遵循最佳实践时
- 当需要快速上手或深入理解核心概念时

### ⚠️ 需要注意
- 复杂业务逻辑需要结合具体场景调整
- 性能优化需要根据实际数据量评估

### ❌ 不适用场景
- 不相关的技术栈或框架
- 需要完全自定义的特殊场景

## 使用流程

### Step 1: 环境准备
确保开发环境已安装必要的依赖和工具。

### Step 2: 配置初始化
根据项目需求进行基础配置。

### Step 3: 核心功能使用
按照示例代码实现核心功能。

### Step 4: 测试验证
运行测试确保功能正常。

### Step 5: 部署上线
完成开发后进行部署和监控。
