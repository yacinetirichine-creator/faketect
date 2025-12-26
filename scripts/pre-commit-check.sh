#!/bin/bash

##############################################################################
# Script de Pré-Commit pour Validation Sécurité
# 
# Vérifie avant commit :
# - Fichiers générés présents
# - Syntaxe JavaScript/JSON valide
# - Headers de sécurité dans server.js
# - Documentation complète
#
# Usage: ./scripts/pre-commit-check.sh
##############################################################################

# Ne PAS exit on error (on veut compter tous les échecs)
# set -e supprimé

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

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

check_file_exists() {
  local file=$1
  local description=$2
  
  print_test "Checking $description"
  
  if [ -f "$file" ]; then
    print_pass "$description exists"
    return 0
  else
    print_fail "$description not found: $file"
    return 0  # Continue malgré l'échec
  fi
}

check_file_contains() {
  local file=$1
  local pattern=$2
  local description=$3
  
  print_test "Checking $description in $file"
  
  if grep -q "$pattern" "$file" 2>/dev/null; then
    print_pass "$description found"
    return 0
  else
    print_fail "$description not found in $file"
    return 0  # Continue malgré l'échec
  fi
}

##############################################################################
print_header "🎨 Pre-Commit Validation - FakeTect v2.1.0"
##############################################################################

##############################################################################
print_header "1️⃣  Favicons & Logos"
##############################################################################

check_file_exists "packages/web/public/favicon.svg" "Favicon SVG"
check_file_exists "packages/web/public/favicon.ico" "Favicon ICO"
check_file_exists "packages/web/public/favicon-16x16.png" "Favicon 16x16"
check_file_exists "packages/web/public/favicon-32x32.png" "Favicon 32x32"
check_file_exists "packages/web/public/apple-touch-icon.png" "Apple Touch Icon"
check_file_exists "packages/web/public/android-chrome-192x192.png" "Android 192"
check_file_exists "packages/web/public/android-chrome-512x512.png" "Android 512"
check_file_exists "packages/web/public/og-image.jpg" "Open Graph Image"
check_file_exists "packages/web/public/site.webmanifest" "PWA Manifest"

##############################################################################
print_header "2️⃣  Extension Icons"
##############################################################################

check_file_exists "packages/extension/icons/icon16.png" "Extension Icon 16"
check_file_exists "packages/extension/icons/icon48.png" "Extension Icon 48"
check_file_exists "packages/extension/icons/icon128.png" "Extension Icon 128"
check_file_exists "packages/extension/icons/icon512.png" "Extension Icon 512"

##############################################################################
print_header "3️⃣  Trust Badges"
##############################################################################

check_file_exists "packages/web/public/badges/ssl-secure.svg" "SSL Badge"
check_file_exists "packages/web/public/badges/gdpr-compliant.svg" "GDPR Badge"
check_file_exists "packages/web/public/badges/iso27001.svg" "ISO Badge"
check_file_exists "packages/web/public/badges/soc2.svg" "SOC2 Badge"
check_file_exists "packages/web/public/badges/uptime-99.svg" "Uptime Badge"
check_file_exists "packages/web/public/badges/enterprise-ready.svg" "Enterprise Badge"

##############################################################################
print_header "4️⃣  Documentation"
##############################################################################

check_file_exists "SECURITY.md" "Security Policy"
check_file_exists "docs/IT-WHITELIST-GUIDE.md" "IT Whitelist Guide"
check_file_exists "PLAN-AMELIORATION-SECURITE.md" "Security Plan"
check_file_exists "docs/LOGO-GENERATION-GUIDE.md" "Logo Guide"
check_file_exists "RECAP-SECURITE-LOGOS.md" "Security Recap"
check_file_exists "CHECKLIST-DEPLOIEMENT.md" "Deployment Checklist"
check_file_exists "RESUME-EXECUTIF-SECURITE.md" "Executive Summary"
check_file_exists "GUIDE-VISUEL-AMELIORATIONS.md" "Visual Guide"
check_file_exists "CHANGELOG-SECURITE.md" "Security Changelog"

##############################################################################
print_header "5️⃣  Scripts"
##############################################################################

check_file_exists "scripts/generate-favicons.js" "Favicon Generator"
check_file_exists "scripts/verify-deployment.sh" "Deployment Verifier"

# Vérifier que les scripts sont exécutables
if [ -x "scripts/verify-deployment.sh" ]; then
  print_pass "verify-deployment.sh is executable"
  ((PASSED++))
else
  print_fail "verify-deployment.sh not executable (run: chmod +x)"
  ((FAILED++))
fi

##############################################################################
print_header "6️⃣  Code Quality - Security Headers"
##############################################################################

check_file_contains "packages/api/server.js" "contentSecurityPolicy" "CSP configuration"
check_file_contains "packages/api/server.js" "hsts" "HSTS configuration"
check_file_contains "packages/api/server.js" "max-age=31536000" "HSTS 1 year"
check_file_contains "packages/api/server.js" "preload: true" "HSTS preload"
check_file_contains "packages/api/server.js" "Permissions-Policy" "Permissions-Policy header"
check_file_contains "packages/api/server.js" "Referrer-Policy" "Referrer-Policy header"
check_file_contains "packages/api/server.js" "X-Frame-Options" "X-Frame-Options header"

##############################################################################
print_header "7️⃣  Code Quality - HTML Meta Tags"
##############################################################################

check_file_contains "packages/web/index.html" "Content-Security-Policy" "CSP meta tag"
check_file_contains "packages/web/index.html" "apple-touch-icon" "Apple icon link"
check_file_contains "packages/web/index.html" "og:image" "Open Graph image"
check_file_contains "packages/web/index.html" "site.webmanifest" "PWA manifest link"
check_file_contains "packages/web/index.html" "preconnect" "DNS preconnect"

##############################################################################
print_header "8️⃣  Syntax Validation"
##############################################################################

print_test "Checking JavaScript syntax (server.js)"
if node -c packages/api/server.js 2>/dev/null; then
  print_pass "server.js syntax valid"
  ((PASSED++))
else
  print_fail "server.js syntax error"
  ((FAILED++))
fi

print_test "Checking JSON syntax (manifest.json)"
if python3 -m json.tool packages/extension/manifest.json > /dev/null 2>&1; then
  print_pass "manifest.json valid"
  ((PASSED++))
else
  print_fail "manifest.json invalid JSON"
  ((FAILED++))
fi

print_test "Checking JSON syntax (site.webmanifest)"
if python3 -m json.tool packages/web/public/site.webmanifest > /dev/null 2>&1; then
  print_pass "site.webmanifest valid"
  ((PASSED++))
else
  print_fail "site.webmanifest invalid JSON"
  ((FAILED++))
fi

##############################################################################
print_header "9️⃣  Git Status"
##############################################################################

print_test "Checking git status"
if git diff --quiet; then
  print_pass "No uncommitted changes"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
  echo ""
  git status --short
  echo ""
fi

##############################################################################
print_header "📊 Résumé"
##############################################################################

TOTAL=$((PASSED + FAILED))

echo ""
echo -e "${GREEN}✓ Passed: $PASSED/$TOTAL${NC}"
echo -e "${RED}✗ Failed: $FAILED/$TOTAL${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  ✅ PRÊT POUR LE COMMIT !${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Prochaines étapes :"
  echo "  1. git add ."
  echo "  2. git commit -F CHANGELOG-SECURITE.md"
  echo "  3. git push origin main"
  echo "  4. ./scripts/verify-deployment.sh production"
  echo ""
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}  ❌ ERREURS DÉTECTÉES - CORRIGER AVANT COMMIT${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Actions recommandées :"
  echo "  - Vérifier les fichiers manquants ci-dessus"
  echo "  - Régénérer les favicons : node scripts/generate-favicons.js"
  echo "  - Corriger les erreurs de syntaxe"
  echo "  - Relancer : ./scripts/pre-commit-check.sh"
  echo ""
  exit 1
fi
