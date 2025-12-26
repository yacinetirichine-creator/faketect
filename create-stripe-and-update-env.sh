#!/bin/bash

# Script: Créer les produits Stripe et mettre à jour les .env
# Usage: ./create-stripe-and-update-env.sh

set -e

echo "🚀 Script FakeTect - Création Stripe + Update ENV"
echo "=================================================="
echo ""

# 1. Demander la clé Stripe
echo "📌 Étape 1: Clé Stripe"
echo "Où trouver votre clé? https://dashboard.stripe.com/apikeys"
echo ""
read -p "Entrez votre STRIPE_SECRET_KEY (sk_live_...): " STRIPE_KEY

if [[ ! "$STRIPE_KEY" =~ ^sk_live_ ]]; then
  echo "❌ Erreur: La clé doit commencer par 'sk_live_'"
  echo "Vous avez peut-être copié la clé publique (pk_live_) au lieu de la secrète."
  exit 1
fi

echo "✅ Clé Stripe validée"
echo ""

# 2. Exécuter le script de création
echo "📌 Étape 2: Création des 7 produits Stripe..."
echo ""

cd packages/api

# Créer un fichier temporaire pour stocker les variables
TEMP_VARS=$(mktemp)

export STRIPE_SECRET_KEY="$STRIPE_KEY"

# Exécuter le script et capturer la sortie
if node scripts/create-new-pricing.js > "$TEMP_VARS" 2>&1; then
  echo "✅ Produits créés avec succès!"
  echo ""
else
  echo "❌ Erreur lors de la création des produits:"
  cat "$TEMP_VARS"
  rm "$TEMP_VARS"
  exit 1
fi

# Extraire les Price IDs de la sortie
echo "📌 Étape 3: Extraction des Price IDs..."

# Fonction pour extraire price ID
extract_price_id() {
  local var_name=$1
  grep "VITE_${var_name}=" "$TEMP_VARS" | cut -d'=' -f2
}

STARTER_MONTHLY=$(extract_price_id "STRIPE_PRICE_STARTER_MONTHLY")
PRO_MONTHLY=$(extract_price_id "STRIPE_PRICE_PRO_MONTHLY")
BUSINESS_MONTHLY=$(extract_price_id "STRIPE_PRICE_BUSINESS_MONTHLY")
ENTERPRISE_MONTHLY=$(extract_price_id "STRIPE_PRICE_ENTERPRISE_MONTHLY")
STARTER_YEARLY=$(extract_price_id "STRIPE_PRICE_STARTER_YEARLY")
PRO_YEARLY=$(extract_price_id "STRIPE_PRICE_PRO_YEARLY")
BUSINESS_YEARLY=$(extract_price_id "STRIPE_PRICE_BUSINESS_YEARLY")

echo "✅ Price IDs extraits"
echo ""

# 4. Mettre à jour les fichiers .env
echo "📌 Étape 4: Mise à jour des fichiers .env..."

# Frontend .env
cd ../../packages/web

cat > .env.new << EOF
# ===========================================
# FAKETECT WEB - Frontend Configuration
# Production Environment Variables
# ===========================================

# API
VITE_API_URL=https://api.faketect.com
VITE_SUPABASE_URL=https://vnobflzcvjqjgfybqlbg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZub2JmbHpjdmpxamdmeWJxbGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NzAwMDAsImV4cCI6MTk5OTk5OTk5OX0.fake_token_example

# ===========================================
# Stripe Configuration (PRODUCTION)
# ===========================================

# Clé publique Stripe (visible au frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51Sg8QsIaJ0g5yYYSXbZ0d5c6e7f8g9h0i1j2k3l4m5n6o7p8q9r0

# Price IDs - Plans Mensuels
VITE_STRIPE_PRICE_STARTER_MONTHLY=$STARTER_MONTHLY
VITE_STRIPE_PRICE_PRO_MONTHLY=$PRO_MONTHLY
VITE_STRIPE_PRICE_BUSINESS_MONTHLY=$BUSINESS_MONTHLY
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=$ENTERPRISE_MONTHLY

# Price IDs - Offres Annuelles
VITE_STRIPE_PRICE_STARTER_YEARLY=$STARTER_YEARLY
VITE_STRIPE_PRICE_PRO_YEARLY=$PRO_YEARLY
VITE_STRIPE_PRICE_BUSINESS_YEARLY=$BUSINESS_YEARLY

# ===========================================
# Application Settings
# ===========================================
VITE_APP_URL=https://faketect.com
NODE_ENV=production
EOF

mv .env.new .env
echo "✅ Frontend .env mis à jour"

# Backend .env
cd ../api

cat > .env.new << EOF
# ===========================================
# FAKETECT API v2.1 - Production Configuration
# ===========================================

PORT=3001
NODE_ENV=production

# ===========================================
# SUPABASE
# ===========================================
SUPABASE_URL=https://vnobflzcvjqjgfybqlbg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZub2JmbHpjdmpxamdmeWJxbGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NzAwMDAsImV4cCI6MTk5OTk5OTk5OX0.fake_token_example
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZub2JmbHpjdmpxamdmeWJxbGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTc3MDAwMCwiZXhwIjoxOTk5OTk5OTk5fQ.fake_service_key_example

# ===========================================
# STRIPE - Production
# ===========================================

# Keys de Stripe (LIVE mode)
STRIPE_SECRET_KEY=$STRIPE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_51Sg8QsIaJ0g5yYYSXbZ0d5c6e7f8g9h0i1j2k3l4m5n6o7p8q9r0

# Price IDs - Plans Mensuels
STRIPE_PRICE_STARTER_MONTHLY=$STARTER_MONTHLY
STRIPE_PRICE_PRO_MONTHLY=$PRO_MONTHLY
STRIPE_PRICE_BUSINESS_MONTHLY=$BUSINESS_MONTHLY
STRIPE_PRICE_ENTERPRISE_MONTHLY=$ENTERPRISE_MONTHLY

# Price IDs - Offres Annuelles
STRIPE_PRICE_STARTER_YEARLY=$STARTER_YEARLY
STRIPE_PRICE_PRO_YEARLY=$PRO_YEARLY
STRIPE_PRICE_BUSINESS_YEARLY=$BUSINESS_YEARLY

# Webhook Stripe
STRIPE_WEBHOOK_SECRET=whsec_1Sg8eBIaJ0g5yYYSqoF1o48Q

# ===========================================
# APIs de Détection
# ===========================================
SIGHTENGINE_USER=user_faketect
SIGHTENGINE_SECRET=secret_sightengine_key
ILLUMINARTY_API_KEY=key_illuminarty_api

# ===========================================
# Limites et Configuration
# ===========================================
RATE_LIMIT_PER_MINUTE=60
MAX_FILE_SIZE=20971520
MAX_BATCH_SIZE=20

# Documents
MAX_PDF_PAGES=20
PDF_RENDER_SCALE=2

# Détection
AI_DECISION_THRESHOLD=0.7
GUEST_DAILY_LIMIT=3

# ===========================================
# Video Processing
# ===========================================
VIDEO_DAILY_LIMIT=15
VIDEO_MAX_SECONDS=60
VIDEO_MAX_BYTES=209715200
VIDEO_COARSE_FPS=0.5
VIDEO_BURST_FPS=2
VIDEO_BURST_WINDOW_SECONDS=4
VIDEO_MAX_FRAMES=80
VIDEO_BURST_TOP_K=3

# ===========================================
# Sécurité - Certificats
# ===========================================
CERT_SIGNING_SECRET=994ac7f663f60f36ccf650aef990467577bebd3777940faf69d335f2acc7a4e0
CERT_SIGNING_SECRET_OLD=

# ===========================================
# Monitoring
# ===========================================
ADMIN_METRICS_TOKEN=metrics_token_secret_key

# ===========================================
# CORS
# ===========================================
ALLOWED_ORIGINS=https://faketect.com,https://www.faketect.com,http://localhost:5173,http://localhost:3000

# ===========================================
# Emails Professionnels
# ===========================================
COMPANY_EMAIL=contact@faketect.com
DPO_EMAIL=dpo@faketect.com
LEGAL_EMAIL=legal@faketect.com
SUPPORT_EMAIL=support@faketect.com
COMPLAINTS_EMAIL=complaints@faketect.com
REVIEW_EMAIL=review@faketect.com
COMPANY_PHONE=+33123456789
EOF

mv .env.new .env
echo "✅ Backend .env mis à jour"

# Nettoyage
rm "$TEMP_VARS"
unset STRIPE_SECRET_KEY

# Résumé
cd ../../

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ SUCCÈS! Tous les produits Stripe ont été créés!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Résumé des Price IDs:"
echo "   • Starter Mensuel:     $STARTER_MONTHLY"
echo "   • Pro Mensuel:         $PRO_MONTHLY"
echo "   • Business Mensuel:    $BUSINESS_MONTHLY"
echo "   • Enterprise Mensuel:  $ENTERPRISE_MONTHLY"
echo "   • Starter Annuel:      $STARTER_YEARLY"
echo "   • Pro Annuel:          $PRO_YEARLY"
echo "   • Business Annuel:     $BUSINESS_YEARLY"
echo ""
echo "📝 Les fichiers .env ont été mis à jour automatiquement"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Vérifier que les fichiers .env sont corrects"
echo "   2. Committer et pusher: git add . && git commit -m 'feat: Ajouter price IDs Stripe' && git push"
echo "   3. Vérifier https://faketect.com/pricing"
echo ""
