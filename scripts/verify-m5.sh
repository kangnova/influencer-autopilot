#!/usr/bin/env bash
# E2E smoke test for M5 (monetization): metrics + funnel + niche sales link.
# Re-runnable: cleans up any state it creates. Requires the dev server on :3007.
set -euo pipefail

BASE="http://localhost:3007"
JAR="/tmp/influencer-m5-cookies.txt"
rm -f "$JAR"

json() { python3 -c "import sys,json;print(json.load(sys.stdin)$1)"; }

echo "== 1. login =="
CSRF=$(curl -s -c "$JAR" "$BASE/api/auth/csrf" | json "['csrfToken']")
curl -s -b "$JAR" -c "$JAR" -X POST "$BASE/api/auth/callback/credentials" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "email=admin@autopilot.local" \
  --data-urlencode "password=changeme123" \
  -o /dev/null -w 'login [HTTP %{http_code}]\n'

echo "== 2. negative: no auth -> 401 =="
curl -s -o /dev/null -w 'no-auth metrics [HTTP %{http_code}]\n' "$BASE/api/metrics"

echo "== 3. account + post + approve + publish =="
ACC=$(curl -s -b "$JAR" -X POST "$BASE/api/social-accounts" \
  -H 'Content-Type: application/json' -d '{"handle":"test_m5","accountType":"BUSINESS"}')
ACC_ID=$(echo "$ACC" | head -1 | json "['data']['id']")
POST=$(curl -s -b "$JAR" -X POST "$BASE/api/posts" \
  -H 'Content-Type: application/json' \
  -d "{\"socialAccountId\":\"$ACC_ID\",\"caption\":\"m5 smoke\"}")
POST_ID=$(echo "$POST" | head -1 | json "['data']['id']")
curl -s -b "$JAR" -X POST "$BASE/api/posts/$POST_ID/approve" -o /dev/null
curl -s -b "$JAR" -X POST "$BASE/api/posts/$POST_ID/publish" \
  -H 'Content-Type: application/json' -d '{"mode":"manual"}' \
  -o /dev/null -w 'publish [HTTP %{http_code}]\n'

echo "== 4. insights on manual post -> 422 (no externalPostId) =="
curl -s -b "$JAR" -X POST "$BASE/api/posts/$POST_ID/insights" \
  -o /dev/null -w 'insights [HTTP %{http_code}] (expect 422)\n'

echo "== 5. add metric =="
METRIC=$(curl -s -b "$JAR" -X POST "$BASE/api/metrics" \
  -H 'Content-Type: application/json' \
  -d "{\"postId\":\"$POST_ID\",\"impressions\":1000,\"clicks\":10,\"sales\":2}")
echo "$METRIC" | head -1
METRIC_ID=$(echo "$METRIC" | head -1 | json "['data']['id']")

echo "== 6. metrics list contains the row =="
curl -s -b "$JAR" "$BASE/api/metrics" | grep -c "$METRIC_ID" | sed 's/^/occurrences (expect >=1): /'

echo "== 7. niche sales link PATCH =="
NICHE=$(curl -s -b "$JAR" -X POST "$BASE/api/niches" \
  -H 'Content-Type: application/json' -d '{"name":"smoke_niche_m5"}')
NICHE_ID=$(echo "$NICHE" | head -1 | json "['data']['id']")
curl -s -b "$JAR" -X PATCH "$BASE/api/niches/$NICHE_ID" \
  -H 'Content-Type: application/json' \
  -d '{"salesLinkUrl":"https://lynk.id/smoke"}' \
  -o /dev/null -w 'patch sales link [HTTP %{http_code}]\n'

echo "== 8. dashboard page renders =="
curl -s -b "$JAR" -o /dev/null -w '/metrics page [HTTP %{http_code}]\n' "$BASE/metrics"

echo "== 9. cleanup =="
curl -s -b "$JAR" -X DELETE "$BASE/api/metrics/$METRIC_ID" -o /dev/null -w 'del metric [HTTP %{http_code}]\n'
curl -s -b "$JAR" -X DELETE "$BASE/api/posts/$POST_ID" -o /dev/null -w 'del post [HTTP %{http_code}]\n'
curl -s -b "$JAR" -X DELETE "$BASE/api/social-accounts/$ACC_ID" -o /dev/null -w 'del account [HTTP %{http_code}]\n'
curl -s -b "$JAR" -X DELETE "$BASE/api/niches/$NICHE_ID" -o /dev/null -w 'del niche [HTTP %{http_code}]\n'

echo "== DONE =="
