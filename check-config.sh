#!/bin/bash

echo "🔍 Diagnostic de connexion FakeTect"
echo "===================================="
echo ""

# Vérifier le fichier .env
if [ -f "backend/.env" ]; then
    echo "✅ Fichier .env trouvé"
    
    # Vérifier si DATABASE_URL est configurée
    if grep -q "YOUR_PASSWORD" backend/.env; then
        echo "❌ DATABASE_URL non configurée (mot de passe manquant)"
        echo ""
        echo "📝 ÉTAPES POUR CONFIGURER LA BASE DE DONNÉES:"
        echo ""
        echo "1. Allez sur https://supabase.com/dashboard/project/ljrwqjaflgtfddcyumqg/settings/database"
        echo "2. Trouvez votre mot de passe de base de données (ou réinitialisez-le)"
        echo "3. Modifiez le fichier backend/.env et remplacez [YOUR_PASSWORD] par votre mot de passe"
        echo ""
        echo "Format attendu:"
        echo "DATABASE_URL=\"postgresql://postgres.ljrwqjaflgtfddcyumqg:VOTRE_MOT_DE_PASSE@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres\""
        echo ""
        exit 1
    else
        echo "✅ DATABASE_URL configurée"
    fi
else
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

# Vérifier node_modules backend
if [ -d "backend/node_modules" ]; then
    echo "✅ Dépendances backend installées"
else
    echo "❌ Dépendances backend manquantes"
    echo "   Exécutez: cd backend && npm install"
    exit 1
fi

# Vérifier node_modules frontend
if [ -d "frontend/node_modules" ]; then
    echo "✅ Dépendances frontend installées"
else
    echo "❌ Dépendances frontend manquantes"
    echo "   Exécutez: cd frontend && npm install"
    exit 1
fi

echo ""
echo "🎉 Configuration de base OK!"
echo ""
echo "📌 PROCHAINES ÉTAPES:"
echo ""
echo "1. Configurer votre mot de passe Supabase dans backend/.env"
echo "2. Démarrer le backend:  cd backend && npm run dev"
echo "3. Démarrer le frontend: cd frontend && npm run dev"
echo ""
