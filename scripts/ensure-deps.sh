#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -x backend/node_modules/.bin/vitest ]]; then
  echo "[deps] installing backend dependencies (including devDependencies)..."
  npm --prefix backend install --include=dev
fi

if [[ ! -x frontend/node_modules/.bin/vitest ]]; then
  echo "[deps] installing frontend dependencies (including devDependencies)..."
  npm --prefix frontend install --include=dev
fi

