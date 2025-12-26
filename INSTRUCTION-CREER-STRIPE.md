# 🚀 CRÉER LES PRODUITS STRIPE - Guide Exécution

**Status:** ✅ Script créé et prêt

---

## 📋 Ce qu'il faut faire

Le script `packages/api/scripts/create-new-pricing.js` va créer les 7 produits Stripe automatiquement.

### Étape 1: Vérifier votre clé Stripe

```bash
# Aller sur: https://dashboard.stripe.com/apikeys
# Copier la clé LIVE (commence par sk_live_)
# Elle est confidentielle - ne pas la partager!
```

### Étape 2: Exécuter le script

```bash
# Terminal 1: Ajouter la clé
export STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE

# Terminal 2: Exécuter le script
cd packages/api
node scripts/create-new-pricing.js
```

### Étape 3: Copier les Price IDs

Le script va afficher:

```
📋 À AJOUTER DANS VOS FICHIERS .env:

# Frontend (packages/web/.env)
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_1Sg8XX...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_1Sg8XX...
...

# Backend (packages/api/.env)
STRIPE_PRICE_STARTER_MONTHLY=price_1Sg8XX...
...
```

**Copier EXACTEMENT ce qui est affiché dans les deux `.env`**

### Étape 4: Vérifier dans Stripe Dashboard

```
https://dashboard.stripe.com/products
```

Vous devriez voir les 7 nouveaux produits ✅

### Étape 5: Redéployer

```bash
git add .
git commit -m "feat: Ajouter price IDs des nouveaux plans Stripe"
git push origin main
```

---

## 🎯 Ce que le script crée

```
1. Starter - Mensuel      (12€)
2. Pro - Mensuel          (34€)
3. Business - Mensuel     (89€)
4. Enterprise - Mensuel   (249€)
5. Starter - Annuel       (99€)
6. Pro - Annuel           (290€)
7. Business - Annuel      (790€)
```

---

## ⚠️ Important

- **Ne pas commiter la clé Stripe** dans git
- La clé ne s'ajoute que en `export STRIPE_SECRET_KEY=...` en terminal
- Les Price IDs (price_...) sont sûrs à commiter ✅

---

## ❓ Questions Fréquentes

**Q: Où trouver ma clé Stripe?**
A: https://dashboard.stripe.com/apikeys (onglet "Live" - clé secrète)

**Q: Je vois "Invalid API Key"**
A: Vérifier que la clé commence par `sk_live_` (pas `pk_live_`)

**Q: Les produits existent déjà**
A: C'est OK - Stripe va créer les nouveaux avec des IDs différents

**Q: Combien de temps?**
A: ~5-10 secondes pour créer les 7 produits

---

## 📝 Exemple Complet

```bash
# Terminal
$ export STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
$ cd /workspaces/faketect/packages/api
$ node scripts/create-new-pricing.js

# Output:
🚀 Création des 7 produits Stripe pour les nouveaux plans...

📦 Création: FakeTect Starter - Mensuel...
   ✅ Produit: prod_XXXXXX
   ✅ Price ID: price_1Sg8YYYYYY

... (6 autres produits) ...

✅ TOUS LES PRODUITS ONT ÉTÉ CRÉÉS AVEC SUCCÈS !

📋 À AJOUTER DANS VOS FICHIERS .env:

# Frontend (packages/web/.env)
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_1Sg8YYYYYY
...
```

---

## 🔒 Sécurité

- La clé Stripe reste en variable d'environnement (pas dans git)
- Les Price IDs sont publics (safe à commiter)
- Après l'exécution, la clé est oubliée

