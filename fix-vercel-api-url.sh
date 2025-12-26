#!/bin/bash
# Script de correction rapide pour VITE_API_URL sur Vercel

set -e

echo "🔧 Correction de VITE_API_URL sur Vercel..."
echo ""

# Vérifier si vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "➡️  Installez-le avec: npm i -g vercel"
    echo ""
    echo "Ou bien allez sur https://vercel.com/dashboard pour le faire manuellement"
    exit 1
fi

echo "✅ Vercel CLI détecté"
echo ""

# Se positionner dans le bon dossier
cd packages/web

echo "🔄 Mise à jour de VITE_API_URL..."
echo ""

# Supprimer l'ancienne variable (peut échouer si elle n'existe pas)
vercel env rm VITE_API_URL production 2>/dev/null || true

# Ajouter la nouvelle
echo "https://faketect-api.onrender.com" | vercel env add VITE_API_URL production

echo ""
echo "✅ Variable mise à jour !"
echo ""
echo "🚀 Redéploiement en production..."
vercel --prod

echo ""
echo "✅ Déploiement terminé !"
echo "➡️  Testez sur https://faketect.app"
