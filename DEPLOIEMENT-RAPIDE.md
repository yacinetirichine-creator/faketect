# 🚀 Guide de Déploiement Rapide - FakeTect v2.0.1

## Étape 1: Créer le Repository GitHub

1. Allez sur https://github.com/new
2. Nom du repo: `faketect` (ou autre)
3. Description: "Détecteur d'images IA multi-plateforme - FakeTect v2.0.1"
4. Public ou Private (selon vos besoins)
5. **Ne cochez PAS** "Initialize with README" (le code est déjà prêt)
6. Cliquez sur "Create repository"

## Étape 2: Pousser le Code sur GitHub

### Option A: Avec le script automatique (Recommandé)

```bash
./push-to-github.sh <votre-username>/<nom-du-repo>
```

Exemple:
```bash
./push-to-github.sh yacinetirichine/faketect
```

Le script va:
- ✅ Configurer le remote GitHub
- ✅ Pousser le code sur la branche main
- ✅ Proposer de déployer sur Vercel

### Option B: Manuellement

```bash
# Ajouter le remote GitHub
git remote add origin https://github.com/<username>/<repo>.git

# Pousser le code
git push -u origin main
```

## Étape 3: Déployer sur Vercel

### Option A: Via l'interface web (Plus simple)

1. **Allez sur:** https://vercel.com/new
2. **Importez le repo GitHub** que vous venez de créer
3. **Configuration du projet:**
   ```
   Framework Preset: Vite
   Root Directory: packages/web
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Variables d'environnement** (Settings → Environment Variables):
   ```bash
   VITE_API_URL=https://votre-api-render.com
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...
   ```

5. **Cliquez sur "Deploy"**

### Option B: Via Vercel CLI

```bash
# Installer Vercel CLI (une fois)
npm i -g vercel

# Se déplacer dans le dossier web
cd packages/web

# Déployer
vercel --prod
```

Suivez les instructions interactives.

## Étape 4: Déployer l'API sur Render

### Via l'interface Render

1. **Allez sur:** https://render.com
2. **New → Web Service**
3. **Connectez votre repo GitHub**
4. **Configuration:**
   ```
   Name: faketect-api
   Environment: Docker
   Branch: main
   Dockerfile Path: packages/api/Dockerfile
   ```

5. **Variables d'environnement** (depuis `packages/api/.env.example`):
   ```bash
   NODE_ENV=production
   PORT=3001
   
   # Supabase
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_KEY=eyJxxx...
   
   # Providers
   SIGHTENGINE_USER=xxx
   SIGHTENGINE_SECRET=xxx
   ILLUMINARTY_API_KEY=xxx
   
   # Stripe (si activé)
   STRIPE_SECRET_KEY=sk_xxx
   
   # Sécurité
   ALLOWED_ORIGINS=https://votre-app.vercel.app
   ADMIN_METRICS_TOKEN=votre-token-secret-fort
   
   # Limites
   AI_DECISION_THRESHOLD=0.7
   GUEST_DAILY_LIMIT=3
   VIDEO_DAILY_LIMIT=15
   ```

6. **Cliquez sur "Create Web Service"**

### Via render.yaml (Automatique)

Le fichier `render.yaml` est déjà configuré. Render le détectera automatiquement.

## Étape 5: Connecter Frontend ↔ Backend

1. **Une fois l'API déployée sur Render**, copiez l'URL (ex: `https://faketect-api.onrender.com`)

2. **Mettez à jour Vercel:**
   - Allez dans Settings → Environment Variables
   - Mettez à jour `VITE_API_URL` avec l'URL Render
   - Redéployez (Deployments → ... → Redeploy)

## Étape 6: Configuration Supabase

### 1. Créer les tables

Exécutez les scripts SQL dans l'ordre:
1. `docs/supabase-schema.sql` - Tables principales
2. `docs/supabase-billing-schema.sql` - Facturation
3. `docs/supabase-certification.sql` - Certificats

### 2. Configurer l'authentification

Dans Supabase Dashboard → Authentication:
- Activez Email/Password
- Ajoutez votre domaine Vercel dans "Redirect URLs"

### 3. Récupérer les clés

- `SUPABASE_URL`: Settings → API → Project URL
- `SUPABASE_ANON_KEY`: Settings → API → anon public
- `SUPABASE_SERVICE_KEY`: Settings → API → service_role (⚠️ secret)

## Étape 7: Vérification Post-Déploiement

### Frontend (Vercel)

```bash
# Tester la page d'accueil
curl https://votre-app.vercel.app

# Vérifier qu'elle charge
# → Devrait retourner du HTML
```

### Backend (Render)

```bash
# Tester le health check
curl https://faketect-api.onrender.com/api/health

# Devrait retourner:
{
  "status": "ok",
  "version": "2.0.1",
  "services": {...},
  "metrics": {...}
}
```

### Métriques (avec token)

```bash
curl -H "X-Admin-Token: votre-token" \
  https://faketect-api.onrender.com/api/metrics
```

## Étape 8: Stripe (Optionnel - Facturation)

Si vous activez les paiements:

1. **Créer un compte Stripe:** https://stripe.com
2. **Récupérer les clés:**
   - `STRIPE_SECRET_KEY`: Dashboard → API Keys
   - `STRIPE_PUBLISHABLE_KEY`: Dashboard → API Keys

3. **Configurer les webhooks:**
   ```bash
   cd packages/api
   node scripts/setup-stripe-webhooks.js
   ```

4. **Créer les produits:**
   ```bash
   node scripts/setup-stripe-products.js
   ```

## 🎯 Checklist Finale

- [ ] ✅ Code poussé sur GitHub
- [ ] ✅ Frontend déployé sur Vercel
- [ ] ✅ API déployée sur Render
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ Supabase tables créées
- [ ] ✅ CORS configuré (ALLOWED_ORIGINS)
- [ ] ✅ Health check répond correctement
- [ ] ✅ Test d'une analyse d'image
- [ ] ✅ Authentification fonctionne
- [ ] ⬜ Stripe configuré (si nécessaire)
- [ ] ⬜ Monitoring externe configuré (Sentry, etc.)

## 🔧 Commandes Utiles

### Mettre à jour le code

```bash
# Après modifications locales
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# Auto-redéploiement sur Vercel et Render
```

### Voir les logs

**Vercel:**
- Dashboard → Votre projet → Deployments → View Function Logs

**Render:**
- Dashboard → Votre service → Logs

### Variables d'environnement

**Vercel:**
```bash
vercel env pull  # Télécharger localement
vercel env add   # Ajouter une variable
```

**Render:**
- Via l'interface web uniquement

## 📞 Dépannage

### Problème: "CORS non autorisé"
**Solution:** Vérifiez `ALLOWED_ORIGINS` sur Render contient l'URL Vercel

### Problème: "Service quota indisponible"
**Solution:** Vérifiez les clés Supabase et la connexion

### Problème: "Stripe non configuré"
**Solution:** Normal si vous n'avez pas activé les paiements

### Problème: Build Vercel échoue
**Solution:** 
```bash
cd packages/web
npm install
npm run build  # Tester localement
```

## 🚀 URLs Utiles

- **GitHub:** https://github.com/new
- **Vercel:** https://vercel.com/new
- **Render:** https://render.com
- **Supabase:** https://supabase.com
- **Stripe:** https://stripe.com

## 📚 Documentation Complète

- **API:** `docs/API.md`
- **Billing:** `docs/BILLING-SYSTEM.md`
- **Déploiement:** `docs/DEPLOYMENT.md`
- **Améliorations:** `AMELIORATIONS.md`

---

**🎉 Félicitations !** Votre application FakeTect v2.0.1 est maintenant déployée !
