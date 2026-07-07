#!/usr/bin/env bash
# =============================================================================
# 初始化 PostgreSQL 数据库：
#   1) 启动 docker-compose dev（若未运行）
#   2) 建扩展（vector / pg_trgm / citext / uuid-ossp / btree_gin）
#   3) 执行 docs/db/schema.sql
#   4) 执行 docs/db/seed.sql
# 用法：bash scripts/db-init.sh
# =============================================================================

set -e

cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

PG_CONTAINER="memestar-postgres-dev"
SCHEMA_SQL="${ROOT_DIR}/docs/db/schema.sql"
SEED_SQL="${ROOT_DIR}/docs/db/seed.sql"
PG_USER="${POSTGRES_USER:-app}"
PG_DB="${POSTGRES_DB:-meme}"

# 1) 确保 PG 运行
if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  echo "📦 启动 docker-compose dev..."
  docker compose -f docker-compose.dev.yml up -d postgres
fi

# 等待就绪
echo "⏳ 等待 PostgreSQL 就绪..."
for i in $(seq 1 30); do
  if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    echo "✅ PostgreSQL 就绪"
    break
  fi
  sleep 1
done

# 2) 执行 schema.sql
if [ -f "$SCHEMA_SQL" ]; then
  echo "📄 执行 schema.sql ..."
  docker cp "$SCHEMA_SQL" "${PG_CONTAINER}:/tmp/schema.sql"
  docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -f /tmp/schema.sql
else
  echo "⚠️  未找到 $SCHEMA_SQL，跳过"
fi

# 3) 执行 seed.sql
if [ -f "$SEED_SQL" ]; then
  echo "🌱 执行 seed.sql ..."
  docker cp "$SEED_SQL" "${PG_CONTAINER}:/tmp/seed.sql"
  docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -f /tmp/seed.sql
else
  echo "⚠️  未找到 $SEED_SQL，跳过"
fi

echo "✅ 数据库初始化完成"
