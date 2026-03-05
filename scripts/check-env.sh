#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

extract_keys() {
  local file="$1"
  awk -F= '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*$/ { next }
    {
      key=$1
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)
      if (key != "") print key
    }
  ' "$file"
}

check_env_file() {
  local label="$1"
  local example_file="$2"
  shift 2
  local candidates=("$@")

  local target_file=""
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      target_file="$candidate"
      break
    fi
  done

  if [[ -z "$target_file" ]]; then
    echo "[env] ${label}: missing env file (${candidates[*]})"
    return 1
  fi

  local missing=0
  while IFS= read -r key; do
    local pattern="^${key}=.+"
    if [[ "$label" == "frontend" && "$key" == "NEXT_PUBLIC_API_URL" ]]; then
      # Single-project mode allows empty API URL to use same-origin /api.
      pattern="^${key}="
    fi

    if ! grep -Eq "$pattern" "$target_file"; then
      if [[ "$pattern" == "^${key}=" ]]; then
        echo "[env] ${label}: ${key} is missing in ${target_file}"
      else
        echo "[env] ${label}: ${key} is missing or empty in ${target_file}"
      fi
      missing=1
    fi
  done < <(extract_keys "$example_file")

  if [[ "$missing" -eq 0 ]]; then
    echo "[env] ${label}: OK (${target_file})"
  fi

  return "$missing"
}

status=0
check_env_file "frontend" "frontend/.env.example" "frontend/.env.local" "frontend/.env" || status=1
check_env_file "backend" "backend/.env.example" "backend/.env.local" "backend/.env" || status=1

exit "$status"
