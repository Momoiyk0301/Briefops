#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/ensure-deps.sh

echo "[start-all] running backend tests..."
if ! npm --prefix backend run test; then
  echo "[start-all] backend tests failed. Fix tests before coding."
  exit 1
fi

echo "[start-all] running frontend tests..."
if ! npm --prefix frontend run test; then
  echo "[start-all] frontend tests failed. Fix tests before coding."
  exit 1
fi

echo "[start-all] all tests passed. starting backend + frontend..."

./scripts/start-backend.sh &
BACKEND_PID=$!

./scripts/start-frontend.sh &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

wait -n "$BACKEND_PID" "$FRONTEND_PID"
