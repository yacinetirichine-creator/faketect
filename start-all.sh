#!/bin/bash

echo "🚀 FakeTect - Démarrage complet"
echo "================================"
echo ""

# Tuer les processus existants sur les ports
echo "🧹 Nettoyage des ports..."
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Démarrer le backend
echo "🔧 Démarrage backend..."
cd backend
node src/index.js > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Attendre que le backend soit prêt
sleep 3

# Test du backend
echo "🧪 Test backend..."
if curl -s http://localhost:3001/api/health | grep -q "ok"; then
    echo "   ✅ Backend OK (http://localhost:3001)"
else
    echo "   ⚠️  Backend démarré mais pas de réponse (normal si Supabase non configuré)"
fi

# Démarrer le frontend
echo ""
echo "🎨 Démarrage frontend..."
cd ../frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Attendre que le frontend soit prêt
sleep 5

echo ""
echo "✅ Démarrage terminé !"
echo ""
echo "📊 Accès :"
echo "   Frontend : http://localhost:5173"
echo "   Backend  : http://localhost:3001"
echo ""
echo "📝 Logs :"
echo "   Backend  : tail -f logs/backend.log"
echo "   Frontend : tail -f logs/frontend.log"
echo ""
echo "🛑 Pour arrêter :"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   ou : pkill -f 'node src/index.js' && pkill -f 'vite'"
echo ""
echo "💡 Conseil : Ouvrez http://localhost:5173 dans votre navigateur"
echo ""

# Ouvrir automatiquement le navigateur (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sleep 2
    open http://localhost:5173
fi

# Attendre Ctrl+C
echo "Appuyez sur Ctrl+C pour arrêter..."
trap "echo ''; echo '🛑 Arrêt...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
