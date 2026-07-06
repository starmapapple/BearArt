#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"
URL="http://localhost:${PORT}/p/colorbear-art"

cd "$ROOT_DIR"

echo "============================================================"
echo "Beart Art Shop 本地启动器"
echo "项目目录: $ROOT_DIR"
echo "访问地址: $URL"
echo "============================================================"

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 Node.js。请先安装 Node.js 后再启动。"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "未检测到 npm。请确认 Node.js 安装完整。"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "首次启动，正在安装依赖..."
  npm install
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "检测到 $PORT 端口已有服务，直接打开页面。"
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  fi
  echo "如果页面仍打不开，请关闭占用 $PORT 端口的旧服务后重新运行本脚本。"
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN || true
  exit 0
fi

echo "正在启动 Next.js 开发服务..."
echo "启动成功后会自动打开: $URL"
echo "保持这个窗口打开，网站才会继续运行。"
echo "需要停止服务时，在这个窗口按 Control + C。"
echo

(
  sleep 3
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  fi
) &

npm run dev -- --hostname 127.0.0.1 --port "$PORT"
