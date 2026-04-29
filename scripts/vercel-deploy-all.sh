#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[vercel] deploy app..."
vercel --cwd apps/app --prod

echo "[vercel] deploy landing..."
vercel --cwd apps/landing --prod

echo "[vercel] done"
