#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm run test:env
npm run test
npm run test:e2e
