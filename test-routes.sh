#!/bin/bash
# Script de test des routes principales après déploiement

echo "🧪 Test des routes Faketect"
echo "================================"
echo ""

API_URL="https://faketect-api.onrender.com"
WEB_URL="https://faketect.app"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_route() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    
    if [ "$status_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} ($status_code)"
        return 0
    else
        echo -e "${RED}✗${NC} (got $status_code, expected $expected_code)"
        return 1
    fi
}

echo "📡 Backend API Tests ($API_URL)"
echo "--------------------------------"
test_route "Health Check" "$API_URL/api/health" "200"
test_route "Admin Stats (no auth)" "$API_URL/api/admin/stats" "401"
test_route "Billing Profile (no auth)" "$API_URL/api/billing/profile" "401"
echo ""

echo "🌐 Frontend Tests ($WEB_URL)"
echo "--------------------------------"
test_route "Landing Page" "$WEB_URL/" "200"
test_route "App Page" "$WEB_URL/app" "200"
test_route "Pricing Page" "$WEB_URL/pricing" "200"
test_route "Admin Page" "$WEB_URL/admin" "200"
test_route "Auth Page" "$WEB_URL/auth" "200"
echo ""

echo "🔗 CORS Test"
echo "--------------------------------"
echo -n "Testing CORS for faketect.app... "
cors_header=$(curl -s -H "Origin: https://faketect.app" -H "Access-Control-Request-Method: POST" -X OPTIONS "$API_URL/api/health" -I 2>/dev/null | grep -i "access-control-allow-origin")
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓${NC} CORS enabled"
else
    echo -e "${RED}✗${NC} CORS not configured"
fi
echo ""

echo "✅ Tests terminés"
