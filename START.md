# 🎉 DÉMARRAGE RAPIDE - 2 minutes

## ⚡ Option 1 : Script automatique (recommandé)

```bash
./start-all.sh
```

✅ Lance backend + frontend automatiquement  
✅ Ouvre le navigateur sur http://localhost:5173  
✅ Logs dans `logs/backend.log` et `logs/frontend.log`

Pour arrêter : `Ctrl+C`

---

## 🔧 Option 2 : Manuel (2 terminaux)

### Terminal 1 - Backend
```bash
cd backend
node src/index.js
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Puis ouvrir : http://localhost:5173

---

## 🧪 Test rapide

1. **Créer un compte** : http://localhost:5173/register
2. **Se connecter**
3. **Uploader une image**
4. **Voir le résultat** avec :
   - Score IA (0-100%)
   - Consensus de 2 APIs (Illuminarty + Sightengine)
   - Verdict coloré

---

## ⚠️ Si ça ne fonctionne pas

### Ports déjà utilisés
```bash
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Réinstaller les dépendances
```bash
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Erreur Supabase
**C'est normal !** Le backend fonctionne en mode démo si Supabase n'est pas configuré.

Pour configurer :
1. Aller sur https://supabase.com/dashboard/project/ljrwqjaflgtfddcyumqg
2. Récupérer le mot de passe PostgreSQL
3. Modifier `backend/.env` ligne 2

---

## 📚 Documentation complète

- `NEXT_STEPS.md` - Guide détaillé étape par étape
- `MULTI_SOURCE_VIDEO.md` - Fonctionnalités vidéo
- `API_CONFIGURATION.md` - Configuration des APIs
- `VERSION_SUMMARY.md` - Vue d'ensemble

---

**Version** : 1.2  
**Status** : ✅ Prêt à tester !
