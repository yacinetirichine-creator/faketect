# 🚀 Guide de démarrage rapide - FakeTect

## ✅ Configuration effectuée

Les fichiers `.env` ont été créés avec vos credentials Supabase :
- ✅ `backend/.env` - Configuration serveur
- ✅ `frontend/.env` - Configuration client
- ✅ `.gitignore` - Fichiers à exclure de Git

## 📦 Installation et lancement

### 1️⃣ Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Résultat attendu** : `🚀 FakeTect API: http://localhost:3001`

### 2️⃣ Frontend (nouveau terminal)

```bash
cd frontend
npm install
npm run dev
```

**Résultat attendu** : `http://localhost:5173`

### 3️⃣ Tester l'application

1. Ouvrir http://localhost:5173
2. Créer un compte (Inscription)
3. Uploader une image pour analyse
4. Voir le résultat (mode démo actif)

## 🔧 Commandes utiles

### Backend
```bash
npx prisma studio          # Interface BDD visuelle
npx prisma migrate dev     # Créer une migration
npm start                  # Production
```

### Frontend
```bash
npm run build              # Build production
npm run preview            # Preview du build
```

## 📊 Accès admin

Pour créer un compte admin :

```bash
cd backend
npx prisma studio
```

Puis modifier un utilisateur :
- `role` : `ADMIN`
- `plan` : `ENTERPRISE`

## 🔗 Git - Sauvegarde sur GitHub

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter le remote
git remote add origin https://github.com/yacinetirichine-creator/faketect.git

# Premier commit
git add .
git commit -m "Initial commit - FakeTect v1.0"

# Push
git branch -M main
git push -u origin main
```

## ⚙️ Configuration Supabase

### Base de données
- URL : `https://ljrwqjaflgtfddcyumqg.supabase.co`
- Les tables seront créées automatiquement via Prisma

### Vérifier la connexion
```bash
cd backend
npx prisma studio
```

## 🔑 APIs optionnelles

### Sightengine (détection IA réelle)
Sans configuration, le mode **démo** est actif (scores aléatoires).

Pour activer la vraie détection :
1. Créer compte : https://sightengine.com
2. Ajouter les clés dans `backend/.env` :
```env
SIGHTENGINE_USER=votre_user
SIGHTENGINE_SECRET=votre_secret
```

### Stripe (paiements)
Pour activer les paiements :
1. Créer compte : https://stripe.com
2. Ajouter la clé dans `backend/.env` :
```env
STRIPE_SECRET_KEY=sk_test_xxx
```

## ❗ Problèmes courants

### Port déjà utilisé
```bash
# Tuer le processus sur port 3001
lsof -ti:3001 | xargs kill -9

# Tuer le processus sur port 5173
lsof -ti:5173 | xargs kill -9
```

### Erreur Prisma
```bash
cd backend
rm -rf node_modules
npm install
npx prisma generate
npx prisma db push
```

### CORS Error
Vérifier que `FRONTEND_URL` dans `backend/.env` = `http://localhost:5173`

## 📱 Fonctionnalités disponibles

✅ Inscription/Connexion  
✅ Analyse d'images (mode démo)  
✅ Historique des analyses  
✅ Multi-langue (FR/EN/ES/DE/IT/PT/AR/ZH/JA)  
✅ Dashboard utilisateur  
✅ Dashboard admin  
✅ Système de plans/quotas  

⚠️ **À implémenter** :
- Paiements Stripe
- Analyse vidéo/PDF
- API publique
- Tests unitaires

## 🎯 Prochaines étapes

1. **Tester l'application** localement
2. **Configurer les APIs** (Sightengine, Stripe)
3. **Déploiement** :
   - Backend : Render/Railway/Fly.io
   - Frontend : Vercel/Netlify
   - BDD : Supabase (déjà configuré)

---

**Besoin d'aide ?** Vérifier les logs dans le terminal !
