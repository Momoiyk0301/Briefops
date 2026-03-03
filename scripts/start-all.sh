#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/start-backend.sh &
BACKEND_PID=$!

./scripts/start-frontend.sh &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

wait -n "$BACKEND_PID" "$FRONTEND_PID"
