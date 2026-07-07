#!/usr/bin/env bash
# =============================================================================
# MemeChatAI 一键开发启动脚本
# 启动 docker-compose dev（PG + Redis）+ backend + web + mobile
# 用法：bash scripts/dev.sh
# =============================================================================

set -e

cd "$(dirname "$0")/.."
ROOT_DIR="$(pwd)"

echo "🚀 MemeChatAI Dev Launcher"
echo "----------------------------------------"

# 1) 启动 PG + Redis
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker 未运行，请先启动 Docker Desktop"
  exit 1
fi

echo "📦 启动 docker-compose dev (PG + Redis)..."
docker compose -f docker-compose.dev.yml up -d

# 等待 PG ready
echo "⏳ 等待 PostgreSQL 就绪..."
for i in $(seq 1 30); do
  if docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U app -d meme >/dev/null 2>&1; then
    echo "✅ PostgreSQL 就绪"
    break
  fi
  sleep 1
done

# 2) 并行启动 backend + web + mobile
echo "🔧 启动 backend / web / mobile..."
pnpm --filter @memestar/backend dev &
BACKEND_PID=$!
pnpm --filter @memestar/web dev &
WEB_PID=$!
pnpm --filter @memestar/mobile start &
MOBILE_PID=$!

trap "echo; echo '🛑 停止所有进程...'; kill $BACKEND_PID $WEB_PID $MOBILE_PID 2>/dev/null || true; docker compose -f docker-compose.dev.yml stop" INT TERM EXIT

echo "----------------------------------------"
echo "✅ 全部启动"
echo "  Backend:  http://localhost:3000"
echo "  Web:      http://localhost:3001"
echo "  Mobile:   exp://localhost:8081 (Expo DevTools)"
echo "  Swagger:  http://localhost:3000/docs"
echo "按 Ctrl+C 退出"

wait
