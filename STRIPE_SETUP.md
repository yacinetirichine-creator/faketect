# 🎯 Configuration Stripe - Instructions Finales

## ✅ Ce qui est fait

1. ✅ Produits Stripe créés (STARTER, PRO, BUSINESS, ENTERPRISE)
2. ✅ Prix mensuels et annuels configurés
3. ✅ Checkout intégré dans le frontend
4. ✅ Customer Portal pour gérer l'abonnement
5. ✅ Webhook endpoint créé (`/api/stripe/webhook`)

## 🔐 Il reste une dernière étape : Webhook Secret

### Option 1 : Mode Test (développement local)

1. Installer Stripe CLI :
```bash
brew install stripe/stripe-cli/stripe
```

2. Se connecter :
```bash
stripe login
```

3. Forward les webhooks en local :
```bash
stripe listen --forward-to http://localhost:3001/api/stripe/webhook
```

4. Récupérer le webhook secret (commence par `whsec_...`) et l'ajouter dans `backend/.env` :
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Option 2 : Mode Production (Render)

1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer sur "Add endpoint"
3. URL du endpoint : `https://faketect.onrender.com/api/stripe/webhook`
4. Sélectionner les événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copier le **Signing secret** (commence par `whsec_...`)
6. L'ajouter dans les variables d'environnement Render :
   - Nom : `STRIPE_WEBHOOK_SECRET`
   - Valeur : `whsec_xxxxxxxxxxxxx`

## 📋 Variables d'environnement complètes pour Render

Ajouter dans le dashboard Render :

```
STRIPE_SECRET_KEY=[Ta clé secrète Stripe - commence par sk_live_]
STRIPE_WEBHOOK_SECRET=[À RÉCUPÉRER APRÈS CRÉATION DU WEBHOOK]
```

## 📋 Variables d'environnement complètes pour Vercel

Ajouter dans le dashboard Vercel :

```
VITE_API_URL=https://faketect.onrender.com/api
VITE_SUPABASE_URL=https://ljrwqjaflgtfddcyumqg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqcndxamFmbGd0ZmRkY3l1bXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTk0MjUsImV4cCI6MjA4MjQ5NTQyNX0.IVYuiohHgB4eBDILxI5-QzthiJRRqyD4tvIXJy4agXs
VITE_STRIPE_PUBLISHABLE_KEY=[Ta clé publique Stripe - commence par pk_live_]
```

## 🚀 Déploiement

1. **Backend Render** : Ajouter `STRIPE_WEBHOOK_SECRET` dans les variables d'environnement
2. **Frontend Vercel** : Ajouter `VITE_STRIPE_PUBLISHABLE_KEY` (optionnel, utilisé uniquement si tu veux Stripe.js côté client)
3. Redéployer les deux services

## ✅ Test du Checkout

1. Aller sur `/pricing`
2. Cliquer sur "Choose" pour un plan payant
3. Tu seras redirigé vers Stripe Checkout
4. Utiliser une carte de test : `4242 4242 4242 4242` (date future, CVC quelconque)
5. Après paiement, retour automatique sur `/dashboard?success=true`
6. Le plan utilisateur est mis à jour automatiquement via le webhook

## 📊 IDs des produits Stripe (sauvegardés)

Voir le fichier `backend/stripe-products.json` pour les IDs complets.
