# 🎯 Guide de démarrage complet - FakeTect v1.2

## ✅ Étape 1 : Vérification de l'installation

### Backend installé
```bash
cd backend
ls -la
# Vous devriez voir : package.json, src/, prisma/, node_modules/
```

### Frontend à installer
```bash
cd frontend
npm install
```

---

## 🚀 Étape 2 : Démarrer le projet

### Option A : Démarrage manuel (2 terminaux)

**Terminal 1 - Backend**
```bash
cd /Users/yacinetirichine/Downloads/faketect/backend
node src/index.js
```

Vous devriez voir :
```
🚀 FakeTect API: http://localhost:3001
```

**Terminal 2 - Frontend**
```bash
cd /Users/yacinetirichine/Downloads/faketect/frontend  
npm run dev
```

Vous devriez voir :
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Option B : Script automatique

Créez `start-all.sh` :
```bash
#!/bin/bash
# Démarrer backend en arrière-plan
cd backend && node src/index.js &
BACKEND_PID=$!

# Attendre 2 secondes
sleep 2

# Démarrer frontend
cd ../frontend && npm run dev

# Quand frontend s'arrête, tuer le backend
kill $BACKEND_PID
```

Puis :
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 🧪 Étape 3 : Tester les fonctionnalités

### 3.1 Test API (sans frontend)

```bash
# Health check
curl http://localhost:3001/api/health
# Résultat attendu : {"status":"ok"}

# Plans disponibles
curl http://localhost:3001/api/plans
# Résultat : Liste des 5 plans
```

### 3.2 Test avec le frontend

1. Ouvrir http://localhost:5173
2. Créer un compte (inscription)
3. Se connecter
4. Uploader une image de test
5. Voir le résultat avec :
   - Score IA (0-100%)
   - Verdict coloré
   - Sources multiples (Illuminarty + Sightengine)
   - Consensus

### 3.3 Test vidéo

1. Préparer une vidéo test (MP4, max 100MB)
2. L'uploader via le frontend
3. Attendre ~10-15 secondes
4. Voir le résultat avec frames analysées

---

## ⚠️ Problèmes courants

### Le backend ne démarre pas

**Erreur** : `Error: Cannot find module 'express'`

**Solution** :
```bash
cd backend
rm -rf node_modules
npm install
```

### Erreur Supabase

**Erreur** : `Can't reach database server`

**Solution** : C'est normal si vous n'avez pas configuré le mot de passe Supabase.
Le backend fonctionnera **sans base de données** mais avec les limitations suivantes :
- ❌ Pas d'inscription/connexion
- ❌ Pas d'historique
- ✅ Analyse d'images/vidéos fonctionne (mode démo + vraies APIs)

Pour résoudre :
1. Aller sur https://supabase.com/dashboard
2. Récupérer le mot de passe de votre projet `ljrwqjaflgtfddcyumqg`
3. Remplacer dans `backend/.env` :
```env
DATABASE_URL="postgresql://postgres:[VOTRE_MOT_DE_PASSE]@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres"
```

### Port déjà utilisé

**Erreur** : `Port 3001 already in use`

**Solution** :
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Puis relancer
cd backend && node src/index.js
```

---

## 🎨 Étape 4 : Mettre à jour le frontend pour la vidéo

Le frontend actuel ne supporte que les images. Voici les modifications à faire :

### 4.1 Modifier le Dropzone

`frontend/src/components/pages/Dashboard.jsx` :

```jsx
const { getRootProps, getInputProps } = useDropzone({
  accept: {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    'video/*': ['.mp4', '.mov', '.avi', '.mpeg']  // NOUVEAU
  },
  maxSize: 100 * 1024 * 1024, // 100MB pour vidéos
  onDrop: (files) => setFile(files[0])
});
```

### 4.2 Afficher le type de fichier

```jsx
{file && (
  <div>
    <p>Fichier : {file.name}</p>
    <p>Type : {file.type.startsWith('video/') ? 'Vidéo' : 'Image'}</p>
    <p>Taille : {(file.size / 1024 / 1024).toFixed(2)} MB</p>
  </div>
)}
```

### 4.3 Afficher les résultats enrichis

```jsx
{result && (
  <div>
    <h3>Résultat d'analyse</h3>
    <p>Score IA : {result.aiScore}%</p>
    <p>Confiance : {result.confidence}%</p>
    <p>Provider : {result.provider}</p>
    
    {/* Sources multiples */}
    {result.sources && (
      <div>
        <h4>Sources :</h4>
        {result.sources.map((s, i) => (
          <div key={i}>
            {s.provider} : {s.score}% (confiance: {s.confidence}%)
          </div>
        ))}
        <p>{result.consensus}</p>
      </div>
    )}
    
    {/* Vidéo */}
    {result.framesAnalyzed && (
      <p>Frames analysées : {result.framesAnalyzed}</p>
    )}
  </div>
)}
```

---

## 📊 Étape 5 : Vérifier les APIs

### Test Sightengine (Images)

```bash
curl -X POST "https://api.sightengine.com/1.0/check.json" \
  -F "media=@test-image.jpg" \
  -F "models=genai" \
  -F "api_user=725554468" \
  -F "api_secret=ANjA3guRmuJPLcatBTy7oYCgEx2QfFzE"
```

Si vous obtenez un résultat JSON avec `"status":"success"`, l'API fonctionne !

### Test Illuminarty (Images)

```bash
# À adapter selon la vraie doc Illuminarty
curl -X POST "https://api.illuminarty.ai/v1/analyze" \
  -H "X-API-Key: 8cMOwBbmiGceQueBPEtI" \
  -F "image=@test-image.jpg"
```

### Test OpenAI (Texte)

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-proj-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## ✅ Checklist finale

- [ ] Backend installé (`npm install` dans `backend/`)
- [ ] Frontend installé (`npm install` dans `frontend/`)
- [ ] Backend démarre sans erreur (`node src/index.js`)
- [ ] Frontend démarre (`npm run dev`)
- [ ] Health check OK (`curl http://localhost:3001/api/health`)
- [ ] APIs configurées dans `.env`
- [ ] Test upload image fonctionne
- [ ] Test upload vidéo fonctionne (si frontend mis à jour)
- [ ] Résultats multi-sources affichés
- [ ] Supabase configuré (optionnel mais recommandé)

---

## 🚀 Prochaines étapes avancées

### 1. Configurer Supabase (pour auth + BDD)
- Récupérer le mot de passe DB
- Tester `npx prisma db push`
- Créer un compte utilisateur

### 2. Implémenter le frontend vidéo
- Modifier Dropzone (accept video/*)
- Gérer l'upload (peut prendre 10-15s)
- Afficher framesAnalyzed

### 3. Mode économique
- Analyser avec 1 API si score > 80% ou < 20%
- Économiser ~50% sur les coûts

### 4. Monitoring
- Ajouter Sentry pour les erreurs
- Dashboard usage APIs
- Alertes coûts

### 5. Déploiement production
- Backend → Render/Railway
- Frontend → Vercel
- BDD → Supabase (déjà configuré)

---

**Besoin d'aide ?** Consultez :
- `VERSION_SUMMARY.md` - Vue d'ensemble
- `MULTI_SOURCE_VIDEO.md` - Guide multi-sources
- `API_CONFIGURATION.md` - Configuration APIs
- `COMMANDS.md` - Toutes les commandes

**Dernière mise à jour** : 28 décembre 2025  
**Version** : 1.2  
**Status** : Backend ✅ | Frontend à mettre à jour 🔧
