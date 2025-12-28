# 🚀 GUIDE DE DÉPLOIEMENT - FAKETECT v2.0

**Date :** 28 décembre 2024  
**Version :** 2.0 (Breaking Changes)

---

## ⚠️ BREAKING CHANGES

Cette version introduit des changements majeurs :
- ❗ Prix modifiés : STANDARD €9.99 (↓ de €12), PROFESSIONAL €29.99 (↓ de €34)
- ❗ Noms de plans : STARTER→STANDARD, PRO→PROFESSIONAL
- ❗ Produits Stripe à recréer
- ❗ Migration base de données requise (script fourni)

---

## 📋 PRÉ-REQUIS

1. **Backup de la base de données**
   ```bash
   # PostgreSQL
   pg_dump faketect > backup-$(date +%Y%m%d).sql
   
   # OU via Prisma
   npx prisma db pull
   ```

2. **Backup Stripe**
   - Exporter la liste des abonnements actifs depuis Stripe Dashboard
   - Noter les IDs des anciens produits (pour rollback si nécessaire)

3. **Vérifier les variables d'environnement**
   ```bash
   # backend/.env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   DATABASE_URL=postgresql://...
   FRONTEND_URL=https://faketect.com
   ```

---

## 🔧 ÉTAPES DE DÉPLOIEMENT

### ÉTAPE 1 : Pull du code

```bash
cd /Users/yacinetirichine/Downloads/faketect
git pull origin main
```

### ÉTAPE 2 : Installer les dépendances

```bash
cd backend
npm install
# node-cron@^3.0.3 sera installé automatiquement
```

### ÉTAPE 3 : Migrer les noms de plans en base de données

```bash
cd backend
node src/scripts/migrate-plans.js
```

**Résultat attendu :**
```
🔄 Migration des noms de plans...

📊 Utilisateurs à migrer :
   - STARTER → STANDARD : 15 utilisateurs
   - PRO → PROFESSIONAL : 8 utilisateurs

✅ STARTER → STANDARD : 15 utilisateurs migrés
✅ PRO → PROFESSIONAL : 8 utilisateurs migrés

✅ Migration terminée avec succès !
```

### ÉTAPE 4 : Recréer les produits Stripe

**⚠️ IMPORTANT :** Cela va créer de NOUVEAUX produits dans Stripe avec les nouveaux prix.

```bash
cd backend

# Supprimer l'ancien fichier de configuration
rm -f stripe-products.json

# Recréer les produits
node src/scripts/setup-stripe.js
```

**Résultat attendu :**
```
🚀 Initializing Stripe products...
📦 Creating product: Standard
✅ Standard created
📦 Creating product: Professional
✅ Professional created
📦 Creating product: Business
✅ Business created
📦 Creating product: Enterprise
✅ Enterprise created
✅ Stripe products initialized and saved
```

**📝 Noter les nouveaux Price IDs :**
Le fichier `stripe-products.json` contiendra :
```json
{
  "STANDARD": {
    "productId": "prod_xxx",
    "monthlyPriceId": "price_xxx",
    "yearlyPriceId": "price_xxx"
  },
  ...
}
```

### ÉTAPE 5 : Mettre à jour les webhooks Stripe

1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer sur le webhook existant (ou créer si n'existe pas)
3. Vérifier que ces événements sont cochés :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed` ← **NOUVEAU**
4. Copier le `Signing secret` et le mettre dans `STRIPE_WEBHOOK_SECRET`

### ÉTAPE 6 : Tester en local

```bash
cd backend
npm start
```

**Vérifier les logs :**
```
🚀 FakeTect API: http://localhost:3001
✅ Database connected successfully
✅ Stripe products already configured
✅ Cron de nettoyage initialisé (tous les jours à 3h)
```

### ÉTAPE 7 : Tester le checkout

```bash
cd frontend
npm run dev
```

1. Aller sur http://localhost:5173/pricing
2. Vérifier les prix affichés : €9.99, €29.99, €89
3. Tester un checkout (mode test Stripe)
4. Vérifier que la page de paiement Stripe affiche le bon prix
5. Compléter le paiement avec une carte test : `4242 4242 4242 4242`
6. Vérifier que le webhook est reçu et le plan mis à jour

### ÉTAPE 8 : Tester les limites

**FREE (3/jour, 90/mois) :**
```bash
# Créer un compte FREE
# Faire 3 analyses → OK
# Faire 4ème analyse → Erreur "Limite quotidienne atteinte"
```

**STANDARD (10/jour, 100/mois) :**
```bash
# Souscrire à STANDARD
# Faire 10 analyses → OK
# Faire 11ème analyse → Erreur "Limite quotidienne atteinte"
```

### ÉTAPE 9 : Tester le cleanup (optionnel)

```bash
# En tant qu'admin
curl -X POST http://localhost:3001/api/admin/cleanup \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 🌐 DÉPLOIEMENT EN PRODUCTION

### Backend (Render / Heroku / VPS)

**Render :**
```bash
# Push sur GitHub (déjà fait)
# Render détectera automatiquement et redéploiera
# Vérifier les logs :
# 1. Migration des plans
# 2. Recréation produits Stripe
# 3. Initialisation du cron
```

**Variables d'environnement à vérifier :**
- `NODE_ENV=production`
- `STRIPE_SECRET_KEY=sk_live_...` (mode LIVE, pas test)
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `DATABASE_URL=postgresql://...`
- `FRONTEND_URL=https://faketect.com`

### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

**OU** via push GitHub (si connecté à Vercel)

---

## 🔍 VÉRIFICATIONS POST-DÉPLOIEMENT

### Checklist complète

- [ ] **Backend démarré sans erreur**
  ```bash
  # Vérifier les logs de production
  # Rechercher : "✅ Stripe products already configured"
  # Rechercher : "✅ Cron de nettoyage initialisé"
  ```

- [ ] **Migration des plans effectuée**
  ```sql
  -- Vérifier en base qu'il n'y a plus de STARTER/PRO
  SELECT plan, COUNT(*) FROM "User" GROUP BY plan;
  -- Résultat attendu : STANDARD, PROFESSIONAL, BUSINESS, ENTERPRISE, FREE
  ```

- [ ] **Produits Stripe créés**
  - Aller sur https://dashboard.stripe.com/products
  - Vérifier 4 produits : Standard, Professional, Business, Enterprise
  - Vérifier les prix : €9.99, €29.99, €89, €249

- [ ] **Webhooks Stripe fonctionnels**
  - Tester un checkout en production
  - Vérifier dans Stripe Dashboard > Webhooks > Événements récents
  - Status devrait être "succeeded"

- [ ] **Checkout fonctionnel**
  - Aller sur https://faketect.com/pricing
  - Vérifier les prix affichés
  - Tester un checkout complet
  - Vérifier email de confirmation

- [ ] **Limites quotidiennes actives**
  - Créer compte FREE
  - Faire 3 analyses → OK
  - Faire 4ème → Erreur 429

- [ ] **Cookie banner affiché**
  - Ouvrir en navigation privée
  - Vérifier que le banner s'affiche
  - Tester "Personnaliser"
  - Vérifier localStorage après acceptation

- [ ] **Pages légales accessibles**
  - https://faketect.com/legal/privacy
  - https://faketect.com/legal/cookies
  - https://faketect.com/legal/terms
  - https://faketect.com/legal/sales
  - https://faketect.com/legal/mentions

- [ ] **Cron cleanup actif**
  - Attendre le lendemain 3h
  - Vérifier les logs : "🧹 Nettoyage des analyses..."
  - OU tester manuellement : POST /api/admin/cleanup

---

## 🔄 MIGRATION DES ABONNEMENTS EXISTANTS

**⚠️ IMPORTANT :** Les utilisateurs avec abonnements actifs sur les ANCIENS produits Stripe.

### Option A : Migration manuelle (Recommandée)

Pour chaque client avec abonnement actif :

1. **Identifier les abonnements STARTER/PRO**
   ```sql
   SELECT id, email, plan, stripeSubscriptionId 
   FROM "User" 
   WHERE plan IN ('STANDARD', 'PROFESSIONAL') 
   AND stripeSubscriptionId IS NOT NULL;
   ```

2. **Migrer l'abonnement dans Stripe**
   - Aller dans Stripe Dashboard > Abonnements
   - Pour chaque abonnement :
     - Cliquer sur "Update subscription"
     - Remplacer l'ancien produit par le nouveau
     - Cocher "Prorate" pour ajuster le prix immédiatement
     - OU cocher "Apply at next renewal" pour changer à la prochaine échéance

3. **Vérifier la synchronisation**
   - Le webhook `customer.subscription.updated` mettra à jour automatiquement

### Option B : Migration automatique (Avancée)

Créer un script qui :
1. Liste tous les abonnements Stripe actifs
2. Met à jour chaque subscription avec les nouveaux Price IDs
3. Log les changements

**⚠️ À faire avec précaution en production !**

---

## 🆘 ROLLBACK EN CAS DE PROBLÈME

Si un problème majeur est détecté après déploiement :

### 1. Rollback du code

```bash
git revert HEAD
git push origin main
```

### 2. Rollback de la base de données

```bash
# Restaurer le backup
psql faketect < backup-YYYYMMDD.sql
```

### 3. Rollback Stripe

- Les anciens produits sont toujours dans Stripe
- Modifier `stripe-products.json` pour pointer vers les anciens Price IDs
- Redémarrer le backend

### 4. Communication clients

Si des clients ont été affectés :
- Email d'excuses
- Remboursement si facturation incorrecte
- Offrir 1 mois gratuit en compensation

---

## 📊 MONITORING POST-DÉPLOIEMENT

### Métriques à surveiller (première semaine)

1. **Taux d'erreur checkout**
   - Objectif : < 1%
   - Alertes si > 5%

2. **Webhooks Stripe**
   - Objectif : 100% success
   - Investiguer si failures > 1%

3. **Limites quotidiennes**
   - Vérifier logs des erreurs 429
   - S'assurer que ce sont des vrais blocages (pas des bugs)

4. **Cron cleanup**
   - Vérifier logs quotidiens à 3h
   - Vérifier taille du dossier `uploads/`

5. **Revenus MRR**
   - Comparer avant/après
   - Impact de la baisse de prix (€12→€9.99)

---

## 📞 CONTACTS EN CAS D'URGENCE

- **Backend errors :** Vérifier logs Render/Heroku
- **Stripe issues :** https://support.stripe.com
- **Base de données :** Vérifier logs Supabase/Render
- **Frontend errors :** Vérifier Vercel logs

---

## ✅ DÉPLOIEMENT RÉUSSI SI...

- ✅ Aucune erreur 500 dans les logs backend
- ✅ Checkout fonctionne avec les nouveaux prix
- ✅ Webhooks Stripe tous en "succeeded"
- ✅ Pages légales accessibles
- ✅ Cookie banner fonctionnel
- ✅ Limites quotidiennes actives
- ✅ Cron cleanup initialisé
- ✅ Aucun client impacté négativement

---

**🎉 Bonne mise en production !**
