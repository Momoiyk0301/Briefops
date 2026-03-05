#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[start-backend] starting backend dev server..."
npm --prefix backend run dev -- -H 127.0.0.1 -p 3000
