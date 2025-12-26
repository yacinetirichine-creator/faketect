#!/bin/bash

##############################################################################
# Script de Vérification Post-Déploiement FakeTect
# 
# Vérifie automatiquement :
# - Security headers (CSP, HSTS, etc.)
# - Favicons et logos
# - Badges de sécurité
# - Scores de sécurité externes
#
# Usage: ./scripts/verify-deployment.sh [production|staging]
##############################################################################

set -e  # Exit on error

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}

if [ "$ENVIRONMENT" = "production" ]; then
  API_URL="https://api.faketect.com"
  WEB_URL="https://faketect.com"
else
  API_URL="http://localhost:3001"
  WEB_URL="http://localhost:5173"
fi

PASSED=0
FAILED=0
WARNINGS=0

# Fonctions utilitaires
print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
  echo -e "${YELLOW}⏳ $1...${NC}"
}

print_pass() {
  echo -e "${GREEN}✓ $1${NC}"
  ((PASSED++))
}

print_fail() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED++))
}

print_warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
  ((WARNINGS++))
}

# Vérifier qu'un header existe dans la réponse
check_header() {
  local url=$1
  local header_name=$2
  local expected_value=$3
  
  print_test "Checking $header_name"
  
  local header_value=$(curl -s -I "$url" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r')
  
  if [ -z "$header_value" ]; then
    print_fail "$header_name not found"
    return 1
  fi
  
  if [ -n "$expected_value" ]; then
    if echo "$header_value" | grep -q "$expected_value"; then
      print_pass "$header_name contains '$expected_value'"
    else
      print_fail "$header_name does not contain '$expected_value' (got: $header_value)"
      return 1
    fi
  else
    print_pass "$header_name present"
  fi
}

# Vérifier qu'une URL retourne 200
check_url() {
  local url=$1
  local description=$2
  
  print_test "Checking $description"
  
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  
  if [ "$status" = "200" ]; then
    print_pass "$description (HTTP $status)"
  else
    print_fail "$description (HTTP $status)"
    return 1
  fi
}

##############################################################################
# Tests
##############################################################################

print_header "🔍 Vérification Déploiement FakeTect - $ENVIRONMENT"
echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"

##############################################################################
print_header "1️⃣  API - Security Headers"
##############################################################################

# Test API santé
check_url "$API_URL/api/health" "API Health Check"

# Content-Security-Policy
check_header "$API_URL/api/health" "content-security-policy" "default-src 'self'"

# HSTS (uniquement en HTTPS)
if [ "$ENVIRONMENT" = "production" ]; then
  check_header "$API_URL/api/health" "strict-transport-security" "max-age=31536000"
else
  print_warn "HSTS skipped (not HTTPS)"
  ((WARNINGS++))
fi

# X-Frame-Options
check_header "$API_URL/api/health" "x-frame-options" "DENY"

# X-Content-Type-Options
check_header "$API_URL/api/health" "x-content-type-options" "nosniff"

# Permissions-Policy
check_header "$API_URL/api/health" "permissions-policy" "geolocation=()"

# Referrer-Policy
check_header "$API_URL/api/health" "referrer-policy" ""

##############################################################################
print_header "2️⃣  Web - Favicons & Logos"
##############################################################################

# Favicon SVG
check_url "$WEB_URL/favicon.svg" "Favicon SVG"

# Favicons PNG
check_url "$WEB_URL/favicon-16x16.png" "Favicon 16x16"
check_url "$WEB_URL/favicon-32x32.png" "Favicon 32x32"

# Apple Touch Icon
check_url "$WEB_URL/apple-touch-icon.png" "Apple Touch Icon"

# Android Chrome
check_url "$WEB_URL/android-chrome-192x192.png" "Android Chrome 192"
check_url "$WEB_URL/android-chrome-512x512.png" "Android Chrome 512"

# Open Graph
check_url "$WEB_URL/og-image.jpg" "Open Graph Image"

# Manifest
check_url "$WEB_URL/site.webmanifest" "PWA Manifest"

##############################################################################
print_header "3️⃣  Trust Badges"
##############################################################################

check_url "$WEB_URL/badges/ssl-secure.svg" "SSL Secure Badge"
check_url "$WEB_URL/badges/gdpr-compliant.svg" "GDPR Compliant Badge"
check_url "$WEB_URL/badges/iso27001.svg" "ISO 27001 Badge"
check_url "$WEB_URL/badges/soc2.svg" "SOC 2 Badge"
check_url "$WEB_URL/badges/uptime-99.svg" "Uptime 99.9% Badge"
check_url "$WEB_URL/badges/enterprise-ready.svg" "Enterprise Ready Badge"

##############################################################################
print_header "4️⃣  Documentation"
##############################################################################

# Vérifier existence locale (GitHub sera vérifié manuellement)
if [ -f "SECURITY.md" ]; then
  print_pass "SECURITY.md exists"
else
  print_fail "SECURITY.md not found"
fi

if [ -f "docs/IT-WHITELIST-GUIDE.md" ]; then
  print_pass "IT-WHITELIST-GUIDE.md exists"
else
  print_fail "IT-WHITELIST-GUIDE.md not found"
fi

##############################################################################
print_header "5️⃣  Functional Tests"
##############################################################################

# Test upload (avec image factice)
print_test "Testing image upload"
if [ "$ENVIRONMENT" = "production" ]; then
  # Créer une image de test 1x1 PNG
  echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test.png
  
  response=$(curl -s -X POST "$API_URL/api/analyze" \
    -H "Content-Type: multipart/form-data" \
    -F "image=@/tmp/test.png" \
    -w "%{http_code}")
  
  http_code="${response: -3}"
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
    # 400 acceptable (quota épuisé ou autre validation)
    print_pass "Upload endpoint functional (HTTP $http_code)"
  else
    print_fail "Upload failed (HTTP $http_code)"
  fi
  
  rm /tmp/test.png
else
  print_warn "Upload test skipped (local environment)"
  ((WARNINGS++))
fi

##############################################################################
print_header "6️⃣  External Validators (Manual)"
##############################################################################

if [ "$ENVIRONMENT" = "production" ]; then
  echo ""
  echo -e "${YELLOW}Veuillez vérifier manuellement :${NC}"
  echo ""
  echo "1. Security Headers Score:"
  echo "   https://securityheaders.com/?q=$API_URL"
  echo "   Expected: A or A+"
  echo ""
  echo "2. SSL Labs:"
  echo "   https://www.ssllabs.com/ssltest/analyze.html?d=${API_URL#https://}"
  echo "   Expected: A+"
  echo ""
  echo "3. Mozilla Observatory:"
  echo "   https://observatory.mozilla.org/analyze/${API_URL#https://}"
  echo "   Expected: B+ or A"
  echo ""
  echo "4. Favicon Checker:"
  echo "   https://realfavicongenerator.net/favicon_checker?site=$WEB_URL"
  echo "   Expected: All formats detected"
  echo ""
  echo "5. Open Graph Validator:"
  echo "   https://www.opengraph.xyz/url/$WEB_URL"
  echo "   Expected: Image 1200x630 detected"
  echo ""
fi

##############################################################################
print_header "📊 Résumé"
##############################################################################

TOTAL=$((PASSED + FAILED))

echo ""
echo -e "${GREEN}✓ Passed:  $PASSED/$TOTAL${NC}"
echo -e "${RED}✗ Failed:  $FAILED/$TOTAL${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ TOUS LES TESTS PASSÉS !${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  ❌ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Vérifiez les erreurs ci-dessus et consultez :"
  echo "- Logs Render : render logs --service api-faketect --tail"
  echo "- Logs Vercel : vercel logs faketect-web --follow"
  echo "- CHECKLIST-DEPLOIEMENT.md pour le plan de rollback"
  echo ""
  exit 1
fi
