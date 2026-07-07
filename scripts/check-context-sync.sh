#!/usr/bin/env bash
# =============================================================================
# check-context-sync.sh —— 上下文一致性校验
# 检查 schema.sql / Drizzle schema / openapi.yaml / API-Spec.md / activeContext 之间是否漂移
# 用法：bash scripts/check-context-sync.sh
# 退出码：0=全部通过，1=有警告，2=有严重错误
# =============================================================================
set -u

cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

# 颜色
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
REPORT=""

add_err() {
  ERRORS=$((ERRORS + 1))
  REPORT+="\n${RED}[ERROR]${NC} $1\n"
}
add_warn() {
  WARNINGS=$((WARNINGS + 1))
  REPORT+="\n${YELLOW}[WARN]${NC} $1\n"
}
add_ok() {
  REPORT+="\n${GREEN}[OK]${NC} $1\n"
}

echo "🔍 检查上下文一致性..."
echo "=============================================="

# -----------------------------------------------------------------------------
# 1. schema.sql 表数量
# -----------------------------------------------------------------------------
SCHEMA_SQL="docs/db/schema.sql"
if [ -f "$SCHEMA_SQL" ]; then
  SCHEMA_TABLES=$(rg -c "^CREATE TABLE" "$SCHEMA_SQL" 2>/dev/null || echo 0)
  # 减去分区默认子表（_default PARTITION OF）
  PARTITION_DEFAULT=$(rg -c "_default PARTITION OF" "$SCHEMA_SQL" 2>/dev/null || echo 0)
  SCHEMA_BASE=$((SCHEMA_TABLES - PARTITION_DEFAULT))
  if [ "$SCHEMA_TABLES" -ge 46 ]; then
    add_ok "schema.sql: ${SCHEMA_TABLES} 张表（含 ${PARTITION_DEFAULT} 分区子表，业务基表 ${SCHEMA_BASE}）"
  else
    add_err "schema.sql 表数 ${SCHEMA_TABLES} 异常（预期 ≥46），可能被误删"
  fi
else
  add_err "缺少 $SCHEMA_SQL"
fi

# -----------------------------------------------------------------------------
# 2. schema.sql 索引数量
# -----------------------------------------------------------------------------
if [ -f "$SCHEMA_SQL" ]; then
  SCHEMA_INDEXES=$(rg -c "^CREATE (UNIQUE )?INDEX" "$SCHEMA_SQL" 2>/dev/null || echo 0)
  if [ "$SCHEMA_INDEXES" -ge 100 ]; then
    add_ok "schema.sql: ${SCHEMA_INDEXES} 个索引"
  else
    add_warn "schema.sql 索引数 ${SCHEMA_INDEXES} 偏少（预期 ≥100）"
  fi
fi

# -----------------------------------------------------------------------------
# 3. Drizzle schema.ts 是否仍是占位
# -----------------------------------------------------------------------------
DRIZZLE_SCHEMA="apps/backend/src/database/schema.ts"
if [ -f "$DRIZZLE_SCHEMA" ]; then
  if rg -q "schemaPlaceholder" "$DRIZZLE_SCHEMA"; then
    add_warn "Drizzle schema.ts 仍是占位（M1 S1 阶段正常，编码后需用 drizzle-kit introspect 生成真实 schema 并重新校验）"
  else
    # 统计 Drizzle pgTable 定义数
    DRIZZLE_TABLES=$(rg -c "pgTable\(" "$DRIZZLE_SCHEMA" 2>/dev/null || echo 0)
    if [ "$DRIZZLE_TABLES" -ne "$SCHEMA_BASE" ]; then
      add_err "Drizzle schema.ts 表数 ${DRIZZLE_TABLES} ≠ schema.sql 业务基表 ${SCHEMA_BASE}，需同步"
    else
      add_ok "Drizzle schema.ts 与 schema.sql 表数一致（${DRIZZLE_TABLES}）"
    fi
  fi
else
  add_err "缺少 $DRIZZLE_SCHEMA"
fi

# -----------------------------------------------------------------------------
# 4. openapi.yaml path 数量
# -----------------------------------------------------------------------------
OPENAPI_YAML="docs/openapi.yaml"
if [ -f "$OPENAPI_YAML" ]; then
  OPENAPI_PATHS=$(rg -c "^\s+/" "$OPENAPI_YAML" 2>/dev/null || echo 0)
  if [ "$OPENAPI_PATHS" -ge 25 ]; then
    add_ok "openapi.yaml: ${OPENAPI_PATHS} 个 path"
  else
    add_warn "openapi.yaml path 数 ${OPENAPI_PATHS} 偏少（预期 ≥25）"
  fi
else
  add_err "缺少 $OPENAPI_YAML"
fi

# -----------------------------------------------------------------------------
# 5. API-Spec.md 接口数 vs openapi.yaml
# -----------------------------------------------------------------------------
API_SPEC="docs/API-Spec.md"
if [ -f "$API_SPEC" ]; then
  API_SPEC_ENDPOINTS=$(rg -c "(GET|POST|PUT|PATCH|DELETE) /" "$API_SPEC" 2>/dev/null || echo 0)
  if [ "$API_SPEC_ENDPOINTS" -ge 30 ]; then
    add_ok "API-Spec.md: ${API_SPEC_ENDPOINTS} 个接口记录"
  else
    add_warn "API-Spec.md 接口数 ${API_SPEC_ENDPOINTS} 偏少（预期 ≥30）"
  fi
fi

# -----------------------------------------------------------------------------
# 6. activeContext.md "最后更新" 是否在 7 天内
# -----------------------------------------------------------------------------
ACTIVE_CTX="docs/context/activeContext.md"
if [ -f "$ACTIVE_CTX" ]; then
  LAST_UPDATE=$(rg "^\*\*最后更新\*\*：" "$ACTIVE_CTX" | rg -o "[0-9]{4}-[0-9]{2}-[0-9]{2}" | head -1)
  if [ -n "$LAST_UPDATE" ]; then
    TODAY=$(date +%Y-%m-%d)
    DAYS_DIFF=$(( ( $(date -j -f "%Y-%m-%d" "$TODAY" +%s) - $(date -j -f "%Y-%m-%d" "$LAST_UPDATE" +%s) ) / 86400 ))
    if [ "$DAYS_DIFF" -le 7 ]; then
      add_ok "activeContext.md 最后更新于 ${LAST_UPDATE}（${DAYS_DIFF} 天前）"
    else
      add_warn "activeContext.md 已 ${DAYS_DIFF} 天未更新（${LAST_UPDATE}），可能上下文漂移，建议跑 /update-context"
    fi
  else
    add_warn "activeContext.md 缺少 '最后更新' 字段"
  fi
else
  add_err "缺少 $ACTIVE_CTX"
fi

# -----------------------------------------------------------------------------
# 7. decisions.md ADR 数量
# -----------------------------------------------------------------------------
DECISIONS="docs/context/decisions.md"
if [ -f "$DECISIONS" ]; then
  ADR_COUNT=$(rg -c "^## ADR-" "$DECISIONS" 2>/dev/null || echo 0)
  if [ "$ADR_COUNT" -ge 12 ]; then
    add_ok "decisions.md: ${ADR_COUNT} 项 ADR"
  else
    add_warn "decisions.md ADR 数 ${ADR_COUNT}（预期 12），可能漏记决策"
  fi
fi

# -----------------------------------------------------------------------------
# 8. 进度文件存在性
# -----------------------------------------------------------------------------
for f in docs/context/activeContext.md docs/context/decisions.md docs/context/progress.md; do
  if [ -f "$f" ]; then
    add_ok "$f 存在"
  else
    add_err "缺少 $f"
  fi
done

# -----------------------------------------------------------------------------
# 9. 关键文档存在性
# -----------------------------------------------------------------------------
for f in docs/PRD.md docs/TechnicalDesign.md docs/M1-Sprint-Plan.md docs/Database-DDL.md docs/API-Spec.md docs/openapi.yaml docs/db/schema.sql docs/db/seed.sql; do
  if [ -f "$f" ]; then
    : # 静默通过，避免噪音
  else
    add_err "缺少关键文档 $f"
  fi
done

# -----------------------------------------------------------------------------
# 10. .cursor/rules 规则文件
# -----------------------------------------------------------------------------
EXPECTED_RULES=(
  ".cursor/rules/00-project-context.mdc"
  ".cursor/rules/10-coding-conventions.mdc"
  ".cursor/rules/20-m1-sprint.mdc"
  ".cursor/rules/30-context-maintenance.mdc"
  ".cursor/rules/update-context.mdc"
)
for rule in "${EXPECTED_RULES[@]}"; do
  if [ -f "$rule" ]; then
    add_ok "$rule 存在"
  else
    add_err "缺少规则文件 $rule"
  fi
done

# -----------------------------------------------------------------------------
# 汇总
# -----------------------------------------------------------------------------
echo -e "$REPORT"
echo "=============================================="
echo "结果: ${GREEN}OK ${GREEN}${ERRORS} 错误${NC} / ${YELLOW}${WARNINGS} 警告${NC}"

if [ "$ERRORS" -gt 0 ]; then
  echo "${RED}❌ 存在严重漂移，请修复后再提交${NC}"
  exit 2
elif [ "$WARNINGS" -gt 0 ]; then
  echo "${YELLOW}⚠️  存在警告，建议处理${NC}"
  exit 1
else
  echo "${GREEN}✅ 上下文一致性校验通过${NC}"
  exit 0
fi
