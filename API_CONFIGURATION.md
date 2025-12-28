# 🔑 Configuration des APIs - FakeTect

## ✅ APIs configurées

Votre projet est maintenant configuré avec les clés suivantes :

### 1️⃣ Illuminarty (Détection IA d'images) - **ACTIF** ✅

```env
ILLUMINARTY_USER=xxx (configuré dans .env)
ILLUMINARTY_SECRET=xxx (configuré dans .env)
ILLUMINARTY_API_KEY=xxx (configuré dans .env)
```

**Documentation** : https://illuminarty.ai/api-docs  
**Utilisation** : Détection automatique d'images générées par IA  
**Prix** : Vérifier sur votre dashboard Illuminarty

### 2️⃣ OpenAI (Analyse avancée) - **ACTIF** ✅

```env
OPENAI_API_KEY=sk-proj-xxx...xxx (configuré dans .env)
```

**Documentation** : https://platform.openai.com/docs  
**Utilisation** :
- Analyse de texte (détection IA writing)
- Vision API (analyse visuelle avancée)
- Explications détaillées des résultats

**Prix** : 
- GPT-4 : ~$0.03/1K tokens
- GPT-4-Vision : ~$0.01/image
- GPT-3.5-Turbo : ~$0.002/1K tokens

---

## 🚀 Fonctionnalités disponibles

### Analyse d'images (Illuminarty + fallback)
```javascript
// Le service détection.js utilise automatiquement :
// 1. Illuminarty (priorité)
// 2. Sightengine (si configuré)
// 3. Mode démo (si aucune API)

POST /api/analysis/file
Content-Type: multipart/form-data
Body: { file: <image> }

Response:
{
  "success": true,
  "analysis": {
    "aiScore": 85.5,
    "isAi": true,
    "confidence": 92,
    "verdict": { "key": "likely_ai", "color": "orange" },
    "provider": "illuminarty"  // ou "sightengine" ou "demo"
  }
}
```

### Analyse de texte (OpenAI) - **NOUVEAU** 🆕
```javascript
POST /api/text-analysis/analyze
Content-Type: application/json
Body: { "text": "Votre texte à analyser..." }

Response:
{
  "success": true,
  "analysis": {
    "aiScore": 75.2,
    "isAi": true,
    "confidence": 88,
    "verdict": { "key": "likely_ai", "color": "orange" },
    "indicators": [
      "Formulation trop parfaite",
      "Absence d'erreurs naturelles",
      "Structure répétitive"
    ],
    "provider": "openai"
  }
}
```

### Explication détaillée (OpenAI)
```javascript
GET /api/text-analysis/explain/:analysisId

Response:
{
  "success": true,
  "explanation": "Cette image présente plusieurs indicateurs d'IA : des détails flous, des symétries inhabituelles..."
}
```

---

## 📊 Architecture de détection

```
┌─────────────────────────────────────────────┐
│         Upload Image/Texte                  │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  detection.js     │
         │  (orchestrateur)  │
         └─────────┬─────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼─────┐  ┌───▼────┐  ┌────▼────┐
│Illuminarty│  │OpenAI  │  │  Demo   │
│  (Image)  │  │(Texte) │  │ (Random)│
└───────────┘  └────────┘  └─────────┘
```

**Logique de fallback** :
1. Illuminarty (si clés présentes)
2. Sightengine (si échec + clés présentes)
3. Mode démo (si toutes les APIs échouent)

---

## 🔧 Configuration dans le code

### Service de détection (backend/src/services/detection.js)
```javascript
// Détection automatique avec priorités
async analyze(buffer, mimeType) {
  // 1. Illuminarty
  if (process.env.ILLUMINARTY_USER) {
    return await this.analyzeWithIlluminarty(buffer, mimeType);
  }
  
  // 2. Sightengine
  if (process.env.SIGHTENGINE_USER) {
    return await this.analyzeWithSightengine(buffer, mimeType);
  }
  
  // 3. Mode démo
  return this.demoAnalysis();
}
```

### Service OpenAI (backend/src/services/openai.js)
```javascript
// Analyse de texte
await openai.analyzeText(text);

// Analyse visuelle avancée
await openai.analyzeImageWithVision(base64Image);

// Explication
await openai.explainAnalysis(analysisResult);
```

---

## 💡 Utilisation recommandée

### Pour la production

**Images** : Illuminarty (configuré ✅)
- Spécialisé dans la détection d'images IA
- Rapide et précis
- Bon rapport qualité/prix

**Texte** : OpenAI GPT-4 (configuré ✅)
- Meilleure détection de texte généré par IA
- Explications détaillées
- Plus coûteux mais très efficace

**Fallback** : Sightengine (optionnel)
- Backup si Illuminarty échoue
- Non configuré actuellement

---

## 📈 Monitoring des APIs

### Vérifier l'utilisation

**Illuminarty** : https://illuminarty.ai/dashboard  
**OpenAI** : https://platform.openai.com/usage  

### Limites de taux (Rate Limits)

**Illuminarty** : Vérifier dashboard  
**OpenAI** :
- Tier 1 : 200 req/min (GPT-4)
- Tier 1 : 500 req/min (GPT-3.5)

### Gérer les erreurs

Le code gère automatiquement :
- ✅ Timeouts
- ✅ Rate limiting
- ✅ Fallback vers démo
- ✅ Logs d'erreurs

---

## 🧪 Tester les APIs

### 1. Démarrer le serveur
```bash
cd backend
npm run dev
```

### 2. Tester Illuminarty (image)
```bash
curl -X POST http://localhost:3001/api/analysis/file \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-image.jpg"
```

### 3. Tester OpenAI (texte)
```bash
curl -X POST http://localhost:3001/api/text-analysis/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test text to analyze for AI generation."}'
```

### 4. Vérifier dans les logs
```bash
# Vous devriez voir :
✅ Illuminarty API success
✅ OpenAI API success
❌ Sightengine API skipped (not configured)
```

---

## ⚠️ Sécurité des clés

### Ne JAMAIS commiter les clés
```bash
# Vérifier .gitignore
cat .gitignore | grep .env
# Doit afficher : .env
```

### En production
```bash
# Utiliser variables d'environnement du serveur
# Render/Railway/Vercel :
ILLUMINARTY_USER=xxx
ILLUMINARTY_SECRET=xxx
OPENAI_API_KEY=sk-xxx
```

### Rotation des clés
Changer régulièrement (tous les 3-6 mois) :
1. Illuminarty : Dashboard → API Keys → Regenerate
2. OpenAI : Platform → API Keys → Revoke + Create

---

## 💰 Estimation de coûts

### Scénario : 1000 analyses/jour

**Images (Illuminarty)** :
- 800 analyses images × $0.02 = **$16/jour**
- Mensuel : **~$480**

**Texte (OpenAI GPT-4)** :
- 200 analyses texte × $0.05 = **$10/jour**
- Mensuel : **~$300**

**Total estimé** : **~$780/mois**

### Optimisations possibles
```javascript
// 1. Cache Redis (éviter re-analyse)
const cached = await redis.get(`analysis:${fileHash}`);

// 2. Utiliser GPT-3.5 pour texte simple
model: 'gpt-3.5-turbo' // 15x moins cher que GPT-4

// 3. Batch processing (réduire appels API)
```

---

## 📚 Documentation des APIs

**Illuminarty** : https://illuminarty.ai/docs  
**OpenAI** : https://platform.openai.com/docs/api-reference  
**Sightengine** : https://sightengine.com/docs

---

## ✅ Checklist de déploiement

- [x] Clés Illuminarty configurées
- [x] Clé OpenAI configurée
- [x] Service de détection mis à jour
- [x] Route analyse texte créée
- [x] Fallback mode démo opérationnel
- [ ] Tests unitaires des APIs
- [ ] Monitoring configuré
- [ ] Rate limiting ajouté
- [ ] Cache Redis (optionnel)

---

**Mis à jour le** : 28 décembre 2025  
**APIs actives** : Illuminarty ✅ | OpenAI ✅ | Sightengine ❌
