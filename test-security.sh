#!/bin/bash

echo "🧪 Tests de sécurité FakeTect"
echo "=============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

# Fonction de test
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=$5
    
    echo -n "Testing: $name... "
    
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        return 1
    fi
}

# Vérifier que le serveur tourne
echo "Checking server status..."
if ! curl -s $API_URL/api/health > /dev/null; then
    echo -e "${RED}✗ Server not running!${NC}"
    echo "Please start the server with: cd backend && npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Tests
passed=0
failed=0

# Test 1: Health check
if test_endpoint "Health check" "GET" "/api/health" "" "200"; then
    ((passed++))
else
    ((failed++))
fi

# Test 2: Email invalide
if test_endpoint "Invalid email validation" "POST" "/api/auth/register" \
    '{"email":"notanemail","password":"Test1234","name":"Test"}' "400"; then
    ((passed++))
else
    ((failed++))
fi

# Test 3: Mot de passe faible
if test_endpoint "Weak password validation" "POST" "/api/auth/register" \
    '{"email":"test@test.com","password":"weak","name":"Test"}' "400"; then
    ((passed++))
else
    ((failed++))
fi

# Test 4: Téléphone invalide
if test_endpoint "Invalid phone validation" "POST" "/api/auth/register" \
    '{"email":"test@test.com","password":"Test1234","name":"Test","phone":"abc"}' "400"; then
    ((passed++))
else
    ((failed++))
fi

# Test 5: Login sans email
if test_endpoint "Login missing email" "POST" "/api/auth/login" \
    '{"password":"test"}' "400"; then
    ((passed++))
else
    ((failed++))
fi

# Test 6: Rate limiting (nécessite plusieurs appels)
echo ""
echo "Testing rate limiting (5 attempts)..."
rate_limit_hit=false
for i in {1..6}; do
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrongpass"}' 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "429" ]; then
        rate_limit_hit=true
        echo -e "${GREEN}✓ Rate limit triggered at attempt $i${NC}"
        break
    fi
    echo -n "."
done

if [ "$rate_limit_hit" = true ]; then
    ((passed++))
else
    echo -e "\n${YELLOW}⚠ Rate limit not triggered (might need more attempts)${NC}"
    ((failed++))
fi

# Résultats
echo ""
echo "=============================="
echo "Results:"
echo -e "  ${GREEN}Passed: $passed${NC}"
echo -e "  ${RED}Failed: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
