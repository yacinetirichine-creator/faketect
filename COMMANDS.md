# ⚡ Commandes rapides - FakeTect

## 🚀 Démarrage rapide

```bash
# Terminal 1 - Backend
cd backend && npm install && npx prisma generate && npx prisma db push && npm run dev

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

**Accès** : http://localhost:5173

---

## 📦 Installation

### Backend
```bash
cd backend
npm install                      # Installer les dépendances
npx prisma generate             # Générer le client Prisma
npx prisma db push              # Créer les tables Supabase
npm run dev                     # Lancer en mode développement
npm start                       # Lancer en production
```

### Frontend
```bash
cd frontend
npm install                     # Installer les dépendances
npm run dev                     # Lancer en mode développement
npm run build                   # Build pour production
npm run preview                 # Preview du build
```

---

## 🗄️ Base de données

### Prisma
```bash
cd backend

npx prisma studio               # Interface visuelle (localhost:5555)
npx prisma generate             # Régénérer le client après modif schema
npx prisma db push              # Synchroniser le schéma avec la BDD
npx prisma migrate dev          # Créer une migration (production)
npx prisma migrate reset        # ⚠️ Reset complet de la BDD
npx prisma db seed              # Peupler avec données de test
```

### Supabase
```bash
# Via dashboard : https://ljrwqjaflgtfddcyumqg.supabase.co

# Ou via CLI
npx supabase login
npx supabase link --project-ref ljrwqjaflgtfddcyumqg
npx supabase db push
npx supabase db dump > backup.sql
```

---

## 🔧 Git & GitHub

### Premier push
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yacinetirichine-creator/faketect.git
git push -u origin main
```

### Workflow quotidien
```bash
git status                      # Voir les modifications
git add .                       # Ajouter tous les fichiers
git commit -m "Description"     # Commit avec message
git push                        # Pousser vers GitHub

git pull                        # Récupérer les changements
git log --oneline               # Voir l'historique
```

### Branches
```bash
git checkout -b feature/nom     # Créer une branche
git checkout main               # Retourner sur main
git merge feature/nom           # Fusionner la branche
git branch -d feature/nom       # Supprimer la branche
```

---

## 🧪 Tests (à implémenter)

### Backend
```bash
cd backend
npm install --save-dev jest supertest
npx jest                        # Lancer tous les tests
npx jest --watch                # Mode watch
npx jest --coverage             # Avec couverture
```

### Frontend
```bash
cd frontend
npm install --save-dev vitest @testing-library/react
npx vitest                      # Lancer les tests
npx vitest run                  # Une seule fois
npx vitest --coverage           # Avec couverture
```

---

## 🐛 Debugging

### Backend
```bash
cd backend

# Logs détaillés
DEBUG=* npm run dev

# Node inspector
node --inspect src/index.js

# Tester les routes
curl http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Frontend
```bash
cd frontend

# Vite avec logs
npm run dev -- --debug

# Analyser le bundle
npm run build -- --mode analyze
```

---

## 🔒 Sécurité

### Générer un secret JWT fort
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Vérifier les vulnérabilités
```bash
cd backend
npm audit                       # Voir les vulnérabilités
npm audit fix                   # Corriger automatiquement
npm audit fix --force           # Force les corrections

cd ../frontend
npm audit
npm audit fix
```

### Mettre à jour les dépendances
```bash
npm outdated                    # Voir les packages obsolètes
npm update                      # Mettre à jour (minor/patch)
npx npm-check-updates -u        # Mettre à jour (major)
npm install
```

---

## 🚀 Déploiement

### Backend (Render/Railway)
```bash
# Render
render.yaml déjà configuré (si existant)
# Ou via dashboard Render

# Railway
railway login
railway init
railway up
railway open
```

### Frontend (Vercel)
```bash
npm install -g vercel
cd frontend
vercel login
vercel                          # Deploy preview
vercel --prod                   # Deploy production
```

### Variables d'environnement
```bash
# Render/Railway backend
DATABASE_URL=...
JWT_SECRET=...
FRONTEND_URL=https://faketect.vercel.app

# Vercel frontend
VITE_API_URL=https://faketect-backend.onrender.com/api
```

---

## 📊 Monitoring

### Logs backend
```bash
cd backend

# Logs en temps réel
tail -f logs/combined.log
tail -f logs/error.log

# Rechercher dans les logs
grep "ERROR" logs/combined.log
grep -i "user.*login" logs/combined.log
```

### Analyser les performances
```bash
# Backend
npm install -g clinic
clinic doctor -- node src/index.js

# Frontend
npm run build
npx vite-bundle-visualizer
```

---

## 🧹 Nettoyage

### Supprimer les fichiers temporaires
```bash
# Backend
cd backend
rm -rf node_modules
rm -rf uploads/*
rm -rf logs/*
npm install

# Frontend
cd frontend
rm -rf node_modules
rm -rf dist
rm -rf .vite
npm install

# Git
git clean -fdx                  # ⚠️ Supprimer tous les fichiers non trackés
```

### Réinitialiser la BDD
```bash
cd backend
npx prisma migrate reset        # ⚠️ Supprime toutes les données
npx prisma db push
```

---

## 🔥 Résolution de problèmes

### Port déjà utilisé
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9   # Backend
lsof -ti:5173 | xargs kill -9   # Frontend

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Erreur Prisma
```bash
cd backend
rm -rf node_modules
rm -rf prisma/migrations
npm install
npx prisma generate
npx prisma db push
```

### Erreur CORS
```javascript
// backend/src/index.js
// Vérifier que FRONTEND_URL dans .env correspond à l'URL frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Module not found
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentation

### Générer la doc API (Swagger)
```bash
cd backend
npm install swagger-jsdoc swagger-ui-express
# Ajouter les annotations @swagger dans les routes
# Accéder à http://localhost:3001/api-docs
```

### Générer la doc code (JSDoc)
```bash
npm install -g jsdoc
jsdoc -c jsdoc.json -r src
```

---

## 🎯 Scripts utiles

### Backend - package.json
```json
{
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "node prisma/seed.js",
    "lint": "eslint src",
    "format": "prettier --write src"
  }
}
```

### Frontend - package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src",
    "format": "prettier --write src"
  }
}
```

---

## 📞 Support

**GitHub** : https://github.com/yacinetirichine-creator/faketect  
**Issues** : https://github.com/yacinetirichine-creator/faketect/issues  
**Docs** : Voir README.md, QUICKSTART.md, TECHNICAL_ANALYSIS.md

---

**Dernière mise à jour** : 28 décembre 2025
