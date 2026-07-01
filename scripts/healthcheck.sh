#!/usr/bin/env bash
# SunScout Kids — health check script
# Usage:
#   ./scripts/healthcheck.sh                        # checks https://www.sunscoutkids.com
#   BASE_URL=http://localhost:8000 ./scripts/healthcheck.sh  # checks local dev server
#
# Exits 0 if all checks pass, 1 if any fail.

BASE_URL="${BASE_URL:-https://www.sunscoutkids.com}"
TIMEOUT=15

PASS=0
FAIL=0
SKIP=0
FAILURES=()

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BOLD="\033[1m"
RESET="\033[0m"

log_pass() { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS + 1)); }
log_fail() { echo -e "  ${RED}✗${RESET} $1"; FAIL=$((FAIL + 1)); FAILURES+=("$1"); }
log_skip() { echo -e "  ${YELLOW}–${RESET} $1 (skipped — local server)"; SKIP=$((SKIP + 1)); }

# Fetch URL; outputs "<status>\n<body>"
http_fetch() {
  curl -s --max-time "$TIMEOUT" --compressed \
    -w "\n__STATUS__:%{http_code}" \
    -H "User-Agent: SunScout-Healthcheck/1.0" \
    "$1" 2>/dev/null
}

# Check HTTP status equals $want (body discarded — safe for binary assets)
check_status() {
  local label="$1" url="$2" want="${3:-200}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time "$TIMEOUT" \
    -H "User-Agent: SunScout-Healthcheck/1.0" \
    "$url" 2>/dev/null)
  if [[ "$status" == "$want" ]]; then
    log_pass "$label → HTTP $status"
  else
    log_fail "$label → expected HTTP $want, got $status  ($url)"
  fi
}

# Check URL returns 200 and body contains a string
check_body_contains() {
  local label="$1" url="$2" needle="$3"
  local out status body
  out=$(http_fetch "$url")
  status=$(echo "$out" | grep -o '__STATUS__:[0-9]*' | cut -d: -f2)
  body=$(echo "$out" | sed '/^__STATUS__:/d')
  if [[ "$status" != "200" ]]; then
    log_fail "$label → HTTP $status (expected 200)  ($url)"
    return
  fi
  if echo "$body" | grep -q "$needle"; then
    log_pass "$label → HTTP $status, contains \"$needle\""
  else
    log_fail "$label → HTTP $status but missing \"$needle\"  ($url)"
  fi
}

# Check API JSON: 200, valid JSON, field 'count' >= min_count
check_api() {
  local label="$1" url="$2" min_count="${3:-1}"
  local out status body count
  out=$(http_fetch "$url")
  status=$(echo "$out" | grep -o '__STATUS__:[0-9]*' | cut -d: -f2)
  body=$(echo "$out" | sed '/^__STATUS__:/d')
  if [[ "$status" != "200" ]]; then
    log_fail "$label → HTTP $status  ($url)"
    return
  fi
  count=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['count'])" 2>/dev/null) || {
    log_fail "$label → invalid JSON or missing 'count'  ($url)"
    return
  }
  if [[ "$count" -ge "$min_count" ]]; then
    log_pass "$label → $count activities"
  else
    log_fail "$label → expected >=$min_count activities, got $count  ($url)"
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}SunScout Kids — Health Check${RESET}"
echo    "  Target: $BASE_URL"
echo    "  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo

IS_LOCAL=false
if [[ "$BASE_URL" == *"localhost"* || "$BASE_URL" == *"127.0.0.1"* ]]; then
  IS_LOCAL=true
fi

# ── 1. Static pages ───────────────────────────────────────────────────────────
echo -e "${BOLD}Static pages${RESET}"
check_body_contains "Homepage"    "$BASE_URL/"          "SunScout"
check_body_contains "DIY page"    "$BASE_URL/diy.html"  "SunScout"
check_status        "Manifest"    "$BASE_URL/manifest.json"
check_status        "Favicon ICO" "$BASE_URL/favicon.ico"
check_status        "Favicon 192" "$BASE_URL/favicon-192.png"
check_status        "Favicon 512" "$BASE_URL/favicon-512.png"
echo

# ── 2. API — one tab per city ─────────────────────────────────────────────────
echo -e "${BOLD}API — city coverage (tab=free)${RESET}"
CITIES=("Sunnyvale" "San Jose" "Cupertino" "Mountain View" "Palo Alto" "Saratoga" "Fremont")
if $IS_LOCAL; then
  for city in "${CITIES[@]}"; do log_skip "free / $city"; done
else
  for city in "${CITIES[@]}"; do
    enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$city")
    check_api "free / $city" "$BASE_URL/api/activities?tab=free&city=$enc&age=all"
  done
fi
echo

# ── 3. API — all five tabs ────────────────────────────────────────────────────
echo -e "${BOLD}API — tab coverage (city=Sunnyvale)${RESET}"
TABS=("free" "paid" "indoor" "outdoor" "weekend")
if $IS_LOCAL; then
  for tab in "${TABS[@]}"; do log_skip "$tab / Sunnyvale"; done
else
  for tab in "${TABS[@]}"; do
    check_api "$tab / Sunnyvale" "$BASE_URL/api/activities?tab=$tab&city=Sunnyvale&age=all"
  done
fi
echo

# ── 4. API — age filters ──────────────────────────────────────────────────────
echo -e "${BOLD}API — age filters (free / Sunnyvale)${RESET}"
AGES=("all" "0" "1" "2" "3")
if $IS_LOCAL; then
  for age in "${AGES[@]}"; do log_skip "age=$age"; done
else
  for age in "${AGES[@]}"; do
    check_api "age=$age" "$BASE_URL/api/activities?tab=free&city=Sunnyvale&age=$age" 0
  done
fi
echo

# ── 5. API — bad params → 400 ─────────────────────────────────────────────────
echo -e "${BOLD}API — invalid params → 400${RESET}"
if $IS_LOCAL; then
  log_skip "bad tab"
  log_skip "bad city"
  log_skip "bad age"
else
  check_status "bad tab"  "$BASE_URL/api/activities?tab=garbage&city=Sunnyvale&age=all"  "400"
  check_status "bad city" "$BASE_URL/api/activities?tab=free&city=InvalidCity&age=all"   "400"
  check_status "bad age"  "$BASE_URL/api/activities?tab=free&city=Sunnyvale&age=99"      "400"
fi
echo

# ── 6. PWA manifest content ───────────────────────────────────────────────────
echo -e "${BOLD}PWA manifest content${RESET}"
manifest_out=$(http_fetch "$BASE_URL/manifest.json")
manifest_status=$(echo "$manifest_out" | grep -o '__STATUS__:[0-9]*' | cut -d: -f2)
manifest_body=$(echo "$manifest_out" | sed '/^__STATUS__:/d')
if [[ "$manifest_status" == "200" ]]; then
  if echo "$manifest_body" | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert d.get('name'), 'missing name'
assert d.get('start_url'), 'missing start_url'
assert d.get('icons'), 'missing icons'
assert d.get('theme_color') == '#FF9900', 'wrong theme_color'
" 2>/dev/null; then
    log_pass "manifest has name, start_url, icons, theme_color=#FF9900"
  else
    log_fail "manifest missing required fields or wrong theme_color"
  fi
else
  log_fail "manifest.json → HTTP $manifest_status"
fi
echo

# ── Summary ────────────────────────────────────────────────────────────────────
echo -e "${BOLD}Results${RESET}"
TOTAL=$((PASS + FAIL + SKIP))
echo "  Total: $TOTAL  |  ${GREEN}Pass: $PASS${RESET}  |  ${RED}Fail: $FAIL${RESET}  |  ${YELLOW}Skip: $SKIP${RESET}"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo
  echo -e "${RED}${BOLD}Failed checks:${RESET}"
  for f in "${FAILURES[@]}"; do
    echo -e "  ${RED}•${RESET} $f"
  done
  echo
  exit 1
fi

echo
echo -e "${GREEN}${BOLD}All checks passed.${RESET}"
echo
exit 0
