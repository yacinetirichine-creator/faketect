# 🎯 RÉSUMÉ - MISE À JOUR PRICING (5 Plans + Offres Annuelles)

**Date:** 24 Décembre 2025  
**Status:** ✅ IMPLÉMENTÉ DANS LE CODE

---

## 📊 COMPARAISON ANCIEN vs NOUVEAU

```
ANCIEN                          NOUVEAU
════════════════════════════════════════════════════════════

FREE PLAN                       FREE PLAN
├─ 0€ pour toujours      ✅      ├─ 0€ pour toujours
├─ 3 analyses/jour               ├─ 3 analyses/jour
└─ Images seulement             └─ Images seulement

PRO PLAN (29€)                  STARTER PLAN ✨ NOUVEAU
                                ├─ 12€/mois
                                ├─ 100 analyses
                                └─ Documents inclus

                                PRO PLAN (34€)
                                ├─ 500 analyses/mois
                                ├─ Batch + API
                                └─ POPULAIRE ⭐

                                BUSINESS PLAN ✨ NOUVEAU
                                ├─ 89€/mois
                                ├─ 2000 analyses
                                └─ Certificats + Multi-users

ENTERPRISE (Devis)              ENTERPRISE (249€)
├─ Illimité                     ├─ 249€/mois
├─ Support 24/7                 ├─ Illimité
└─ Dédié                        └─ PREMIUM ⭐


PACKS (Crédits)                 OFFRES ANNUELLES ✨ NOUVEAU
├─ 9.90€ (50)                   ├─ Starter: 99€/an (éco 45€)
├─ 34.90€ (200)                 ├─ Pro: 290€/an (éco 118€) ⭐
└─ 79.90€ (500)                 └─ Business: 790€/an (éco 278€)
```

---

## ✅ PLANS DÉTAILLÉS

### 1. FREE (Gratuit)
```
Prix:           0€ pour toujours
Analyses:       3 par jour
Fichiers:       Images (JPG, PNG, WebP)
Historique:     7 jours
Support:        Communautaire
```

### 2. STARTER (Nouveauté)
```
Prix:           12€/mois
Analyses:       100/mois
Fichiers:       Images + Documents (PDF, Word)
Historique:     30 jours
Support:        Email
À créer Stripe: VITE_STRIPE_PRICE_STARTER_MONTHLY
```

### 3. PRO (Populaire)
```
Prix:           34€/mois (↑ +5€ vs avant)
Analyses:       500/mois
Fichiers:       Tous types
Batch:          20 fichiers
Rapports:       PDF détaillés
API:            Accès
Support:        Prioritaire
À créer Stripe: VITE_STRIPE_PRICE_PRO_MONTHLY
```

### 4. BUSINESS (Nouveauté)
```
Prix:           89€/mois
Analyses:       2000/mois
Fichiers:       Tous types
Batch:          50 fichiers
Certificats:    Authenticité
API:            Dédiée
Multi-users:    5 comptes
Support:        Prioritaire 24h
À créer Stripe: VITE_STRIPE_PRICE_BUSINESS_MONTHLY
```

### 5. ENTERPRISE (Nouveauté tarifée)
```
Prix:           249€/mois
Analyses:       Illimité
Fichiers:       Tous types
API:            SLA 99.9%
Certificats:    Juridiques
Intégration:    Personnalisée
Multi-users:    Illimité
Support:        24/7 dédié
À créer Stripe: VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY
```

---

## 📅 OFFRES ANNUELLES (Nouvelles)

### Starter Annuel - 99€/an
```
Économie:       45€ (12€×12 - 99€)
Réduction:      31%
Bonus:          2 mois offerts
Analyses/an:    1200
À créer Stripe: VITE_STRIPE_PRICE_STARTER_YEARLY
```

### Pro Annuel - 290€/an ⭐
```
Économie:       118€ (34€×12 - 290€)
Réduction:      29%
Bonus:          3 mois offerts
Analyses/an:    6000
À créer Stripe: VITE_STRIPE_PRICE_PRO_YEARLY
POPULAIRE!
```

### Business Annuel - 790€/an
```
Économie:       278€ (89€×12 - 790€)
Réduction:      26%
Bonus:          3 mois offerts
Analyses/an:    24000
À créer Stripe: VITE_STRIPE_PRICE_BUSINESS_YEARLY
```

---

## 🔧 VARIABLES D'ENVIRONNEMENT (7 NOUVELLES)

### À ajouter dans `.env` frontend ET backend

```env
# Plans Mensuels (4)
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx

# Offres Annuelles (3)
STRIPE_PRICE_STARTER_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxxxxxxxxxxxx
```

### Anciennes variables (dépréciées)
```env
# À RETIRER APRÈS MIGRATION
STRIPE_PRICE_PRO_MONTHLY (ancien: 29€)
STRIPE_PRICE_PRO_YEARLY (ancien: 290€ pour 500/mois)
STRIPE_PRICE_PACK_STARTER (ancien: 9.90€ crédit)
STRIPE_PRICE_PACK_STANDARD (ancien: 34.90€ crédit)
STRIPE_PRICE_PACK_PREMIUM (ancien: 79.90€ crédit)
```

---

## 📝 FICHIERS MODIFIÉS

✅ **packages/web/src/pages/PricingPage.jsx**
- Ligne 9-99: Array PLANS (5 plans)
- Ligne 103-130: Array PACKS → OFFRES ANNUELLES
- Ligne 350+: Titre "Offres Annuelles"

✅ **UPDATE-PRICING-PLANS.md**
- Guide complet de migration
- Instructions Stripe Dashboard
- Checklist de vérification

✅ **packages/web/.env**
✅ **packages/api/.env**
- Variables mises à jour avec placeholders

---

## 📋 CHECKLIST - PROCHAINES ÉTAPES

### Phase 1: Créer Produits Stripe

- [ ] Stripe Dashboard → Products
- [ ] Créer 7 nouveaux produits:
  - [ ] Starter Mensuel (12€)
  - [ ] Pro Mensuel (34€)
  - [ ] Business Mensuel (89€)
  - [ ] Enterprise Mensuel (249€)
  - [ ] Starter Annuel (99€)
  - [ ] Pro Annuel (290€)
  - [ ] Business Annuel (790€)

### Phase 2: Récupérer Price IDs

- [ ] Copier `price_` depuis Stripe
- [ ] Ajouter dans `.env` frontend
- [ ] Ajouter dans `.env` backend

### Phase 3: Redéployer

- [ ] `git push origin main` (Vercel auto-build)
- [ ] `git push origin main` (Render auto-redeploy)
- [ ] Attendre déploiement (5-10 min)

### Phase 4: Vérifier

- [ ] Accéder à https://faketect.com/pricing
- [ ] Vérifier 5 plans affichés
- [ ] Vérifier 3 offres annuelles affichées
- [ ] Cliquer "Choisir" → Stripe Checkout
- [ ] Tester paiement (4242 4242 4242 4242)
- [ ] Vérifier webhook reçu

---

## 💡 NOTES IMPORTANTES

### Pour les Développeurs

```javascript
// Nouvelle structure PLANS
{
  id: 'starter-monthly',      // Format: nom-période
  priceId: env var,           // Variables d'environnement
  popular: true/false,        // Badge "Populaire"
  badge: 'Premium'            // Badge personnalisé
}

// Nouvelle structure PACKS (Offres Annuelles)
{
  id: 'starter-yearly',       // Format: nom-annuel
  savings: 'Économisez 45€',  // Affiché sous prix
  analyses: '1200/an',        // Format texte
  priceId: env var
}
```

### Points de Vente (Sales Points)

```
✅ 5 plans pour tous les budgets (0€ → 249€)
✅ Offres annuelles avec réductions (26-31%)
✅ Plans populaires marqués (Pro mensuel, Pro annuel)
✅ Descriptions claires par segment
✅ Bonus "mois offerts" sur annuels
```

### Support Multilingue

Les descriptions sont en français. À adapter si nécessaire pour:
- Anglais: "per month" → "per year", "Save 45€"
- Allemand: "pro Monat" → "pro Jahr"
- Autres langues: via i18n hook

---

## 🎨 DESIGN

- ✅ Couleurs cohérentes (gradients Tailwind)
- ✅ Icons (Package, Zap, Crown, Building2)
- ✅ Animations Framer Motion conservées
- ✅ Responsive (mobile, tablet, desktop)

---

## 🚀 STATUS

```
Code:           ✅ PRÊT
Design:         ✅ CONSERVÉ
Variables:      ⏳ À AJOUTER
Stripe:         ⏳ À CRÉER (7 produits)
Test:           ⏳ À VÉRIFIER
Production:     ⏳ APRÈS STRIPE
```

---

## 📞 DÉTAILS TECHNIQUES

**Fichier principale:** [packages/web/src/pages/PricingPage.jsx](packages/web/src/pages/PricingPage.jsx)

**Dépendances:**
- React
- Framer Motion (animations)
- React Router (navigation)
- Stripe (checkout)

**Env Vars Frontend:** 8 variables (4 mensuels + 3 annuels + 1 publishable key)

**Env Vars Backend:** 7 variables (idem + secret key)

