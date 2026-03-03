#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

commit_file=""
if [[ -f ".github/commit_name.txt" ]]; then
  commit_file=".github/commit_name.txt"
elif [[ -f "commit_name.txt" ]]; then
  commit_file="commit_name.txt"
else
  echo "Erreur: commit_name.txt introuvable (.github/commit_name.txt ou commit_name.txt)."
  exit 1
fi

message="$(tr -d '\r' < "$commit_file" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
if [[ -z "$message" ]]; then
  echo "Erreur: le message de commit est vide dans $commit_file"
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"

# Stage all changes

git add .

if git diff --cached --quiet; then
  echo "Aucun changement à commit."
  exit 0
fi

git commit -m "$message"
git push origin "$branch"

echo "OK: commit + push sur '$branch' avec message: $message"
