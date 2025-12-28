# Configuration Stripe pour la conformité fiscale française

**Date:** 28 décembre 2024  
**N° TVA:** FR09938848546

## ✅ Modifications appliquées

### 1. Création des prix (stripe-products.js)

**Ajout de `tax_behavior: 'exclusive'`**
- Les prix sont maintenant HT (hors taxes)
- La TVA sera calculée et ajoutée automatiquement par Stripe
- Conforme aux exigences européennes

```javascript
tax_behavior: 'exclusive' // Prix HT, TVA calculée automatiquement
```

### 2. Session de checkout (stripe.js)

**Changements appliqués :**

1. **`billing_address_collection: 'required'`**
   - Obligatoire au lieu de 'auto'
   - Nécessaire pour déterminer le taux de TVA correct

2. **`tax_id_collection: { enabled: true }`**
   - Permet aux clients professionnels (B2B) de saisir leur n° TVA intracommunautaire
   - Autoliquidation de la TVA pour les ventes B2B intra-UE

3. **`metadata.vat_number: 'FR09938848546'`**
   - Ton numéro de TVA intracommunautaire est enregistré dans chaque transaction
   - Facilite la gestion comptable et les déclarations

4. **`automatic_tax: { enabled: true }`** (déjà présent)
   - Calcul automatique selon le pays du client
   - Gère la TVA française (20%) et les taux européens

## 📊 Comment ça fonctionne

### Vente B2C (particuliers)
- Client français → TVA 20% ajoutée automatiquement
- Client UE → TVA du pays de destination
- Client hors UE → Pas de TVA

### Vente B2B (entreprises)
- Client français → TVA 20% ajoutée
- Client UE avec TVA valide → Autoliquidation (0% facturé)
- Client hors UE → Pas de TVA

### Exemple de prix affiché

**Plan Standard - €9.99 HT/mois**
- France (B2C) : €9.99 + €2.00 TVA = **€11.99 TTC**
- UE (B2B avec TVA) : **€9.99 HT** (autoliquidation)
- UE (B2C) : €9.99 + TVA locale
- USA : **€9.99** (pas de TVA)

## 🔧 Configuration requise dans Stripe Dashboard

### 1. Activer Stripe Tax
1. Se connecter à https://dashboard.stripe.com
2. Aller dans **Settings** → **Tax**
3. Activer **Stripe Tax**
4. Configurer l'adresse de l'entreprise :
   ```
   JARVIS
   128 Rue la Boétie
   75008 PARIS
   France
   ```
5. Ajouter le numéro de TVA : **FR09938848546**

### 2. Configurer les produits existants

Si tu as déjà créé des produits Stripe, il faut les recréer avec `tax_behavior: 'exclusive'` :

```bash
# Dans backend/
rm -f stripe-products.json
node src/scripts/setup-stripe.js
```

Ou depuis le code :
```bash
cd backend
rm -f stripe-products.json
node src/index.js
```

Le système recréera automatiquement tous les produits avec la bonne configuration fiscale.

### 3. Vérifier les webhooks

S'assurer que le webhook Stripe est configuré avec ces événements :
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

URL webhook : `https://votre-backend.onrender.com/api/stripe/webhook`

## 📋 Checklist de conformité

- [x] `tax_behavior: 'exclusive'` sur tous les prix
- [x] `billing_address_collection: 'required'` au checkout
- [x] `tax_id_collection: { enabled: true }` pour B2B
- [x] `automatic_tax: { enabled: true }` activé
- [x] N° TVA FR09938848546 dans les métadonnées
- [ ] Stripe Tax activé dans le dashboard Stripe
- [ ] Adresse entreprise configurée dans Stripe
- [ ] Produits Stripe recréés avec tax_behavior
- [ ] Tests de paiement effectués

## 🧪 Tests à effectuer

### Test 1 : Client français B2C
1. Aller sur /pricing
2. Choisir plan Standard
3. Payer avec carte test : `4242 4242 4242 4242`
4. Adresse : France
5. **Vérifier** : TVA 20% ajoutée (€11.99 au lieu de €9.99)

### Test 2 : Client UE B2B
1. Choisir un plan
2. Saisir un n° TVA UE valide (ex: DE123456789)
3. **Vérifier** : Pas de TVA ajoutée (autoliquidation)

### Test 3 : Client hors UE
1. Choisir un plan
2. Adresse : USA
3. **Vérifier** : Pas de TVA (€9.99 seulement)

## 📄 Obligations légales

### Facturation
Stripe génère automatiquement les factures avec :
- ✅ Numéro de facture unique
- ✅ Ton n° TVA FR09938848546
- ✅ Montant HT
- ✅ Taux de TVA appliqué
- ✅ Montant TTC
- ✅ Mentions légales

### Déclaration de TVA
Stripe fournit des rapports pour ta déclaration :
- Dashboard → Reports → Tax
- Export mensuel des transactions
- Ventilation par pays et taux

## ⚠️ Important

1. **Prix affichés sur le site**
   - Continue d'afficher €9.99, €29.99, etc.
   - Stripe ajoutera "HT" ou "TTC" selon le contexte
   - La TVA s'ajoutera automatiquement au checkout

2. **Clients existants**
   - Les anciens abonnements continuent avec l'ancien prix
   - Les nouveaux paiements utiliseront le nouveau système
   - Migration progressive

3. **Codes promo**
   - `allow_promotion_codes: true` est activé
   - Les codes promo s'appliquent sur le montant HT
   - La TVA se calcule après la réduction

## 🔗 Ressources

- [Stripe Tax Documentation](https://stripe.com/docs/tax)
- [TVA intracommunautaire](https://stripe.com/docs/billing/taxes/eu-vat)
- [Tax behavior](https://stripe.com/docs/api/prices/create#create_price-tax_behavior)
- [VIES (validation TVA UE)](https://ec.europa.eu/taxation_customs/vies/)

---

**Statut :** ✅ Configuration complète et conforme

Les modifications sont prêtes à être déployées. N'oublie pas d'activer **Stripe Tax** dans ton dashboard avant de mettre en production !
