#!/bin/bash

# 🧪 Script de tests automatisés FakeTect
# Usage: ./test-validation.sh [plan]
# Exemples:
#   ./test-validation.sh free
#   ./test-validation.sh starter
#   ./test-validation.sh all

# Continuer même en cas d'erreur pour voir tous les résultats
# set -e est retiré pour permettre de voir tous les tests

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

log_error() {
    echo -e "${RED}❌ ${1}${NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

# Test API Health
test_api_health() {
    log_info "Test API health..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health")
    
    if [ "$response" = "200" ]; then
        log_success "API health check OK"
    else
        log_error "API health check failed (HTTP $response)"
    fi
}

# Test connexion DB
test_database() {
    log_info "Test connexion base de données..."
    
    response=$(curl -s "$API_URL/api/health")
    
    if echo "$response" | grep -q "database.*ok"; then
        log_success "Database connection OK"
    else
        log_error "Database connection failed"
    fi
}

# Test inscription utilisateur
test_user_registration() {
    local test_email="test-$(date +%s)@faketect.com"
    
    log_info "Test inscription utilisateur ($test_email)..."
    
    response=$(curl -s -X POST "$API_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_email\",\"password\":\"Test1234!\",\"name\":\"Test User\"}")
    
    if echo "$response" | grep -q "token"; then
        log_success "User registration OK"
        echo "$response" > /tmp/faketect-test-user.json
    else
        log_error "User registration failed: $response"
    fi
}

# Test login
test_user_login() {
    log_info "Test login utilisateur..."
    
    # Récupérer email du test précédent
    if [ ! -f /tmp/faketect-test-user.json ]; then
        log_warning "Pas de user de test, skip login test"
        return
    fi
    
    local test_email=$(cat /tmp/faketect-test-user.json | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    
    response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_email\",\"password\":\"Test1234!\"}")
    
    if echo "$response" | grep -q "token"; then
        log_success "User login OK"
        # Sauvegarder token pour tests suivants
        echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4 > /tmp/faketect-test-token.txt
    else
        log_error "User login failed"
    fi
}

# Test quota FREE (3/jour)
test_quota_free() {
    log_info "Test quota FREE (3/jour)..."
    
    if [ ! -f /tmp/faketect-test-token.txt ]; then
        log_warning "Pas de token, skip quota test"
        return
    fi
    
    local token=$(cat /tmp/faketect-test-token.txt)
    
    # Créer une image de test
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test.png
    
    # Faire 3 analyses (devrait passer)
    for i in {1..3}; do
        response=$(curl -s -X POST "$API_URL/api/analysis" \
            -H "Authorization: Bearer $token" \
            -F "file=@/tmp/test.png")
        
        if echo "$response" | grep -q "id"; then
            log_success "Analyse $i/3 OK"
        else
            log_error "Analyse $i/3 failed"
        fi
        
        sleep 1
    done
    
    # 4ème analyse (devrait échouer)
    response=$(curl -s -X POST "$API_URL/api/analysis" \
        -H "Authorization: Bearer $token" \
        -F "file=@/tmp/test.png")
    
    if echo "$response" | grep -q "quota"; then
        log_success "Quota FREE correctement appliqué (refus 4ème analyse)"
    else
        log_error "Quota FREE non respecté (4ème analyse acceptée)"
    fi
}

# Test historique
test_history() {
    log_info "Test récupération historique..."
    
    if [ ! -f /tmp/faketect-test-token.txt ]; then
        log_warning "Pas de token, skip history test"
        return
    fi
    
    local token=$(cat /tmp/faketect-test-token.txt)
    
    response=$(curl -s -X GET "$API_URL/api/analysis/history" \
        -H "Authorization: Bearer $token")
    
    if echo "$response" | grep -q "analyses"; then
        log_success "History retrieval OK"
    else
        log_error "History retrieval failed"
    fi
}

# Test admin access (devrait échouer pour user normal)
test_admin_access() {
    log_info "Test admin access control..."
    
    if [ ! -f /tmp/faketect-test-token.txt ]; then
        log_warning "Pas de token, skip admin test"
        return
    fi
    
    local token=$(cat /tmp/faketect-test-token.txt)
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/admin/stats" \
        -H "Authorization: Bearer $token")
    
    if [ "$response" = "403" ]; then
        log_success "Admin access correctly denied for regular user"
    else
        log_error "Admin access security issue (HTTP $response)"
    fi
}

# Test Stripe products
test_stripe_products() {
    log_info "Test Stripe products..."
    
    response=$(curl -s "$API_URL/api/plans")
    
    if echo "$response" | grep -q "STARTER"; then
        log_success "Stripe products loaded"
    else
        log_error "Stripe products not found"
    fi
}

# Test email configuration
test_email_config() {
    log_info "Test configuration email..."
    
    if [ -f "backend/.env" ]; then
        if grep -q "EMAIL_USER" backend/.env && grep -q "EMAIL_PASS" backend/.env; then
            log_success "Email configuration present"
        else
            log_error "Email configuration missing"
        fi
    else
        log_error "backend/.env not found"
    fi
}

# Test Sentry configuration
test_sentry_config() {
    log_info "Test configuration Sentry..."
    
    backend_sentry=false
    frontend_sentry=false
    
    if [ -f "backend/.env" ] && grep -q "SENTRY_DSN" backend/.env; then
        backend_sentry=true
    fi
    
    if [ -f "frontend/.env" ] && grep -q "VITE_SENTRY_DSN" frontend/.env; then
        frontend_sentry=true
    fi
    
    if [ "$backend_sentry" = true ] && [ "$frontend_sentry" = true ]; then
        log_success "Sentry configured (backend + frontend)"
    elif [ "$backend_sentry" = true ]; then
        log_warning "Sentry configured backend only"
    elif [ "$frontend_sentry" = true ]; then
        log_warning "Sentry configured frontend only"
    else
        log_error "Sentry not configured"
    fi
}

# Test SEO meta tags
test_seo_tags() {
    log_info "Test SEO meta tags..."
    
    if [ -f "frontend/index.html" ]; then
        meta_count=$(grep -c "og:" frontend/index.html || echo 0)
        
        if [ "$meta_count" -gt 5 ]; then
            log_success "SEO meta tags present ($meta_count tags)"
        else
            log_error "SEO meta tags insufficient ($meta_count tags)"
        fi
    else
        log_error "frontend/index.html not found"
    fi
}

# Test responsive design
test_responsive() {
    log_info "Test responsive design..."
    
    if [ -f "frontend/index.html" ]; then
        if grep -q "viewport" frontend/index.html; then
            log_success "Viewport meta tag present"
        else
            log_error "Viewport meta tag missing"
        fi
    fi
}

# Test security headers
test_security_headers() {
    log_info "Test security headers..."
    
    if [ -f "frontend/index.html" ]; then
        security_count=$(grep -c "X-Frame-Options\|X-Content-Type-Options\|X-XSS-Protection" frontend/index.html || echo 0)
        
        if [ "$security_count" -ge 3 ]; then
            log_success "Security headers present"
        else
            log_error "Security headers missing"
        fi
    fi
}

# Tests de performance
test_performance() {
    log_info "Test temps de réponse API..."
    
    start=$(date +%s%N)
    curl -s "$API_URL/api/health" > /dev/null
    end=$(date +%s%N)
    
    duration=$(( (end - start) / 1000000 )) # Convert to ms
    
    if [ "$duration" -lt 200 ]; then
        log_success "API response time OK (${duration}ms)"
    else
        log_warning "API response time slow (${duration}ms)"
    fi
}

# Rapport final
print_report() {
    echo ""
    echo "=================================="
    echo "📊 RAPPORT DE TESTS"
    echo "=================================="
    echo ""
    echo "Total tests : $TESTS_TOTAL"
    echo -e "${GREEN}✅ Réussis  : $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Échoués  : $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 Tous les tests sont passés !${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Certains tests ont échoué${NC}"
        exit 1
    fi
}

# Nettoyage
cleanup() {
    rm -f /tmp/faketect-test-*.json
    rm -f /tmp/faketect-test-*.txt
    rm -f /tmp/test.png
}

# Main
main() {
    echo "🧪 Tests de validation FakeTect"
    echo "=================================="
    echo ""
    
    # Tests infrastructure
    test_api_health
    test_database
    
    # Tests authentification
    test_user_registration
    test_user_login
    
    # Tests fonctionnels
    test_quota_free
    test_history
    test_admin_access
    test_stripe_products
    
    # Tests configuration
    test_email_config
    test_sentry_config
    test_seo_tags
    test_responsive
    test_security_headers
    
    # Tests performance
    test_performance
    
    # Rapport
    print_report
    
    # Nettoyage
    cleanup
}

# Trap pour cleanup en cas d'erreur
trap cleanup EXIT

# Exécution
main "$@"
