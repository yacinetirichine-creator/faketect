#!/bin/bash

# Script de déploiement automatique Vercel
# Usage: ./deploy-vercel.sh

set -e

echo "🚀 Déploiement de Faketect sur Vercel"
echo "======================================"
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé."
    echo "📦 Installation..."
    npm install -g vercel
    echo "✅ Vercel CLI installé"
fi

# Se positionner dans le dossier web
cd "$(dirname "$0")"
echo "📁 Dossier: $(pwd)"
echo ""

# Vérifier que le build fonctionne
echo "🔨 Test du build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi"
else
    echo "❌ Build échoué"
    exit 1
fi

echo ""
echo "📤 Déploiement sur Vercel..."
echo ""

# Déployer en production
vercel --prod

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "🔧 N'oubliez pas de:"
echo "   1. Configurer les variables d'environnement sur Vercel Dashboard"
echo "   2. Mettre à jour les URLs dans Supabase"
echo "   3. Vérifier les CORS de l'API"
echo ""
echo "📖 Documentation complète: ./DEPLOYMENT.md"
