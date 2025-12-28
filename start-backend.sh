#!/bin/bash

echo "🚀 FakeTect - Test & Démarrage"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Vérifier Node.js
echo -e "${YELLOW}1. Vérification Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js $(node -v) installé${NC}"
else
    echo -e "${RED}✗ Node.js non installé${NC}"
    exit 1
fi

# 2. Backend - Installation
echo ""
echo -e "${YELLOW}2. Installation backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓ Dépendances déjà installées${NC}"
fi

# 3. Prisma
echo ""
echo -e "${YELLOW}3. Configuration Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Client Prisma généré${NC}"

# 4. Test connexion BDD (optionnel - skip si erreur)
echo ""
echo -e "${YELLOW}4. Test connexion Supabase...${NC}"
if npx prisma db push 2>/dev/null; then
    echo -e "${GREEN}✓ Connexion Supabase OK${NC}"
else
    echo -e "${YELLOW}⚠ Connexion Supabase échouée (mot de passe à vérifier)${NC}"
    echo -e "${YELLOW}  → Le backend fonctionnera en mode local/démo${NC}"
fi

# 5. Vérifier les clés API
echo ""
echo -e "${YELLOW}5. Vérification clés API (.env)...${NC}"
if grep -q "SIGHTENGINE_USER=725554468" .env; then
    echo -e "${GREEN}✓ Sightengine configuré${NC}"
else
    echo -e "${RED}✗ Sightengine manquant${NC}"
fi

if grep -q "ILLUMINARTY_API_KEY" .env && [ -n "$(grep ILLUMINARTY_API_KEY .env | cut -d'=' -f2)" ]; then
    echo -e "${GREEN}✓ Illuminarty configuré${NC}"
else
    echo -e "${YELLOW}⚠ Illuminarty manquant (fallback vers Sightengine)${NC}"
fi

if grep -q "OPENAI_API_KEY=sk-proj" .env; then
    echo -e "${GREEN}✓ OpenAI configuré${NC}"
else
    echo -e "${YELLOW}⚠ OpenAI manquant (pas d'analyse texte)${NC}"
fi

# 6. Démarrer le serveur
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Backend prêt !${NC}"
echo ""
echo -e "${YELLOW}Démarrage du serveur...${NC}"
echo -e "${YELLOW}URL: http://localhost:3001${NC}"
echo -e "${YELLOW}Pour arrêter: Ctrl+C${NC}"
echo ""

npm run dev
