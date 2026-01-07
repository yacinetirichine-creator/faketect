# 🚀 Guide de Déploiement Complet - FakeTect

## 📋 Prérequis

- ✅ Code pushé sur GitHub
- ✅ Base de données Neon configurée
- ✅ Compte Vercel (pour le frontend)
- ✅ Compte Render (pour le backend)

---

## 🎯 Option 1 : Déploiement sur Render (Backend) + Vercel (Frontend)

### A. Déploiement du Backend sur Render

#### 1. Créer un nouveau Web Service

1. Allez sur https://dashboard.render.com
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repo GitHub : `yacinetirichine-creator/faketect`
4. Configurez le service :

**Paramètres de base :**
- **Name** : `faketect-api`
- **Region** : `Frankfurt` (ou la plus proche de vous)
- **Branch** : `main`
- **Root Directory** : `backend`
- **Runtime** : `Node`
- **Build Command** : `npm install && npx prisma generate`
- **Start Command** : `node src/index.js`
- **Plan** : `Free` (ou selon vos besoins)

#### 2. Configurer les Variables d'Environnement

Dans **Environment** → **Environment Variables**, ajoutez :

```bash
# Base de données Neon
DATABASE_URL=postgresql://neondb_owner:npg_u3FXImB0TKqa@ep-long-bush-ah4ctmxg-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Secret (générez-en un nouveau sécurisé)
JWT_SECRET=votre-secret-jwt-super-securise-minimum-32-caracteres

# Configuration serveur
NODE_ENV=production
PORT=3001

# Frontend URL (à mettre à jour après déploiement Vercel)
FRONTEND_URL=https://faketect.vercel.app

# Stripe (vos clés de production)
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_STRIPE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET

# APIs optionnelles (pour détection IA)
OPENAI_API_KEY=sk-VOTRE_CLE_OPENAI
SIGHTENGINE_USER=VOTRE_USER
SIGHTENGINE_SECRET=VOTRE_SECRET
ILLUMINARTY_API_KEY=VOTRE_CLE

# Email (optionnel)
EMAIL_USER=contact@faketect.com
EMAIL_PASS=votre-mot-de-passe-app
EMAIL_FROM=no-reply@faketect.com

# Redis Cache (optionnel - Upstash)
REDIS_URL=rediss://default:TOKEN@HOST.upstash.io:6379

# Sentry (optionnel - monitoring)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### 3. Configurer le Health Check

- **Health Check Path** : `/api/health`

#### 4. Déployer

1. Cliquez sur **"Create Web Service"**
2. Attendez que le déploiement se termine (~5-10 min)
3. Votre API sera disponible sur : `https://faketect-api.onrender.com`

#### 5. Migrer la base de données

Une fois déployé, ouvrez le **Shell** Render et exécutez :

```bash
cd backend
npx prisma db push
```

#### 6. Créer votre compte admin

Dans le Shell Render :

```bash
cd backend
node src/scripts/make-admin.js contact@faketect.com
```

---

### B. Déploiement du Frontend sur Vercel

#### 1. Préparer le projet

Vérifiez que `vercel.json` existe à la racine :

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://faketect-api.onrender.com/api/:path*" }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "X-Requested-With, Content-Type, Authorization" }
      ]
    }
  ]
}
```

#### 2. Déployer sur Vercel

**Option A : Via Dashboard Vercel**

1. Allez sur https://vercel.com/new
2. Importez votre repo GitHub : `yacinetirichine-creator/faketect`
3. Configurez le projet :
   - **Framework Preset** : `Vite`
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

4. **Variables d'environnement** (pas nécessaires pour ce projet, tout est en frontend)

5. Cliquez sur **"Deploy"**

**Option B : Via CLI**

```bash
cd /workspaces/faketect/frontend
npm i -g vercel
vercel login
vercel --prod
```

#### 3. Configurer le domaine personnalisé (optionnel)

1. Dans Vercel Dashboard → **Settings** → **Domains**
2. Ajoutez `faketect.com` et `www.faketect.com`
3. Configurez les DNS selon les instructions Vercel

#### 4. Mettre à jour l'URL du backend

Retournez sur **Render** → Variables d'environnement → Modifiez :

```bash
FRONTEND_URL=https://faketect.vercel.app
# ou si domaine personnalisé
FRONTEND_URL=https://faketect.com
```

---

## 🎯 Option 2 : Tout sur Render (Backend + Frontend)

Si vous préférez tout sur Render :

### Backend (même qu'avant)

### Frontend sur Render

1. **New** → **Static Site**
2. Connectez le repo
3. Configurez :
   - **Root Directory** : `frontend`
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `dist`

4. Variables d'environnement :
   ```bash
   VITE_API_URL=https://faketect-api.onrender.com
   ```

---

## 🎯 Option 3 : Tout sur Vercel (avec Serverless Functions)

⚠️ Plus complexe, nécessite de restructurer le backend en serverless functions

---

## ✅ Vérifications Post-Déploiement

### 1. Tester l'API Backend

```bash
curl https://faketect-api.onrender.com/api/health
```

Devrait retourner :
```json
{"status":"ok","database":"connected","timestamp":"..."}
```

### 2. Tester le Frontend

Ouvrez https://faketect.vercel.app (ou votre domaine)

### 3. Tester la connexion

1. Créez un compte de test
2. Connectez-vous
3. Testez une analyse

### 4. Tester le compte admin

Connectez-vous avec : `contact@faketect.com` / `Admin123456`

---

## 🔧 Configuration des Webhooks Stripe (pour les paiements)

### 1. Dans Stripe Dashboard

1. Allez dans **Developers** → **Webhooks**
2. Cliquez sur **"Add endpoint"**
3. URL : `https://faketect-api.onrender.com/api/stripe/webhook`
4. Events à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copiez le **Signing Secret** (whsec_...)
6. Ajoutez-le dans Render :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET
   ```

---

## 🚨 Problèmes Courants

### Backend ne démarre pas
- ✅ Vérifiez les logs Render
- ✅ Vérifiez que DATABASE_URL est correct
- ✅ Exécutez `npx prisma generate` dans le build

### CORS errors
- ✅ Vérifiez FRONTEND_URL dans les variables backend
- ✅ Vérifiez que le proxy fonctionne dans vercel.json

### Database connection failed
- ✅ Vérifiez votre connection string Neon
- ✅ Assurez-vous que `?sslmode=require` est présent
- ✅ Vérifiez que les tables sont créées (`npx prisma db push`)

### Analyses ne fonctionnent pas
- ✅ Vérifiez que les API keys (OpenAI, Illuminarty, Sightengine) sont configurées
- ✅ Vérifiez les logs pour voir quelle API échoue

---

## 📊 Monitoring et Maintenance

### Logs Render
- Dashboard → Service → **Logs**
- Surveillez les erreurs et warnings

### Logs Vercel
- Dashboard → Deployment → **Runtime Logs**

### Base de données Neon
- Console Neon → **Monitoring**
- Vérifiez l'utilisation et les performances

### Sentry (optionnel)
- Configurez Sentry pour tracker les erreurs en production
- Ajoutez SENTRY_DSN dans les variables d'environnement

---

## 🎉 C'est Déployé !

Une fois tout configuré, votre application est en ligne :

- **Frontend** : https://faketect.vercel.app
- **Backend** : https://faketect-api.onrender.com
- **Admin** : contact@faketect.com

Profitez de FakeTect en production ! 🚀
