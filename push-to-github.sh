#!/bin/bash

# Script de push vers GitHub et déploiement Vercel
# Usage: ./push-to-github.sh [nom-du-repo]

echo "🚀 FakeTect - Déploiement v2.0.1"
echo "================================"
echo ""

# Vérifier si un nom de repo est fourni
if [ -z "$1" ]; then
    echo "❌ Erreur: Nom du repository GitHub requis"
    echo "Usage: ./push-to-github.sh <username>/<repo-name>"
    echo "Exemple: ./push-to-github.sh yacinetirichine/faketect"
    exit 1
fi

REPO=$1

echo "📦 Repository: $REPO"
echo ""

# Vérifier si le remote existe déjà
if git remote | grep -q "origin"; then
    echo "⚠️  Remote 'origin' existe déjà, mise à jour..."
    git remote set-url origin "https://github.com/$REPO.git"
else
    echo "➕ Ajout du remote origin..."
    git remote add origin "https://github.com/$REPO.git"
fi

echo ""
echo "📤 Push vers GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code poussé sur GitHub avec succès!"
    echo "📍 https://github.com/$REPO"
    echo ""
    
    # Demander si on veut déployer sur Vercel
    read -p "🌐 Voulez-vous déployer sur Vercel maintenant? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔄 Déploiement sur Vercel..."
        echo ""
        
        # Vérifier si Vercel CLI est installé
        if ! command -v vercel &> /dev/null; then
            echo "⚠️  Vercel CLI non installé"
            echo "Installation: npm i -g vercel"
            echo ""
            echo "Ou déployez manuellement:"
            echo "1. Allez sur https://vercel.com/new"
            echo "2. Importez le repo GitHub: $REPO"
            echo "3. Configurez:"
            echo "   - Root Directory: packages/web"
            echo "   - Build Command: npm run build"
            echo "   - Output Directory: dist"
            echo "4. Ajoutez les variables d'environnement depuis packages/web/.env.example"
            exit 0
        fi
        
        # Se déplacer dans le dossier web
        cd packages/web
        
        # Déployer sur Vercel
        vercel --prod
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Déployé sur Vercel avec succès!"
        else
            echo ""
            echo "❌ Erreur lors du déploiement Vercel"
            echo "Déployez manuellement sur https://vercel.com"
        fi
    else
        echo ""
        echo "📝 Pour déployer plus tard:"
        echo "1. Installez Vercel CLI: npm i -g vercel"
        echo "2. cd packages/web && vercel --prod"
        echo ""
        echo "Ou déployez via l'interface web:"
        echo "https://vercel.com/new"
    fi
    
    echo ""
    echo "════════════════════════════════════════"
    echo "🎉 Déploiement terminé!"
    echo "════════════════════════════════════════"
    echo ""
    echo "📌 Prochaines étapes:"
    echo "  1. Configurez les variables d'environnement sur Vercel"
    echo "  2. Testez l'application déployée"
    echo "  3. Vérifiez /api/health pour les métriques"
    echo ""
else
    echo ""
    echo "❌ Erreur lors du push GitHub"
    echo ""
    echo "Vérifiez que:"
    echo "  1. Le repository existe sur GitHub"
    echo "  2. Vous avez les droits d'accès"
    echo "  3. Vous êtes authentifié (git config --list)"
    echo ""
    echo "Pour créer le repository:"
    echo "  https://github.com/new"
    exit 1
fi
