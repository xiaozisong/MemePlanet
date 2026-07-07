#!/usr/bin/env bash
# =============================================================================
# 从 docs/openapi.yaml 生成 TS 类型到 packages/shared/src/api-client/generated.ts
# 依赖：openapi-typescript（已声明在根 devDependencies）
# 用法：bash scripts/gen-api-types.sh
# =============================================================================

set -e

cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"
SPEC="${ROOT_DIR}/docs/openapi.yaml"
OUT="${ROOT_DIR}/packages/shared/src/api-client/generated.ts"

if [ ! -f "$SPEC" ]; then
  echo "❌ 未找到 $SPEC"
  exit 1
fi

echo "🛠  生成 OpenAPI TS 类型..."
echo "   输入: $SPEC"
echo "   输出: $OUT"

pnpm exec openapi-typescript "$SPEC" -o "$OUT" --export-type --immutable

echo "✅ 完成。请勿手动编辑 generated.ts（由脚本生成）"
