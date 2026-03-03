#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend"

if [[ ! -f .env.local ]]; then
  echo "[start-frontend.sh] Warning: frontend/.env.local not found"
fi

if ! npm exec -- vitest --version >/dev/null 2>&1; then
  echo "[start-frontend] vitest not found, installing frontend dependencies..."
  npm install
fi

echo "[start-frontend] running frontend tests..."
npm run test

echo "[start-frontend] starting frontend dev server..."
npm run dev
