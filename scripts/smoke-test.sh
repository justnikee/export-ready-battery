#!/usr/bin/env bash
# Cross-platform Smoke Test Script (Bash)
# Validates critical API endpoints and basic health after deployment
# Run with: ./scripts/smoke-test.sh -b https://api.anvayalabs.com -f https://app.anvayalabs.com

set -euo pipefail

BACKEND_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:3000"
TIMEOUT=30

# ------------------------------------------------------------------
# Parse arguments
# ------------------------------------------------------------------
while getopts ":b:f:t:h" opt; do
  case $opt in
    b) BACKEND_URL="$OPTARG" ;;
    f) FRONTEND_URL="$OPTARG" ;;
    t) TIMEOUT="$OPTARG" ;;
    h)
      echo "Usage: $0 [-b backend_url] [-f frontend_url] [-t timeout]"
      echo "  -b  Backend base URL  (default: http://localhost:8080)"
      echo "  -f  Frontend base URL (default: http://localhost:3000)"
      echo "  -t  Timeout in seconds (default: 30)"
      exit 0
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

# ------------------------------------------------------------------
# Colors
# ------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
http_code() {
  local method="${1:-GET}"
  local url="$2"
  local body="${3:-}"
  local hdrs="${4:-}"

  local curl_cmd=(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT")
  if [[ "$method" != "GET" ]]; then
    curl_cmd+=(-X "$method")
  fi
  if [[ -n "$body" ]]; then
    curl_cmd+=(-H "Content-Type: application/json" -d "$body")
  fi
  if [[ -n "$hdrs" ]]; then
    # hdrs format: "Key: Value|Key2: Value2"
    IFS='|' read -ra HARR <<< "$hdrs"
    for h in "${HARR[@]}"; do
      curl_cmd+=(-H "$h")
    done
  fi
  curl_cmd+=("$url")
  "${curl_cmd[@]}"
}

time_ms() {
  local method="${1:-GET}"
  local url="$2"
  local body="${3:-}"
  local hdrs="${4:-}"

  local curl_cmd=(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT")
  if [[ "$method" != "GET" ]]; then
    curl_cmd+=(-X "$method")
  fi
  if [[ -n "$body" ]]; then
    curl_cmd+=(-H "Content-Type: application/json" -d "$body")
  fi
  if [[ -n "$hdrs" ]]; then
    IFS='|' read -ra HARR <<< "$hdrs"
    for h in "${HARR[@]}"; do
      curl_cmd+=(-H "$h")
    done
  fi
  curl_cmd+=("$url")
  "${curl_cmd[@]}"
}

body() {
  local method="${1:-GET}"
  local url="$2"
  local body="${3:-}"
  local hdrs="${4:-}"

  local curl_cmd=(curl -s --max-time "$TIMEOUT")
  if [[ "$method" != "GET" ]]; then
    curl_cmd+=(-X "$method")
  fi
  if [[ -n "$body" ]]; then
    curl_cmd+=(-H "Content-Type: application/json" -d "$body")
  fi
  if [[ -n "$hdrs" ]]; then
    IFS='|' read -ra HARR <<< "$hdrs"
    for h in "${HARR[@]}"; do
      curl_cmd+=(-H "$h")
    done
  fi
  curl_cmd+=("$url")
  "${curl_cmd[@]}"
}

test_endpoint() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local expected="${4:-200}"
  local req_body="${5:-}"
  local req_hdrs="${6:-}"

  local status
  local elapsed
  status=$(http_code "$method" "$url" "$req_body" "$req_hdrs")
  elapsed=$(time_ms "$method" "$url" "$req_body" "$req_hdrs")
  elapsed_ms=$(awk "BEGIN {printf \"%.0f\", $elapsed * 1000}")

  if [[ "$status" == "$expected" ]]; then
    printf "  ${GREEN}PASS${NC} %-55s (%s) %4dms\n" "$name" "$status" "$elapsed_ms"
    ((PASSED++)) || true
  else
    printf "  ${RED}FAIL${NC} %-55s (expected %s, got %s) %4dms\n" "$name" "$expected" "$status" "$elapsed_ms"
    ((FAILED++)) || true
  fi
}

test_json_field() {
  local name="$1"
  local url="$2"
  local field="$3"
  local expected_val="$4"

  local resp
  local status
  local elapsed
  resp=$(body "GET" "$url")
  status=$(http_code "GET" "$url")
  elapsed=$(time_ms "GET" "$url")
  elapsed_ms=$(awk "BEGIN {printf \"%.0f\", $elapsed * 1000}")

  local val
  val=$(echo "$resp" | grep -oP "\"$field\":\"?[^\"{},]+\"?" | sed "s/\"$field\"://" | tr -d '"' || true)

  if [[ "$status" == "200" && "$val" == "$expected_val" ]]; then
    printf "  ${GREEN}PASS${NC} %-55s (%s) %4dms\n" "$name" "$status" "$elapsed_ms"
    ((PASSED++)) || true
  else
    printf "  ${RED}FAIL${NC} %-55s (expected field '%s'='%s', got '%s') %4dms\n" "$name" "$field" "$expected_val" "$val" "$elapsed_ms"
    ((FAILED++)) || true
  fi
}

# ------------------------------------------------------------------
# Banner
# ------------------------------------------------------------------
echo -e "\n${CYAN}=== AnvayaLabs Cross-Platform Smoke Tests ===${NC}"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# ------------------------------------------------------------------
# 1. Health checks
# ------------------------------------------------------------------
echo -e "${YELLOW}--- Health Checks ---${NC}"
test_endpoint "API Root" "$BACKEND_URL/api/v1" "GET" 404
test_json_field "API Health JSON" "$BACKEND_URL/health" "status" "healthy"
test_endpoint "Frontend Root" "$FRONTEND_URL"

# ------------------------------------------------------------------
# 2. Public endpoints
# ------------------------------------------------------------------
echo -e "\n${YELLOW}--- Public Endpoints ---${NC}"
test_endpoint "Battery Login Page" "$FRONTEND_URL/battery/login"
test_endpoint "Textile Login Page" "$FRONTEND_URL/textile/login"
test_endpoint "Public Passport (sample)" "$BACKEND_URL/api/v1/passports/00000000-0000-0000-0000-000000000000" "GET" 404

# ------------------------------------------------------------------
# 3. Auth endpoints
# ------------------------------------------------------------------
echo -e "\n${YELLOW}--- Auth Endpoints ---${NC}"
test_endpoint "Register endpoint (OPTIONS)" "$BACKEND_URL/api/v1/auth/register" "OPTIONS" 405
test_endpoint "Register invalid body" "$BACKEND_URL/api/v1/auth/register" "POST" 400 '{"email":"not-an-email","password":"123"}'
test_endpoint "Login wrong password" "$BACKEND_URL/api/v1/auth/login" "POST" 401 '{"email":"test@example.com","password":"wrongpassword"}'

# ------------------------------------------------------------------
# 4. Protected endpoints (expect 401 without auth)
# ------------------------------------------------------------------
echo -e "\n${YELLOW}--- Protected Endpoints (expect 401) ---${NC}"
test_endpoint "Dashboard stats (no auth)" "$BACKEND_URL/api/v1/dashboard/stats?tenant_id=00000000-0000-0000-0000-000000000000" "GET" 401
test_endpoint "List batches (no auth)" "$BACKEND_URL/api/v1/batches?tenant_id=00000000-0000-0000-0000-000000000000" "GET" 401
test_endpoint "Create batch (no auth)" "$BACKEND_URL/api/v1/batches" "POST" 401

# ------------------------------------------------------------------
# 5. Static assets
# ------------------------------------------------------------------
echo -e "\n${YELLOW}--- Static Assets ---${NC}"
test_endpoint "Favicon" "$FRONTEND_URL/favicon.ico"

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
echo -e "\n${CYAN}=== Results ===${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [[ "$FAILED" -gt 0 ]]; then
  echo -e "\n${RED}SMOKE TEST FAILED${NC}"
  exit 1
else
  echo -e "\n${GREEN}SMOKE TEST PASSED${NC}"
  exit 0
fi
