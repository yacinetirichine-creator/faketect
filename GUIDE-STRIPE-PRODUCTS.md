# 🔧 GUIDE - Créer Produits Stripe pour Nouveaux Plans

**Durée:** ~15 minutes  
**Produits à créer:** 7 (4 mensuels + 3 annuels)

---

## 📌 PRÉREQUIS

- ✅ Compte Stripe actif (mode LIVE)
- ✅ Webhook déjà configuré
- ✅ Clé secrète Stripe disponible

---

## 🚀 CRÉER LES 7 PRODUITS

### ÉTAPE 1: Aller sur Stripe Dashboard

1. Ouvrir https://dashboard.stripe.com/products
2. Cliquer **"+ Add Product"** (en haut à droite)

---

## 📋 PRODUIT 1: Starter Mensuel

### Informations Produit
```
Name:           Starter - Mensuel
Description:    100 analyses par mois. Parfait pour les indépendants.
Image:          (optionnel)
```

### Prix
```
Price: 12.00 EUR
Billing Period: Monthly (Recurring)
```

### Après création
```
📌 COPIER LE PRICE ID: price_XXXXXXXXXXXXX
VITE_STRIPE_PRICE_STARTER_MONTHLY = price_XXXXXXXXXXXXX
```

---

## 📋 PRODUIT 2: Pro Mensuel

### Informations Produit
```
Name:           Pro - Mensuel
Description:    500 analyses par mois. Pour les professionnels.
```

### Prix
```
Price: 34.00 EUR
Billing Period: Monthly (Recurring)
```

### Après création
```
📌 COPIER: VITE_STRIPE_PRICE_PRO_MONTHLY = price_XXXXXXXXXXXXX
```

---

## 📋 PRODUIT 3: Business Mensuel

### Informations Produit
```
Name:           Business - Mensuel
Description:    2000 analyses par mois. Pour les entreprises.
```

### Prix
```
Price: 89.00 EUR
Billing Period: Monthly (Recurring)
```

### Après création
```
📌 COPIER: VITE_STRIPE_PRICE_BUSINESS_MONTHLY = price_XXXXXXXXXXXXX
```

---

## 📋 PRODUIT 4: Enterprise Mensuel

### Informations Produit
```
Name:           Enterprise - Mensuel
Description:    Analyses illimitées. Solution sur mesure.
```

### Prix
```
Price: 249.00 EUR
Billing Period: Monthly (Recurring)
```

### Après création
```
📌 COPIER: VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY = price_XXXXXXXXXXXXX
```

---

## 📋 PRODUIT 5: Starter Annuel

### Informations Produit
```
Name:           Starter - Annuel
Description:    1200 analyses par an (2 mois offerts).
```

### Prix
```
Price: 99.00 EUR
Billing Period: Yearly (Recurring)
```

### Après création
```
📌 COPIER: VITE_STRIPE_PRICE_STARTER_YEARLY = price_XXXXXXXXXXXXX
```

---

## 📋 PRODUIT 6: Pro Annuel

### Informations Produit
```
Name:           Pro - Annuel
Description:    6000 analyses par an (3 mois offerts). Meilleur prix.
```

### Prix
```
Price: 290.00 EUR
Billing Period: Yearly (Recurring)
```

### Après création
```
📌 COPIER: VITE_STRIPE_PRICE_PRO_YEARLY = price_XXXXXXXXXXXXX
```

---

## 📋 PRODUIT 7: Business Annuel

### Informations Produit
```
Name:           Business - Annuel
Description:    24000 analyses par an (3 mois offerts).
```

### Prix
```
Price: 790.00 EUR
Billing Period: Yearly (Recurring)
```

### Après création
```
📌 COPIER: VITE_STRIPE_PRICE_BUSINESS_YEARLY = price_XXXXXXXXXXXXX
```

---

## 📝 RÉCAPITULATIF PRICE IDs

Après créer les 7 produits, tu devras avoir:

```env
# FRONTEND - packages/web/.env

VITE_STRIPE_PRICE_STARTER_MONTHLY=price_1Sg8XX...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_1Sg8XX...
VITE_STRIPE_PRICE_BUSINESS_MONTHLY=price_1Sg8XX...
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1Sg8XX...
VITE_STRIPE_PRICE_STARTER_YEARLY=price_1Sg8XX...
VITE_STRIPE_PRICE_PRO_YEARLY=price_1Sg8XX...
VITE_STRIPE_PRICE_BUSINESS_YEARLY=price_1Sg8XX...
```

```env
# BACKEND - packages/api/.env

STRIPE_PRICE_STARTER_MONTHLY=price_1Sg8XX...
STRIPE_PRICE_PRO_MONTHLY=price_1Sg8XX...
STRIPE_PRICE_BUSINESS_MONTHLY=price_1Sg8XX...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1Sg8XX...
STRIPE_PRICE_STARTER_YEARLY=price_1Sg8XX...
STRIPE_PRICE_PRO_YEARLY=price_1Sg8XX...
STRIPE_PRICE_BUSINESS_YEARLY=price_1Sg8XX...
```

---

## ✅ CHECKLIST

- [ ] Créé 4 produits mensuels
  - [ ] Starter (12€)
  - [ ] Pro (34€)
  - [ ] Business (89€)
  - [ ] Enterprise (249€)
- [ ] Créé 3 produits annuels
  - [ ] Starter (99€)
  - [ ] Pro (290€)
  - [ ] Business (790€)
- [ ] Copié tous les 7 `price_` IDs
- [ ] Ajouté dans `.env` frontend
- [ ] Ajouté dans `.env` backend
- [ ] Testé affichage page /pricing
- [ ] Testé checkout Stripe

---

## 🎯 RÉSULTAT

Après cette étape:
- ✅ 7 produits dans Stripe
- ✅ 7 price IDs configurés
- ✅ Page pricing affiche tous les plans
- ✅ Boutons "Choisir" fonctionnent
- ✅ Checkout Stripe fonctionne

---

## 🆘 DÉPANNAGE

### "Price ID not found" sur la page

**Solution:**
1. Vérifier que `.env` a les bonnes variables
2. Vérifier que le serveur a été redéployé
3. Rafraîchir la page (Ctrl+F5)

### "Payment failed" lors du checkout

**Solution:**
1. Vérifier que les `price_` sont corrects
2. Vérifier que Stripe mode LIVE
3. Vérifier webhook est reçu

### Webhook ne reçoit pas les paiements

**Solution:**
1. Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env`
2. Vérifier webhook URL sur Stripe Dashboard
3. Vérifier que backend est en production

---

## 💡 TIPS

- **Test avant production:** Utiliser Stripe test mode d'abord
  - Carte: `4242 4242 4242 4242`
  - Date: N'importe quelle future
  - CVC: N'importe quel 3 chiffres

- **Documenter:** Garder une copie des price_IDs
  - Utile pour support/debugging
  - Archiver dans notes sécurisées

- **Vérifier prix:** Double-vérifier les montants
  - Frontend affiche prix
  - Stripe doit avoir les mêmes prix
  - Backend fait la validation

---

## 📞 SUPPORT STRIPE

- Docs: https://docs.stripe.com/products-prices/manage-products
- Dashboard: https://dashboard.stripe.com/products
- Support: https://support.stripe.com

