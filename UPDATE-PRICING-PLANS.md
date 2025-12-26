# 🎯 UPDATE PRICING - NOUVEAUX PLANS ET OFFRES

**Date:** 24 Décembre 2025  
**Statut:** ✅ IMPLÉMENTÉ

---

## 📊 CHANGEMENTS APPLIQUÉS

### Avant (Anciens Plans)
```
❌ Free        0€           (3/jour)
❌ Pro         29€/mois     (500/mois)
❌ Pro Annuel  290€/an      (500/mois)
❌ Entreprise  Devis        (illimité)

❌ Packs Crédit:
   - Starter   9.90€ (50)
   - Standard  34.90€ (200)
   - Premium   79.90€ (500)
```

### Après (Nouveaux Plans) ✅
```
✅ Free        0€           (3/jour)
✅ Starter     12€/mois     (100/mois) ← NOUVEAU
✅ Pro         34€/mois     (500/mois) ← AUGMENTÉ
✅ Business    89€/mois     (2000/mois) ← NOUVEAU
✅ Enterprise  249€/mois    (illimité) ← NOUVEAU

✅ Offres Annuelles:
   - Starter   99€/an       (1200/an, éco 45€)
   - Pro       290€/an      (6000/an, éco 118€)
   - Business  790€/an      (24000/an, éco 278€)
```

---

## 🎨 STRUCTURE DES PLANS

### 1. FREE (Gratuit) ✅
```javascript
{
  id: 'free',
  name: 'Gratuit',
  price: '0€',
  period: 'pour toujours',
  icon: Package,
  color: 'from-gray-500 to-gray-600',
  features: [
    '3 analyses par jour',
    'Images uniquement (JPG, PNG, WebP)',
    'Historique 7 jours',
    'Support communautaire'
  ],
  free: true
}
```

### 2. STARTER (Indépendants) ✅
```javascript
{
  id: 'starter-monthly',
  name: 'Starter',
  price: '12€',
  period: 'par mois',
  icon: Zap,
  color: 'from-blue-500 to-blue-600',
  priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY,
  features: [
    '100 analyses par mois',
    'Images + Documents (PDF, Word)',
    'Analyse par URL',
    'Historique 30 jours',
    'Support email'
  ]
}
```

### 3. PRO (Professionnels) ✅ POPULAIRE
```javascript
{
  id: 'pro-monthly',
  name: 'Pro',
  price: '34€',
  period: 'par mois',
  icon: Crown,
  color: 'from-primary-500 to-primary-600',
  priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
  features: [
    '500 analyses par mois',
    'Tous types de fichiers',
    'Analyse batch (20 fichiers)',
    'Rapports PDF détaillés',
    'Métadonnées EXIF',
    'Accès API',
    'Historique illimité',
    'Support prioritaire'
  ],
  popular: true
}
```

### 4. BUSINESS (Entreprises) ✅
```javascript
{
  id: 'business-monthly',
  name: 'Business',
  price: '89€',
  period: 'par mois',
  icon: Building2,
  color: 'from-purple-500 to-purple-600',
  priceId: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY,
  features: [
    '2000 analyses par mois',
    'Tous types de fichiers',
    'Analyse batch (50 fichiers)',
    'Certificats d\'authenticité',
    'API dédiée',
    'Rapports PDF personnalisés',
    'Multi-utilisateurs (5 comptes)',
    'Support prioritaire 24h'
  ]
}
```

### 5. ENTERPRISE (Sur Mesure) ✅ PREMIUM
```javascript
{
  id: 'enterprise-monthly',
  name: 'Enterprise',
  price: '249€',
  period: 'par mois',
  icon: Building2,
  color: 'from-amber-500 to-amber-600',
  priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY,
  features: [
    'Analyses illimitées',
    'Tous types de fichiers',
    'API avec SLA 99.9%',
    'Certificats juridiques',
    'Intégration personnalisée',
    'Multi-utilisateurs illimité',
    'Gestionnaire de compte dédié',
    'Support 24/7',
    'Formation équipe incluse',
    'Conformité RGPD garantie'
  ],
  badge: 'Premium'
}
```

---

## 📅 OFFRES ANNUELLES

### 1. Starter Annuel (99€/an)
```
- 1200 analyses/an
- Économie: 45€ (vs 12€×12)
- 2 mois offerts
```

### 2. Pro Annuel (290€/an) ⭐ POPULAIRE
```
- 6000 analyses/an
- Économie: 118€ (vs 34€×12)
- 3 mois offerts
```

### 3. Business Annuel (790€/an)
```
- 24000 analyses/an
- Économie: 278€ (vs 89€×12)
- 3 mois offerts
```

---

## 🔧 VARIABLES D'ENVIRONNEMENT À CRÉER

Ajoute ces variables dans **Stripe Dashboard** puis dans ton `.env`:

### Variables Frontend (`packages/web/.env`)

```env
# Plans Mensuels
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx

# Offres Annuelles
VITE_STRIPE_PRICE_STARTER_YEARLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_BUSINESS_YEARLY=price_xxxxxxxxxxxxx
```

### Variables Backend (`packages/api/.env`)

```env
# Plans Mensuels
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx

# Offres Annuelles
STRIPE_PRICE_STARTER_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxxxxxxxxxxxx
```

---

## 📝 ÉTAPES POUR FINIR LA MIGRATION

### 1. Créer les Produits dans Stripe Dashboard

```
https://dashboard.stripe.com/products
```

#### Plan Starter Mensuel
- Product Name: "FakeTect Starter - Mensuel"
- Price: 12€
- Billing Period: Monthly
- **Price ID:** `price_1Sg8XXXXXXXXXXXXXXXXXXXX`

#### Plan Pro Mensuel
- Product Name: "FakeTect Pro - Mensuel"
- Price: 34€
- Billing Period: Monthly
- **Price ID:** `price_1Sg8XXXXXXXXXXXXXXXXXXXX`

#### Plan Business Mensuel
- Product Name: "FakeTect Business - Mensuel"
- Price: 89€
- Billing Period: Monthly
- **Price ID:** `price_1Sg8XXXXXXXXXXXXXXXXXXXX`

#### Plan Enterprise Mensuel
- Product Name: "FakeTect Enterprise - Mensuel"
- Price: 249€
- Billing Period: Monthly
- **Price ID:** `price_1Sg8XXXXXXXXXXXXXXXXXXXX`

#### Offre Starter Annuel
- Product Name: "FakeTect Starter - Annuel"
- Price: 99€
- Billing Period: Yearly
- **Price ID:** `price_1Sg8XXXXXXXXXXXXXXXXXXXX`

#### Offre Pro Annuel
- Product Name: "FakeTect Pro - Annuel"
- Price: 290€
- Billing Period: Yearly
- **Price ID:** `price_1Sg8XXXXXXXXXXXXXXXXXXXX`

#### Offre Business Annuel
- Product Name: "FakeTect Business - Annuel"
- Price: 790€
- Billing Period: Yearly
- **Price ID:** `price_1Sg8XXXXXXXXXXXXXXXXXXXX`

### 2. Copier les Price IDs

Après création, copier les 8 `price_` dans ton `.env` frontend et backend

### 3. Redéployer

```bash
# Frontend automatique sur Vercel
git push origin main

# Backend automatique sur Render
git push origin main
```

### 4. Vérifier

- [ ] Page /pricing affiche 5 plans
- [ ] Page /pricing affiche 3 offres annuelles
- [ ] Boutons "Choisir" redirigent vers Stripe
- [ ] Stripe checkout fonctionne
- [ ] Webhooks enregistrent les paiements

---

## 💰 COMPARAISON PRIX

### Coût Mensuel Effectif

```
Starter:
  - Monthly:  12€/mois × 12 = 144€/an
  - Yearly:   99€/an
  - Économie: 45€/an (31% de réduction)

Pro:
  - Monthly:  34€/mois × 12 = 408€/an
  - Yearly:   290€/an
  - Économie: 118€/an (29% de réduction)

Business:
  - Monthly:  89€/mois × 12 = 1068€/an
  - Yearly:   790€/an
  - Économie: 278€/an (26% de réduction)
```

---

## 📊 RÉSUMÉ DES CHANGEMENTS

| Plan | Ancien | Nouveau | Changement |
|------|--------|---------|-----------|
| Free | 0€ | 0€ | ✅ Même |
| Starter | - | 12€/mois | ✅ NOUVEAU |
| Pro | 29€ | 34€/mois | ⬆️ +5€ |
| Business | - | 89€/mois | ✅ NOUVEAU |
| Enterprise | Devis | 249€/mois | ✅ Tarifié |

---

## ✅ FICHIERS MODIFIÉS

- ✅ [packages/web/src/pages/PricingPage.jsx](packages/web/src/pages/PricingPage.jsx)
  - Mise à jour array PLANS (5 plans)
  - Mise à jour array PACKS (3 offres annuelles)
  - Mise à jour titre section ("Offres Annuelles")

---

## 🚀 STATUT

**Frontend Code:** ✅ PRÊT  
**Stripe Products:** ⏳ À CRÉER  
**Env Variables:** ⏳ À AJOUTER  
**Test Payment:** ⏳ À VÉRIFIER  

---

## 📞 NOTES

- Les prix incluent TVA (selon pays)
- Les analyses "par an" sont divisées mensuellement (1200/12 = 100)
- Les offres annuelles donnent des bonus (2-3 mois offerts)
- Enterprise est individualisé (prix de base 249€)

