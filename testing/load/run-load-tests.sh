#!/bin/bash

set -e

REPORT_DIR="${0%/*}/../reports/load-test"
mkdir -p "$REPORT_DIR"

BASE_URL="${TEST_BASE_URL:-http://localhost:8000}"
API_TOKEN="${API_TOKEN:-test-token}"

echo "================================================="
echo "Tripo04OS Load Test Suite"
echo "================================================="
echo "Base URL: $BASE_URL"
echo "Report Directory: $REPORT_DIR"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
echo ""

TEST_TYPE="${1:-all}"

run_test() {
  local test_name=$1
  local test_file=$2
  local report_file="$REPORT_DIR/${test_name}-$(date +%Y%m%d%H%M%S).json"
  
  echo "Running: $test_name"
  echo "-------------------------------------------"
  
  k6 run "$test_file" \
    --env TEST_BASE_URL="$BASE_URL" \
    --env API_TOKEN="$API_TOKEN" \
    --out json="$report_file" \
    --summary-export="$REPORT_DIR/${test_name}-summary.json"
  
  if [ $? -eq 0 ]; then
    echo "✓ $test_name completed"
  else
    echo "✗ $test_name failed"
  fi
  echo ""
}

case $TEST_TYPE in
  ramp-up)
    echo "=== Ramp-Up Test ==="
    run_test "ramp-up" "$(dirname "$0")/scenarios/ramp-up-test.js"
    ;;
    
  steady-state)
    echo "=== Steady-State Test ==="
    run_test "steady-state" "$(dirname "$0")/scenarios/steady-state-test.js"
    ;;
    
  spike)
    echo "=== Spike Test ==="
    run_test "spike" "$(dirname "$0")/scenarios/spike-test.js"
    ;;
    
  stress)
    echo "=== Stress Test ==="
    run_test "stress" "$(dirname "$0")/scenarios/stress-test.js"
    ;;
    
  mixed-workload)
    echo "=== Mixed Workload Test ==="
    run_test "mixed-workload" "$(dirname "$0")/scenarios/mixed-workload-test.js"
    ;;
    
  all)
    echo "=== Running All Load Tests ==="
    run_test "ramp-up" "$(dirname "$0")/scenarios/ramp-up-test.js"
    run_test "steady-state" "$(dirname "$0")/scenarios/steady-state-test.js"
    run_test "spike" "$(dirname "$0")/scenarios/spike-test.js"
    run_test "stress" "$(dirname "$0")/scenarios/stress-test.js"
    run_test "mixed-workload" "$(dirname "$0")/scenarios/mixed-workload-test.js"
    ;;
    
  *)
    echo "Usage: $0 [test-type]"
    echo ""
    echo "Test Types:"
    echo "  ramp-up       - Ramp-up test (10 to 500 users)"
    echo "  steady-state   - Steady-state test (500 users for 30 min)"
    echo "  spike         - Spike test (100 to 1000 users)"
    echo "  stress        - Stress test (up to 2000 users)"
    echo "  mixed-workload - Mixed workload test (all scenarios)"
    echo "  all           - Run all tests"
    echo ""
    echo "Environment Variables:"
    echo "  TEST_BASE_URL - Base URL for API (default: http://localhost:8000)"
    echo "  API_TOKEN      - Authentication token (default: test-token)"
    exit 1
    ;;
esac

echo "================================================="
echo "Load Test Suite Complete"
echo "================================================="
echo "Reports saved to: $REPORT_DIR"
echo ""
