#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend"

if [[ ! -f .env.local ]]; then
  echo "[start-frontend.sh] Warning: frontend/.env.local not found"
fi

echo "[start-frontend] starting frontend dev server..."
npm run dev
