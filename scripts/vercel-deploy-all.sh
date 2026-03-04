#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[vercel] deploy backend..."
vercel --cwd backend --prod

echo "[vercel] deploy frontend..."
vercel --cwd frontend --prod

echo "[vercel] done"
