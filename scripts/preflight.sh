#!/usr/bin/env bash
# Deterministic pre-merge gates for the whole monorepo.
# Run from anywhere: bash scripts/preflight.sh [--fast]
#   --fast  skip the tsc typecheck gates (the slowest step)
# Exit 0 = every gate green; otherwise prints the failed gates and exits 1.
# Runs under Git Bash on Windows and plain bash in CI.
set -u
cd "$(dirname "$0")/.."

FAST=0
[ "${1:-}" = "--fast" ] && FAST=1

FAILED=()

gate() {
  local name="$1" dir="$2"
  shift 2
  echo ""
  echo "=== ${name}"
  if (cd "$dir" && "$@"); then
    echo "=== PASS: ${name}"
  else
    echo "=== FAIL: ${name}"
    FAILED+=("$name")
  fi
}

gate "battery-web vitest"        apps/battery-web       pnpm run test

if [ "$FAST" -eq 0 ]; then
  # npx tsc resolves a decoy package in this pnpm workspace — must be pnpm exec
  gate "battery-web typecheck"   apps/battery-web       pnpm exec tsc --noEmit
fi

for svc in battery-api; do
  gate "${svc} go vet"           "services/${svc}"      go vet ./...
  gate "${svc} go test"          "services/${svc}"      go test ./...
done

echo ""
echo "========================================"
if [ "${#FAILED[@]}" -eq 0 ]; then
  echo "PREFLIGHT PASS — all gates green"
  exit 0
else
  echo "PREFLIGHT FAIL — ${#FAILED[@]} gate(s) failed:"
  printf '  - %s\n' "${FAILED[@]}"
  exit 1
fi
