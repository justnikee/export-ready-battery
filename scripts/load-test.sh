#!/usr/bin/env bash
# Lightweight Load Test Script
# Quick capacity validation before deploy
# Run with: ./scripts/load-test.sh -u https://api.anvayalabs.com/health -n 100 -c 10

set -euo pipefail

TARGET_URL="http://localhost:8080/health"
TOTAL_REQUESTS=100
CONCURRENCY=10
TIMEOUT=10

# ------------------------------------------------------------------
# Parse arguments
# ------------------------------------------------------------------
while getopts ":u:n:c:t:h" opt; do
  case $opt in
    u) TARGET_URL="$OPTARG" ;;
    n) TOTAL_REQUESTS="$OPTARG" ;;
    c) CONCURRENCY="$OPTARG" ;;
    t) TIMEOUT="$OPTARG" ;;
    h)
      echo "Usage: $0 [-u url] [-n total_requests] [-c concurrency] [-t timeout]"
      echo "  -u  Target URL           (default: http://localhost:8080/health)"
      echo "  -n  Total requests       (default: 100)"
      echo "  -c  Concurrent requests  (default: 10)"
      echo "  -t  Timeout per request  (default: 10s)"
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
NC='\033[0m'

# ------------------------------------------------------------------
# Validate dependencies
# ------------------------------------------------------------------
if ! command -v curl &> /dev/null; then
  echo "Error: curl is required." >&2
  exit 1
fi

# ------------------------------------------------------------------
# Banner
# ------------------------------------------------------------------
echo -e "${CYAN}=== AnvayaLabs Lightweight Load Test ===${NC}"
echo "Target:    $TARGET_URL"
echo "Requests:  $TOTAL_REQUESTS"
echo "Concurrency: $CONCURRENCY"
echo "Timeout:   ${TIMEOUT}s"
echo ""

# ------------------------------------------------------------------
# Prepare temp directory
# ------------------------------------------------------------------
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# ------------------------------------------------------------------
# Fire requests and collect timing data
# ------------------------------------------------------------------
fire_request() {
  local idx="$1"
  local outfile="$TMPDIR/req_$idx.txt"
  local http_code
  local total_time
  local start_time
  start_time=$(date +%s%N)

  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$TARGET_URL" 2>/dev/null || echo "000")
  total_time=$(awk "BEGIN {printf \"%.3f\", ($(date +%s%N) - $start_time) / 1000000000}")

  echo "$http_code $total_time" > "$outfile"
}

export -f fire_request
export TARGET_URL TIMEOUT TMPDIR

echo "Running $TOTAL_REQUESTS requests with $CONCURRENCY concurrency..."
echo ""

seq 1 "$TOTAL_REQUESTS" | xargs -P "$CONCURRENCY" -I{} bash -c 'fire_request "$@"' _ {}

# ------------------------------------------------------------------
# Aggregate results
# ------------------------------------------------------------------
success_count=0
fail_count=0
total_time=0
min_time=""
max_time=""

for f in "$TMPDIR"/req_*.txt; do
  read -r code elapsed < "$f"

  if [[ "$code" == "200" ]]; then
    ((success_count++)) || true
  else
    ((fail_count++)) || true
  fi

  # Update min/max/total
  if [[ -z "$min_time" ]] || awk "BEGIN {exit !($elapsed < $min_time)}"; then
    min_time="$elapsed"
  fi
  if [[ -z "$max_time" ]] || awk "BEGIN {exit !($elapsed > $max_time)}"; then
    max_time="$elapsed"
  fi
  total_time=$(awk "BEGIN {printf \"%.6f\", $total_time + $elapsed}")
done

avg_time=$(awk "BEGIN {printf \"%.3f\", $total_time / $TOTAL_REQUESTS}")
failure_rate=$(awk "BEGIN {printf \"%.1f\", ($fail_count / $TOTAL_REQUESTS) * 100}")
throughput=$(awk "BEGIN {printf \"%.1f\", $TOTAL_REQUESTS / $total_time}")

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
echo -e "${CYAN}=== Results ===${NC}"
printf "  Total requests:    %d\n" "$TOTAL_REQUESTS"
printf "  Successful (200):  %d\n" "$success_count"
printf "  Failed:            %d\n" "$fail_count"
printf "  Failure rate:      %s%%\n" "$failure_rate"
printf "  Min response:      %ss\n" "$min_time"
printf "  Max response:      %ss\n" "$max_time"
printf "  Avg response:      %ss\n" "$avg_time"
printf "  Throughput:        %s req/s\n" "$throughput"
echo ""

if [[ "$fail_count" -gt 0 ]]; then
  echo -e "${RED}LOAD TEST FAILED${NC} — $fail_count request(s) did not return HTTP 200."
  exit 1
else
  echo -e "${GREEN}LOAD TEST PASSED${NC} — all requests returned HTTP 200."
  exit 0
fi
