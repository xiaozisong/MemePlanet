#!/usr/bin/env bash
# =============================================================================
# MemeChatAI Android AVD 调试启动脚本
# 解决 VPN 导致 Expo CLI 选择错误 IP、AVD 无法预览的问题
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " 梗星球 Android AVD 调试启动"
echo "========================================"

# 1) 检查 adb 是否可用
if ! command -v adb &>/dev/null; then
  echo "❌ adb 未安装 / 不在 PATH 中"
  echo "   请安装 Android SDK 或设置 ANDROID_HOME"
  exit 1
fi

# 2) 检查 AVD 是否在线
DEVICES=$(adb devices | grep -v "List of devices attached" | grep -v "^$" | grep "device$" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
  echo "❌ 没有检测到 AVD/Android 设备"
  echo "   请先启动 Android Studio 的 AVD 模拟器"
  exit 1
fi
echo "✅ AVD 已连接（$(adb devices | grep -v "List" | grep -v "^$" | awk '{print $1}')）"

# 3) 检查 Expo Go 是否安装在 AVD 上
if ! adb shell pm list packages 2>/dev/null | grep -q "host.exp.exponent"; then
  echo "❌ AVD 上未安装 Expo Go"
  echo "   请先在 AVD 上通过 Play Store 安装 Expo Go"
  exit 1
fi
echo "✅ Expo Go 已安装"

# 4) 清理旧转发规则并建立 adb reverse
echo "🔧 设置 adb reverse 端口转发..."
adb reverse --remove-all 2>/dev/null
adb reverse tcp:8081 tcp:8081
if [ $? -ne 0 ]; then
  echo "⚠️  adb reverse 设置失败，将使用 --tunnel 模式"
  USE_TUNNEL=true
else
  echo "✅ adb reverse: localhost:8081 → 宿主机:8081"
  USE_TUNNEL=false
fi

# 5) 启动 Expo（带 --dev-client 以允许连接）
echo "🚀 启动 Expo dev server..."
echo "   模式: $([ "$USE_TUNNEL" = true ] && echo '--tunnel' || echo '--localhost (配合 adb reverse)')"
echo ""
echo "   启动后："
echo "     1. AVD 会自动打开 Expo Go"
echo "     2. 如果没自动打开，在 Expo Go 的 'Enter URL manually' 输入:"
echo "        exp://localhost:8081"
echo ""

if [ "$USE_TUNNEL" = true ]; then
  npx expo start --dev-client --tunnel
else
  npx expo start --dev-client --localhost

  # --localhost 模式下，expo CLI 不会自动发 ADB intent
  # 等几秒让 Metro 启动后手动触发
  sleep 5
  echo "📱 通过 ADB 打开 Expo Go..."
  adb shell am start -a android.intent.action.VIEW -d "exp://localhost:8081" 2>/dev/null || true
fi
