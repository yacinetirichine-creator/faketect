# Guide de déploiement Frontend - Faketect

## 🚀 Déploiement sur Vercel

### 1. Préparer le projet

```bash
cd packages/web
npm install
npm run build  # Tester le build localement
```

### 2. Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Inscrivez-vous avec votre compte GitHub
3. Connectez votre repository GitHub

### 3. Déployer via Vercel Dashboard

#### Option A: Via l'interface web

1. Cliquez sur "Add New Project"
2. Importez votre repository `faketect`
3. Configurez le projet :
   - **Framework Preset**: Vite
   - **Root Directory**: `packages/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Ajoutez les variables d'environnement :

```
VITE_API_URL=https://faketect-api.onrender.com
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
VITE_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
VITE_STRIPE_PRICE_PRO_MONTHLY=price_1Sg8XQIaJ0g5yYYSamQOtFMN
VITE_STRIPE_PRICE_PRO_YEARLY=price_1Sg8XRIaJ0g5yYYSd6vl56w1
VITE_STRIPE_PRICE_PACK_STARTER=price_1Sg8XRIaJ0g5yYYSEyqrYk9K
VITE_STRIPE_PRICE_PACK_STANDARD=price_1Sg8XSIaJ0g5yYYSwvy81Lfa
VITE_STRIPE_PRICE_PACK_PREMIUM=price_1Sg8XTIaJ0g5yYYS32SNlb5T
```

5. Cliquez sur "Deploy"

#### Option B: Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer depuis le dossier web
cd packages/web
vercel

# Suivre les instructions :
# - Set up and deploy? Yes
# - Which scope? Votre compte
# - Link to existing project? No
# - Project name? faketect-web
# - In which directory is your code located? ./
# - Want to override the settings? Yes
#   - Build Command: npm run build
#   - Output Directory: dist
#   - Development Command: npm run dev

# Ajouter les variables d'environnement
vercel env add VITE_API_URL
# Entrer: https://faketect-api.onrender.com

vercel env add VITE_SUPABASE_URL
# Entrer votre URL Supabase

vercel env add VITE_SUPABASE_ANON_KEY
# Entrer votre clé Supabase

vercel env add VITE_STRIPE_PUBLISHABLE_KEY
# Entrer: <your_stripe_publishable_key>

vercel env add VITE_STRIPE_PRICE_PRO_MONTHLY
# Entrer: price_1Sg8XQIaJ0g5yYYSamQOtFMN

vercel env add VITE_STRIPE_PRICE_PRO_YEARLY
# Entrer: price_1Sg8XRIaJ0g5yYYSd6vl56w1

vercel env add VITE_STRIPE_PRICE_PACK_STARTER
# Entrer: price_1Sg8XRIaJ0g5yYYSEyqrYk9K

vercel env add VITE_STRIPE_PRICE_PACK_STANDARD
# Entrer: price_1Sg8XSIaJ0g5yYYSwvy81Lfa

vercel env add VITE_STRIPE_PRICE_PACK_PREMIUM
# Entrer: price_1Sg8XTIaJ0g5yYYS32SNlb5T

# Redéployer avec les nouvelles variables
vercel --prod
```

### 4. Configurer le domaine personnalisé (Optionnel)

1. Dans Vercel Dashboard → Settings → Domains
2. Ajoutez votre domaine (ex: faketect.com)
3. Configurez les DNS selon les instructions Vercel
4. Attendez la propagation DNS (quelques minutes à 24h)

### 5. Vérifier le déploiement

Une fois déployé, testez :

1. **Page d'accueil** : `https://votre-app.vercel.app/`
2. **Page d'analyse** : `https://votre-app.vercel.app/app`
3. **Page pricing** : `https://votre-app.vercel.app/pricing`
4. **Authentification** : Testez login/signup
5. **Quota** : Vérifiez l'affichage du quota dans le header
6. **Paiement** : Testez la création d'une session Stripe

### 6. Configuration post-déploiement

#### A. Mettre à jour Supabase

Dans Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://votre-app.vercel.app`
- **Redirect URLs**: Ajouter `https://votre-app.vercel.app/auth/callback`

#### B. Mettre à jour Stripe

Dans Stripe Dashboard → Settings → Branding:
- Ajouter votre URL de production

#### C. Mettre à jour l'API Backend

Ajoutez `https://votre-app.vercel.app` aux CORS autorisés dans votre API Render.

---

## 🔧 Débogage

### Build échoue

```bash
# Vérifier les erreurs localement
cd packages/web
npm run build

# Vérifier les dépendances
npm install
```

### Variables d'environnement manquantes

```bash
# Lister les variables Vercel
vercel env ls

# Vérifier dans le build
vercel logs
```

### Erreurs CORS

Vérifiez que votre API backend autorise l'origine Vercel dans les CORS.

---

## 📊 Performance & Monitoring

### Analytics Vercel

Activez dans Dashboard → Analytics pour suivre :
- Temps de chargement
- Core Web Vitals
- Erreurs frontend

### Logs

```bash
# Voir les logs en temps réel
vercel logs --follow

# Logs d'une fonction spécifique
vercel logs [deployment-url]
```

---

## 🔄 Déploiement continu

Vercel redéploie automatiquement à chaque push sur `main`. Pour désactiver :

1. Dashboard → Settings → Git
2. Décochez "Auto-deploy"

Pour déployer une branche spécifique :
```bash
vercel --prod
```

---

## 🎯 Checklist finale

- [ ] Build local réussi
- [ ] Variables d'environnement configurées
- [ ] Déploiement Vercel réussi
- [ ] URLs Supabase mises à jour
- [ ] CORS API configurés
- [ ] Domaine personnalisé (si applicable)
- [ ] Test de toutes les fonctionnalités :
  - [ ] Authentification
  - [ ] Analyses (image, video, batch, document, URL)
  - [ ] Affichage quota
  - [ ] Page pricing
  - [ ] Checkout Stripe
  - [ ] Historique
  - [ ] Factures
- [ ] Analytics activés
- [ ] Monitoring configuré

---

## 🆘 Support

En cas de problème :
1. Vérifiez les logs Vercel
2. Vérifiez la console navigateur (F12)
3. Vérifiez les logs API Render
4. Testez en local d'abord

**Commandes utiles :**

```bash
# Tester le build local
npm run build && npm run preview

# Vérifier les variables
cat .env.production

# Logs Vercel
vercel logs

# Status du déploiement
vercel ls
```
