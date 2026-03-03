#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! npm --prefix backend exec -- vitest --version >/dev/null 2>&1; then
  echo "[start-backend] vitest not found, installing backend dependencies..."
  npm --prefix backend install
fi

echo "[start-backend] running backend tests..."
npm --prefix backend run test

echo "[start-backend] starting backend dev server..."
./backend/scripts/start.sh
