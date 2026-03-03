#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[start-backend] running backend tests..."
npm --prefix backend run test

echo "[start-backend] starting backend dev server..."
./backend/scripts/start.sh
