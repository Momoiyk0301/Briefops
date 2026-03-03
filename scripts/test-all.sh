#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/ensure-deps.sh

npm --prefix backend run test
npm --prefix frontend run test
npm run test:e2e
