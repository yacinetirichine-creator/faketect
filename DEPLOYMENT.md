# 🚀 Guide de déploiement FakeTect

## Architecture de production

```
┌─────────────────────────────────────┐
│  FRONTEND (Vercel)                  │
│  https://faketect.vercel.app        │
│  - React + Vite                     │
│  - Déploiement automatique          │
└──────────────┬──────────────────────┘
               │ API Calls
               ↓
┌─────────────────────────────────────┐
│  BACKEND (Render)                   │
│  https://faketect-api.onrender.com  │
│  - Node.js + Express                │
│  - APIs: Sightengine, Illuminarty   │
└──────────────┬──────────────────────┘
               │ PostgreSQL
               ↓
┌─────────────────────────────────────┐
│  DATABASE (Supabase)                │
│  epftdwmzrjgpghceaqjo.supabase.co   │
│  - PostgreSQL                       │
│  - Row Level Security               │
└─────────────────────────────────────┘
```

---

## 📦 1. Déploiement Backend sur Render

### Étape 1 : Créer le service
1. Va sur https://dashboard.render.com
2. Clique **"New +"** → **"Web Service"**
3. Connecte ton repo GitHub : `yacinetirichine-creator/faketect`
4. Render détectera automatiquement le fichier `render.yaml`

### Étape 2 : Configurer les variables d'environnement
Dans Render Dashboard → Environment :

```bash
# Base de données
DATABASE_URL=postgresql://postgres.epftdwmzrjgpghceaqjo:Milhanou141511@db.epftdwmzrjgpghceaqjo.supabase.co:5432/postgres

# Sightengine
SIGHTENGINE_USER=725554468
SIGHTENGINE_SECRET=ANjA3guRmuJPLcatBTy7oYCgEx2QfFzE

# Illuminarty
ILLUMINARTY_USER=725554468
ILLUMINARTY_SECRET=ANjA3guRmuJPLcatBTy7oYCgEx2QfFzE
ILLUMINARTY_API_KEY=8cMOwBbmiGceQueBPEtI

# OpenAI
OPENAI_API_KEY=sk-proj-G91zV... (ta clé complète)

# Supabase
SUPABASE_URL=https://epftdwmzrjgpghceaqjo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwZnRkd216cmpncGdoY2VhcWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjMxNzIsImV4cCI6MjA4MjQ5OTE3Mn0.ScTWzX68KTcj2SpEPEy4KtEotK-MjlgI45JLMtEBNTA

# Frontend
FRONTEND_URL=https://faketect.vercel.app

# Config
PORT=3001
NODE_ENV=production
```

### Étape 3 : Déployer
- Render déploiera automatiquement
- URL backend : `https://faketect-api.onrender.com`
- Temps de démarrage : ~2 minutes

---

## 🌐 2. Déploiement Frontend sur Vercel

### Étape 1 : Préparer Vercel
1. Va sur https://vercel.com/dashboard
2. Clique **"Add New..."** → **"Project"**
3. Importe depuis GitHub : `yacinetirichine-creator/faketect`

### Étape 2 : Configurer le projet
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Étape 3 : Variables d'environnement
Dans Vercel → Settings → Environment Variables :

```bash
VITE_API_URL=https://faketect-api.onrender.com
```

### Étape 4 : Déployer
- Vercel déploiera automatiquement
- URL frontend : `https://faketect.vercel.app`
- Temps de déploiement : ~1 minute

---

## ⚙️ 3. Configuration Supabase (Déjà fait ✅)

La base de données Supabase est déjà configurée avec :
- ✅ 3 tables : User, Analysis, CreditTransaction
- ✅ RLS policies (sécurité)
- ✅ Fonctions SQL utilitaires
- ✅ Comptes de test créés
- ✅ GitHub integration activée

---

## 🔄 4. Workflow de déploiement automatique

### Chaque push sur GitHub :
1. **Vercel** redéploie automatiquement le frontend
2. **Render** redéploie automatiquement le backend
3. **Supabase** synchronise les migrations SQL

### Pour forcer un redéploiement :
```bash
git add .
git commit -m "Update: description"
git push origin main
```

---

## 🧪 5. Vérification du déploiement

### Backend (Render)
```bash
curl https://faketect-api.onrender.com/api/health
# Réponse attendue: {"status":"ok"}
```

### Frontend (Vercel)
- Ouvre https://faketect.vercel.app
- Teste la connexion avec `test@faketect.com` / `Test123!`

### Base de données (Supabase)
```bash
# Dans Supabase SQL Editor
SELECT COUNT(*) FROM "User";
# Devrait retourner au moins 2 (admin + test)
```

---

## 📊 6. Monitoring et logs

### Render (Backend)
- Logs : https://dashboard.render.com → Ton service → Logs
- Métriques : Dashboard → Metrics

### Vercel (Frontend)
- Logs : https://vercel.com/dashboard → Ton projet → Deployments
- Analytics : Dashboard → Analytics

### Supabase (Database)
- Logs : https://supabase.com/dashboard → Logs → Postgres Logs
- Métriques : Dashboard → Database → Usage

---

## 🔧 7. Mise à jour de la production

### Backend
```bash
# Modifier le code backend
cd backend
# ... modifications ...

# Push
git add .
git commit -m "Update backend: description"
git push

# Render redéploie automatiquement en ~2 min
```

### Frontend
```bash
# Modifier le code frontend
cd frontend
# ... modifications ...

# Push
git add .
git commit -m "Update frontend: description"
git push

# Vercel redéploie automatiquement en ~1 min
```

### Database
```bash
# Créer une migration Supabase
cd backend/supabase_setup
# Créer un nouveau fichier SQL

# Push
git add .
git commit -m "Database migration: description"
git push

# Supabase synchronise automatiquement via GitHub integration
```

---

## 🚨 8. Troubleshooting

### Backend ne démarre pas
- Vérifier les variables d'environnement dans Render
- Regarder les logs : Dashboard → Logs
- Vérifier que `DATABASE_URL` est correcte

### Frontend erreur 404
- Vérifier que `VITE_API_URL` pointe vers Render
- Build en local : `npm run build` pour tester
- Vérifier les logs Vercel

### Erreur de connexion DB
- Vérifier le mot de passe Supabase
- Tester la connexion : `psql "postgresql://postgres:..."`
- Vérifier que Supabase n'est pas en pause

---

## 📈 9. Optimisations futures

### Performance
- [ ] Activer le cache Vercel Edge
- [ ] Optimiser les images (next/image ou vite-imagetools)
- [ ] Activer la compression gzip

### Sécurité
- [ ] Configurer CORS strictement
- [ ] Ajouter rate limiting
- [ ] Activer HTTPS uniquement

### Monitoring
- [ ] Intégrer Sentry pour les erreurs
- [ ] Configurer des alertes Render/Vercel
- [ ] Tableau de bord analytics

---

## 🎯 10. Résumé des URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://faketect.vercel.app | À déployer |
| Backend | https://faketect-api.onrender.com | À déployer |
| Database | db.epftdwmzrjgpghceaqjo.supabase.co | ✅ Configuré |
| GitHub | https://github.com/yacinetirichine-creator/faketect | ✅ Actif |

---

**Dernière mise à jour** : 28 décembre 2025
