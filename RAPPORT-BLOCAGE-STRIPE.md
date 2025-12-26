# 🔍 RAPPORT - État Stripe et Blocage Analyses

**Date:** 24 Décembre 2025  
**Status:** ⚠️ PARTIELLEMENT COMPLÉTÉ

---

## ✅ CHANGEMENTS APPORTÉS

### 1. Suppression des Bonus Mensuels (Offres Annuelles)

**Avant:**
```
- Starter Annuel: "2 mois offerts"
- Pro Annuel: "3 mois offerts"
- Business Annuel: "3 mois offerts"
```

**Après:**
```
✅ - Starter Annuel: "Engagement annuel" (Économise 45€)
✅ - Pro Annuel: "Meilleur rapport qualité/prix" (Économise 118€)
✅ - Business Annuel: "Engagement annuel" (Économise 278€)
```

**Fichier:** [packages/web/src/pages/PricingPage.jsx](packages/web/src/pages/PricingPage.jsx#L112-L130)

---

### 2. Système de Blocage des Analyses

**Créé:** `packages/web/src/utils/analysisLimits.js` ✅

#### Limites par Plan

```javascript
FREE PLAN
├─ Quotidien: 3 analyses/jour
├─ Mensuel: Aucune limite (3/jour suffit)
├─ Fonctionnalités: Images uniquement
├─ Pas de: Vidéo, Batch, Documents
└─ Support: URL

STARTER PLAN
├─ Quotidien: Aucune limite
├─ Mensuel: 100 analyses
├─ Fonctionnalités: Images, Documents, URL
├─ Pas de: Vidéo, Batch
└─ Support: Email

PRO PLAN
├─ Quotidien: Aucune limite
├─ Mensuel: 500 analyses
├─ Fonctionnalités: Tout sauf illimité
├─ Batch: Oui (20 fichiers)
├─ Vidéo: Oui
└─ Support: Prioritaire

BUSINESS PLAN
├─ Quotidien: Aucune limite
├─ Mensuel: 2000 analyses
├─ Fonctionnalités: Tout
├─ Batch: Oui (50 fichiers)
├─ Vidéo: Oui
├─ Documents: Oui
└─ Support: 24h Prioritaire

ENTERPRISE PLAN
├─ Quotidien: Aucune limite
├─ Mensuel: ILLIMITÉ
├─ Fonctionnalités: Tout illimité
├─ Batch: Oui (1000 fichiers)
├─ Vidéo: Oui
└─ Support: 24/7 Dédié
```

#### Fonctions Disponibles

```javascript
// Vérifier une fonctionnalité
canUseFeature(planType, feature)
// Ex: canUseFeature('pro', 'video') → true

// Obtenir limites
getMonthlyLimit(planType)    // → 500 pour 'pro'
getDailyLimit(planType)      // → 3 pour 'free'
getBatchLimit(planType)      // → 20 pour 'pro'

// Vérifier quota
isQuotaExhausted(quota)           // Quota à 0?
isQuotaAlmostExhausted(quota)     // Moins de 10%?

// Messages d'erreur
getQuotaExceededMessage(planType)

// Fichiers
canUploadFile(planType, mimeType)

// Formatage UI
formatQuotaStatus(quota, planType)
```

#### Utilisation dans HomePage.jsx

```javascript
import { canUseFeature, isQuotaExhausted, getQuotaExceededMessage } from '../utils/analysisLimits'

// Avant une analyse vidéo
if (!canUseFeature(userPlan, 'video')) {
  showToast.error('Vidéo non disponible pour votre plan')
  navigate('/pricing')
  return
}

// Vérifier quota
if (isQuotaExhausted(quota)) {
  showToast.error(getQuotaExceededMessage(userPlan))
  navigate('/pricing')
  return
}
```

---

## ⚠️ ÉTAT STRIPE

### Prix Créés ✅
```
✅ Ancien Pro Mensuel (29€)  - price_1Sg8XQIaJ0g5yYYSamQOtFMN
✅ Ancien Pro Annuel (290€)  - price_1Sg8XRIaJ0g5yYYSd6vl56w1
✅ Ancien Packs (9.90€, 34.90€, 79.90€) - Créés
```

### Prix À Créer ⏳
```
❌ Starter Mensuel (12€)           → VITE_STRIPE_PRICE_STARTER_MONTHLY
❌ Pro Mensuel (34€)                → VITE_STRIPE_PRICE_PRO_MONTHLY
❌ Business Mensuel (89€)           → VITE_STRIPE_PRICE_BUSINESS_MONTHLY
❌ Enterprise Mensuel (249€)        → VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY
❌ Starter Annuel (99€)             → VITE_STRIPE_PRICE_STARTER_YEARLY
❌ Pro Annuel (290€)                → VITE_STRIPE_PRICE_PRO_YEARLY
❌ Business Annuel (790€)           → VITE_STRIPE_PRICE_BUSINESS_YEARLY
```

### Configuration Actuelle

**Frontend (.env):**
```
VITE_STRIPE_PRICE_STARTER_MONTHLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX  ← PLACEHOLDER
VITE_STRIPE_PRICE_PRO_MONTHLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX      ← PLACEHOLDER
VITE_STRIPE_PRICE_BUSINESS_MONTHLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX ← PLACEHOLDER
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX ← PLACEHOLDER
VITE_STRIPE_PRICE_STARTER_YEARLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX   ← PLACEHOLDER
VITE_STRIPE_PRICE_PRO_YEARLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX       ← PLACEHOLDER
VITE_STRIPE_PRICE_BUSINESS_YEARLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX  ← PLACEHOLDER
```

**Backend (.env):**
```
STRIPE_PRICE_STARTER_MONTHLY=price_1Sg8XXXXXXXXXXXXXXXXXXXX       ← PLACEHOLDER
... (idem frontend)
```

---

## 📋 PROCHAINES ÉTAPES REQUISES

### Étape 1: Créer les 7 Produits Stripe

Voir [GUIDE-STRIPE-PRODUCTS.md](GUIDE-STRIPE-PRODUCTS.md) pour les étapes détaillées.

```bash
# Tableau à remplir après création:
Starter Mensuel (12€)      → price_1Sg8XXXX
Pro Mensuel (34€)          → price_1Sg8XXXX
Business Mensuel (89€)     → price_1Sg8XXXX
Enterprise Mensuel (249€)  → price_1Sg8XXXX
Starter Annuel (99€)       → price_1Sg8XXXX
Pro Annuel (290€)          → price_1Sg8XXXX
Business Annuel (790€)     → price_1Sg8XXXX
```

### Étape 2: Remplir les Variables d'Environnement

```bash
# Remplacer XXXXXXXXXXXXXXXXXXXX par les vrais price_IDs

# Frontend
packages/web/.env
packages/web/.env.example

# Backend
packages/api/.env
packages/api/.env.example
```

### Étape 3: Intégrer le Système de Blocage

Dans `packages/web/src/pages/HomePage.jsx`:

```javascript
// Ajouter import
import { canUseFeature, isQuotaExhausted, getQuotaExceededMessage } from '../utils/analysisLimits'

// Avant analyzeVideo
if (!canUseFeature(userPlan, 'video')) {
  showToast.error('Vidéo non disponible pour votre plan')
  navigate('/pricing')
  return
}

// Avant analyzeBatch
if (!canUseFeature(userPlan, 'batch')) {
  showToast.error('Batch non disponible pour votre plan')
  navigate('/pricing')
  return
}

// Avant analyzeDocument
if (!canUseFeature(userPlan, 'document')) {
  showToast.error('Documents non disponibles pour votre plan')
  navigate('/pricing')
  return
}
```

### Étape 4: Redéployer

```bash
git add .
git commit -m "feat: Ajouter système blocage analyses par plan"
git push origin main
```

---

## 🎯 CHECKLIST

### Blocage Analyses
- [x] Service de limites créé (`analysisLimits.js`)
- [x] Limites définies par plan
- [ ] Intégré dans HomePage.jsx
- [ ] Intégré dans backend (routes)
- [ ] Testé avec chaque type de fichier

### Stripe
- [ ] 7 produits créés dans Stripe
- [ ] 7 price_IDs récupérés
- [ ] .env frontend mis à jour
- [ ] .env backend mis à jour
- [ ] Vercel redéployé
- [ ] Render redéployé

### Tests
- [ ] Gratuit: Seulement 3 images/jour
- [ ] Starter: 100/mois, pas vidéo/batch
- [ ] Pro: 500/mois, batch 20, vidéo OK
- [ ] Business: 2000/mois, batch 50, tout OK
- [ ] Enterprise: Illimité

---

## 💡 RÉSUMÉ

| Aspect | Status | Details |
|--------|--------|---------|
| **Suppression bonus** | ✅ FAIT | Mois offerts retirés |
| **Système blocage** | ✅ FAIT | Service analysisLimits.js créé |
| **Intégration blocage** | ⏳ À FAIRE | Ajouter dans HomePage.jsx |
| **Produits Stripe** | ❌ À FAIRE | 7 produits manquants |
| **Price IDs** | ❌ À FAIRE | 7 variables manquantes |
| **Variables d'env** | ⏳ PLACEHOLDERS | Remplacer avec vrais IDs |

---

## 📞 DOCUMENTS ASSOCIÉS

- [GUIDE-STRIPE-PRODUCTS.md](GUIDE-STRIPE-PRODUCTS.md) - Comment créer les 7 produits
- [UPDATE-PRICING-PLANS.md](UPDATE-PRICING-PLANS.md) - Détails des plans
- [RESUME-PRICING-UPDATE.md](RESUME-PRICING-UPDATE.md) - Résumé complet

