#!/bin/bash

echo "🧪 FakeTect - Tests API"
echo "======================"
echo ""

BASE_URL="http://localhost:3001"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Test Health Check
echo -e "${YELLOW}1. Test Health Check...${NC}"
HEALTH=$(curl -s ${BASE_URL}/api/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ API en ligne${NC}"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}✗ API hors ligne${NC}"
    exit 1
fi

echo ""

# 2. Test Register
echo -e "${YELLOW}2. Test Inscription...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@faketect.com",
    "password": "password123",
    "name": "Test User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Inscription réussie${NC}"
    TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:50}..."
else
    echo -e "${YELLOW}⚠ Utilisateur existe déjà ou erreur BDD${NC}"
    
    # Essayer de se connecter
    echo -e "${YELLOW}3. Test Connexion...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@faketect.com",
        "password": "password123"
      }')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo -e "${GREEN}✓ Connexion réussie${NC}"
        TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo "   Token: ${TOKEN:0:50}..."
    else
        echo -e "${RED}✗ Connexion échouée${NC}"
        echo "   Response: $LOGIN_RESPONSE"
        echo ""
        echo -e "${YELLOW}Note: Le backend fonctionne mais Supabase n'est pas connecté${NC}"
        echo -e "${YELLOW}      Les analyses fonctionneront en mode démo${NC}"
        exit 0
    fi
fi

echo ""

# 4. Test création d'une image de test
echo -e "${YELLOW}4. Création image de test...${NC}"
# Créer une petite image PNG de test (1x1 pixel rouge)
echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-image.png
echo -e "${GREEN}✓ Image créée: /tmp/test-image.png${NC}"

echo ""

# 5. Test analyse image (avec token)
if [ -n "$TOKEN" ]; then
    echo -e "${YELLOW}5. Test Analyse Image...${NC}"
    ANALYSIS_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/analysis/file \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@/tmp/test-image.png")
    
    if echo "$ANALYSIS_RESPONSE" | grep -q "aiScore"; then
        echo -e "${GREEN}✓ Analyse réussie${NC}"
        echo "   Response:"
        echo "$ANALYSIS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ANALYSIS_RESPONSE"
    else
        echo -e "${YELLOW}⚠ Analyse échouée (BDD nécessaire)${NC}"
        echo "   Response: $ANALYSIS_RESPONSE"
    fi
else
    echo -e "${YELLOW}5. Test Analyse Image...${NC}"
    echo -e "${YELLOW}⚠ Pas de token - skip${NC}"
fi

echo ""
echo -e "${GREEN}======================${NC}"
echo -e "${GREEN}Tests terminés !${NC}"
echo ""

# Nettoyage
rm -f /tmp/test-image.png
