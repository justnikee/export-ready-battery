#!/usr/bin/env bash
# Health check script for AnvayaLabs Battery API
# Usage: ./scripts/health-check.sh [BASE_URL]
# Exit codes: 0 = healthy, 1 = unhealthy

set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
HEALTH_ENDPOINT="${BASE_URL}/health"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-10}"

# Colors for terminal output (optional)
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

http_code=""
body=""

# Attempt health check with curl
if command -v curl >/dev/null 2>&1; then
    response=$(curl -s -o - --max-time "$TIMEOUT_SECONDS" -w "\n%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || true)
    if [ -n "$response" ]; then
        http_code=$(echo "$response" | tail -n 1)
        body=$(echo "$response" | sed '$d')
    fi
elif command -v wget >/dev/null 2>&1; then
    # Fallback to wget if curl is unavailable
    tmpfile=$(mktemp)
    http_code=$(wget --timeout="$TIMEOUT_SECONDS" -q -O "$tmpfile" --server-response "$HEALTH_ENDPOINT" 2>&1 | awk '/^  HTTP/{print $2}' | tail -n 1 || true)
    if [ -f "$tmpfile" ]; then
        body=$(cat "$tmpfile")
        rm -f "$tmpfile"
    fi
else
    echo "Error: neither curl nor wget is available" >&2
    exit 1
fi

# Validate response
if [ "$http_code" = "200" ]; then
    if echo "$body" | grep -q '"status":"healthy"'; then
        if [ -t 1 ]; then
            echo -e "${GREEN}HEALTHY${NC} ($http_code) — $body"
        else
            echo "HEALTHY ($http_code) — $body"
        fi
        exit 0
    else
        if [ -t 1 ]; then
            echo -e "${RED}UNHEALTHY${NC} ($http_code) — unexpected body: $body"
        else
            echo "UNHEALTHY ($http_code) — unexpected body: $body"
        fi
        exit 1
    fi
else
    if [ -t 1 ]; then
        echo -e "${RED}UNHEALTHY${NC} (HTTP $http_code) — no valid response from $HEALTH_ENDPOINT"
    else
        echo "UNHEALTHY (HTTP $http_code) — no valid response from $HEALTH_ENDPOINT"
    fi
    exit 1
fi
