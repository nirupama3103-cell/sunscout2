#!/usr/bin/env bash
# Gate for the Local Table photo localization follow-up.
#
# Two things have to be true together, and neither is self-announcing:
#   1. CREDITS.md has no TBD left  - attribution actually recorded
#   2. index.html no longer hotlinks images.unsplash.com - images actually local
#
# A credits file nobody re-reads will keep its TBDs forever, so this is a gate
# rather than a note. Run locally with: ./scripts/check-photo-credits.sh
set -uo pipefail

cd "$(dirname "$0")/.."

CREDITS="public/assets/local-table/CREDITS.md"
PAGE="public/local-table/index.html"
fail=0

if [ ! -f "$CREDITS" ]; then
  echo "FAIL  $CREDITS is missing"
  exit 1
fi

# Match only the field pattern ("- **Photographer:** TBD"), not prose that
# happens to mention TBD - otherwise the gate stays red after the fields are
# filled and gets dismissed as broken.
TBD_FIELD='^[[:space:]]*-[[:space:]]*\*\*[^*]+:\*\*[[:space:]]*TBD[[:space:]]*$'

tbd=$(grep -cE "$TBD_FIELD" "$CREDITS" || true)
if [ "$tbd" -ne 0 ]; then
  echo "FAIL  $CREDITS still has $tbd TBD field(s) - photo attribution is unrecorded"
  echo "      first few:"
  grep -nE "$TBD_FIELD" "$CREDITS" | head -5 | sed 's/^/        /'
  fail=1
else
  echo "OK    $CREDITS has no TBD fields"
fi

hotlinks=$(grep -c 'images\.unsplash\.com' "$PAGE" || true)
if [ "$hotlinks" -ne 0 ]; then
  echo "FAIL  $PAGE still hotlinks images.unsplash.com ($hotlinks reference(s))"
  echo "      the deal photos must be served from assets/local-table/"
  fail=1
else
  echo "OK    $PAGE serves deal photos locally"
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "Blocked: see 'Not done' in PR #45. This is expected until the follow-up"
  echo "session localizes the 12 Unsplash photos and fills in their attribution."
  exit 1
fi

echo "All photo-credit checks passed."
