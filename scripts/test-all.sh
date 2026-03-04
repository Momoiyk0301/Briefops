#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/ensure-deps.sh

npm run test:env
npm --prefix backend run test
npm --prefix frontend run test
npm run test:e2e
