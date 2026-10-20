#!/usr/bin/env bash
# E2E smoke test for M4 (distribution): social accounts + post queue + approval gate.
# Re-runnable: cleans up any state it creates. Requires the dev server on :3007.
set -euo pipefail

BASE="http://localhost:3007"
JAR="/tmp/influencer-m4-cookies.txt"
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
curl -s -o /dev/null -w 'no-auth accounts [HTTP %{http_code}]\n' "$BASE/api/social-accounts"

echo "== 3. create account (manual mode) =="
ACC=$(curl -s -b "$JAR" -X POST "$BASE/api/social-accounts" \
  -H 'Content-Type: application/json' \
  -d '{"handle":"test_m4","accountType":"BUSINESS"}')
echo "$ACC" | head -1
ACC_ID=$(echo "$ACC" | head -1 | json "['data']['id']")

echo "== 4. list accounts must NOT leak accessToken =="
LEAK=$(curl -s -b "$JAR" "$BASE/api/social-accounts" | grep -c 'accessToken' || true)
echo "accessToken occurrences in response: $LEAK (expect 0)"

echo "== 5. create post =="
POST=$(curl -s -b "$JAR" -X POST "$BASE/api/posts" \
  -H 'Content-Type: application/json' \
  -d "{\"socialAccountId\":\"$ACC_ID\",\"caption\":\"smoke test\",\"scheduledAt\":\"\"}")
echo "$POST" | head -1
POST_ID=$(echo "$POST" | head -1 | json "['data']['id']")

echo "== 6. publish BEFORE approve -> 409 =="
curl -s -b "$JAR" -X POST "$BASE/api/posts/$POST_ID/publish" \
  -H 'Content-Type: application/json' -d '{"mode":"manual"}' \
  -o /dev/null -w 'publish-before-approve [HTTP %{http_code}] (expect 409)\n'

echo "== 7. approve =="
APPROVE=$(curl -s -b "$JAR" -X POST "$BASE/api/posts/$POST_ID/approve" \
  -H 'Content-Type: application/json')
echo "$APPROVE" | head -1 | json "['data']['approved']" | sed 's/^/approved: /'

echo "== 8. publish (manual) =="
PUBLISH=$(curl -s -b "$JAR" -X POST "$BASE/api/posts/$POST_ID/publish" \
  -H 'Content-Type: application/json' -d '{"mode":"manual"}')
echo "$PUBLISH" | head -1 | json "['data']['status']" | sed 's/^/status: /'

echo "== 9. cleanup =="
curl -s -b "$JAR" -X DELETE "$BASE/api/posts/$POST_ID" -o /dev/null -w 'del post [HTTP %{http_code}]\n'
curl -s -b "$JAR" -X DELETE "$BASE/api/social-accounts/$ACC_ID" -o /dev/null -w 'del account [HTTP %{http_code}]\n'

echo "== DONE =="
