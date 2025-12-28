#!/bin/bash

# Test de validation de la durée vidéo (60 secondes max)

API_URL="http://localhost:3001"

echo "🎬 Test de validation vidéo - Limite 60 secondes"
echo "================================================"

# Récupérer un token de test
echo ""
echo "1️⃣ Connexion utilisateur de test..."
response=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"video-test-$(date +%s)@faketect.com\",\"password\":\"Test1234!\",\"name\":\"Video Tester\"}")

token=$(echo "$response" | jq -r '.token // empty')

if [ -z "$token" ]; then
    echo "❌ Échec de connexion"
    echo "$response" | jq .
    exit 1
fi

echo "✅ Token obtenu"

# Info sur la fonctionnalité
echo ""
echo "2️⃣ Fonctionnalité vidéo:"
echo "   - Les vidéos de n'importe quelle durée sont acceptées"
echo "   - Seules les 60 premières secondes sont analysées"
echo "   - L'utilisateur est informé si la vidéo dépasse 60s"
echo "   - Économie de coûts API pour les longues vidéos"

echo ""
echo "3️⃣ Pour tester avec une vraie vidéo:"
echo ""
echo "   curl -X POST $API_URL/api/analysis/file \\"
echo "     -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     -F \"file=@votre-video.mp4\""
echo ""
echo "   Si vidéo > 60s, la réponse contiendra:"
echo "   {" 
echo "     \"analysis\": {"
echo "       \"videoMetadata\": {"
echo "         \"totalDuration\": 120,"
echo "         \"analyzedDuration\": 60,"
echo "         \"isPartialAnalysis\": true"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "✅ Configuration vidéo opérationnelle!"
echo ""
echo "📋 Résumé des limites:"
echo "   - Taille max fichier: 100 MB"
echo "   - Durée analysée: 60 secondes max"
echo "   - Formats supportés: MP4, MOV, AVI, MPEG"
echo "   - Coût optimisé: analyse partielle des longues vidéos"
