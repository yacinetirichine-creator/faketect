# 📁 Structure Complète du Système de Facturation

## Vue d'ensemble des fichiers créés/modifiés

### 🔧 Backend - Services (packages/api/services/)

#### `billing.js` - Service principal de facturation
**Rôle :** Gestion complète de la facturation et des paiements  
**Lignes :** 600+  
**Classes :**
- `BillingService` - Service principal singleton
  
**Méthodes principales :**
- `getOrCreateUserProfile(userId, profileData)` - Créer/récupérer profil
- `createStripeCustomer(userId, profile)` - Créer customer Stripe
- `generateInvoiceNumber()` - Générer numéro unique
- `createInvoice(userId, invoiceData)` - Créer une facture
- `createSubscriptionInvoice(userId, subscriptionData)` - Facture abonnement
- `createQuotaPackInvoice(userId, packData)` - Facture pack quotas
- `markInvoiceAsPaid(invoiceId, paymentData)` - Marquer comme payée
- `getUserInvoices(userId, filters)` - Liste factures utilisateur
- `createCheckoutSession(userId, sessionData)` - Session paiement Stripe
- `createCustomerPortalSession(userId, returnUrl)` - Portail client
- `handleStripeWebhook(event)` - Traiter webhooks Stripe
- `handleCheckoutCompleted(session)` - Checkout terminé
- `handleInvoicePaid(invoice)` - Facture payée
- `handleInvoicePaymentFailed(invoice)` - Paiement échoué
- `handleSubscriptionChange(subscription)` - Abonnement modifié
- `handleSubscriptionDeleted(subscription)` - Abonnement annulé
- `handlePaymentSucceeded(paymentIntent)` - Paiement réussi

**Dépendances :**
- `stripe` - SDK Stripe
- `../config/supabase` - Client Supabase

---

#### `invoice-pdf.js` - Génération de PDF
**Rôle :** Génération de factures PDF professionnelles  
**Lignes :** 500+  
**Classes :**
- `InvoicePDFService` - Service PDF singleton

**Méthodes principales :**
- `generateInvoicePDF(invoiceId)` - Générer PDF
- `buildInvoicePDF(doc, invoice)` - Construire contenu
- `addHeader(doc, invoice)` - En-tête
- `addCompanyInfo(doc)` - Infos émetteur
- `addClientInfo(doc, invoice, profile)` - Infos client
- `addInvoiceDetails(doc, invoice)` - Détails facture
- `addItemsTable(doc, invoice)` - Tableau lignes
- `addTotals(doc, invoice)` - Totaux HT/TVA/TTC
- `addPaymentTerms(doc, invoice)` - Conditions paiement
- `addLegalFooter(doc, invoice)` - Pied de page légal
- `addPageNumbers(doc)` - Numéros de page
- `formatDate(dateString)` - Formater date
- `formatCurrency(cents)` - Formater montant
- `getInvoicePDF(invoiceId)` - Récupérer PDF existant
- `deleteInvoicePDF(invoiceId)` - Supprimer PDF
- `regenerateInvoicePDF(invoiceId)` - Régénérer PDF

**Dépendances :**
- `pdfkit` - Génération PDF
- `fs` - Système de fichiers
- `path` - Chemins
- `../config/supabase` - Client Supabase

**Output :**
- PDF stockés dans `packages/api/uploads/invoices/`
- Format : `invoice_YYYY00001.pdf`

---

### 🌐 Backend - Routes (packages/api/routes/)

#### `billing.js` - Routes API facturation
**Rôle :** Endpoints API pour le système de facturation  
**Lignes :** 350+  
**Base URL :** `/api/billing`

**Endpoints :**

**Profil :**
- `GET /profile` - Récupérer profil facturation
- `POST /profile` - Créer/modifier profil

**Factures :**
- `GET /invoices` - Liste factures (avec filtres)
- `GET /invoices/:id` - Détails facture
- `GET /invoices/:id/pdf` - Télécharger PDF
- `POST /invoices/:id/regenerate-pdf` - Régénérer PDF

**Paiements Stripe :**
- `POST /checkout/quota-pack` - Session checkout pack quotas
- `POST /checkout/subscription` - Session checkout abonnement
- `POST /portal` - Portail client Stripe

**Données :**
- `GET /subscriptions` - Liste abonnements
- `GET /transactions` - Historique transactions

**Webhooks :**
- `POST /webhooks/stripe` - Webhooks Stripe (pas d'auth)

**Middleware :**
- `authenticate` - Authentification JWT (toutes les routes sauf webhook)

**Dépendances :**
- `express` - Framework
- `../services/billing` - Service facturation
- `../services/invoice-pdf` - Service PDF
- `../middleware/auth` - Authentification

---

### 🗄️ Base de données (docs/)

#### `supabase-billing-schema.sql` - Schéma SQL
**Rôle :** Structure complète de la base de données  
**Lignes :** 400+

**Tables créées :**

**1. user_profiles**
- `id` - UUID primary key
- `user_id` - UUID lié à auth.users
- `account_type` - 'individual' ou 'business'
- `email` - Email de facturation
- `first_name`, `last_name` - Nom/prénom
- `company_name`, `company_legal_form` - Infos entreprise
- `siret` - SIRET (14 chiffres)
- `vat_number` - N° TVA intracommunautaire
- `company_address`, `company_postal_code`, `company_city`, `company_country` - Adresse
- `phone` - Téléphone
- `stripe_customer_id` - ID customer Stripe
- `stripe_subscription_id` - ID abonnement Stripe
- `created_at`, `updated_at` - Timestamps

**2. invoices**
- `id` - UUID primary key
- `user_id`, `profile_id` - Liens utilisateur/profil
- `invoice_number` - Numéro unique (YYYY00001)
- `invoice_date`, `due_date`, `payment_date` - Dates
- `invoice_type` - 'invoice' ou 'credit_note'
- `status` - draft/sent/paid/overdue/cancelled
- `client_type` - Type de client
- `client_name`, `client_email`, `client_address` - Infos client archivées
- `client_siret`, `client_vat_number` - SIRET/TVA client
- `subtotal_cents`, `tax_cents`, `total_cents` - Montants (en centimes)
- `tax_rate` - Taux de TVA (20.00)
- `currency` - Devise (EUR)
- `payment_method` - Méthode de paiement
- `stripe_payment_intent_id`, `stripe_invoice_id` - IDs Stripe
- `pdf_path` - Chemin du PDF
- `notes` - Notes
- `created_at`, `updated_at` - Timestamps

**3. invoice_items**
- `id` - UUID primary key
- `invoice_id` - Lien facture
- `description` - Description ligne
- `quantity` - Quantité
- `unit_price_cents` - Prix unitaire (centimes)
- `subtotal_cents`, `tax_cents`, `total_cents` - Montants
- `tax_rate` - Taux TVA
- `product_type` - quota_pack/subscription/service
- `product_id` - ID produit
- `sort_order` - Ordre d'affichage

**4. subscriptions**
- `id` - UUID primary key
- `user_id`, `profile_id` - Liens
- `stripe_subscription_id`, `stripe_customer_id`, `stripe_price_id` - IDs Stripe
- `status` - active/canceled/past_due/trialing
- `current_period_start`, `current_period_end` - Période
- `amount_cents` - Montant
- `currency` - Devise
- `cancel_at_period_end` - Annulation programmée
- `ended_at` - Date de fin
- `created_at`, `updated_at` - Timestamps

**5. payment_methods**
- `id` - UUID primary key
- `user_id`, `profile_id` - Liens
- `stripe_payment_method_id` - ID Stripe
- `type` - card/sepa_debit/etc
- `card_brand`, `card_last4`, `card_exp_month`, `card_exp_year` - Infos carte
- `is_default` - Méthode par défaut
- `created_at`, `updated_at` - Timestamps

**6. transactions**
- `id` - UUID primary key
- `user_id` - Lien utilisateur
- `transaction_type` - subscription/quota_purchase/payment
- `status` - pending/succeeded/failed/refunded
- `amount_cents` - Montant
- `currency` - Devise
- `stripe_payment_intent_id`, `stripe_charge_id` - IDs Stripe
- `payment_method_type` - Type de paiement
- `description` - Description
- `metadata` - JSONB données supplémentaires
- `created_at` - Timestamp

**Fonctions SQL :**
- `update_updated_at_column()` - Trigger mise à jour timestamps
- `generate_invoice_number()` - Générer numéro unique
- `calculate_invoice_totals()` - Calculer totaux facture

**Triggers :**
- `update_invoices_updated_at` - Auto-update invoices.updated_at
- `calculate_invoice_totals_trigger` - Auto-calcul totaux

**Vues :**
- `v_user_billing_info` - Vue consolidée profils
- `v_invoices_detailed` - Vue factures avec lignes

**Indexes :**
- Performance sur user_id, invoice_number, dates, statuts

**RLS (Row Level Security) :**
- Policies activées sur toutes les tables
- Isolation des données par utilisateur
- Service role accès complet

---

### 🎨 Frontend - Pages (packages/web/src/pages/)

#### `InvoicesPage.jsx` - Page gestion factures
**Rôle :** Interface utilisateur pour les factures  
**Lignes :** 300+

**Fonctionnalités :**
- Liste des factures avec filtres (toutes/payées/en attente)
- Affichage détaillé (numéro, date, montant, statut)
- Téléchargement PDF
- Statistiques (total, payées, en attente)
- Responsive (tableau desktop, cartes mobile)
- États de chargement et erreurs

**Composants :**
- `InvoicesPage` - Composant principal
- `getStatusBadge(status)` - Badge de statut coloré
- `formatDate(dateString)` - Format français
- `formatCurrency(cents)` - Format euros

**États :**
- `invoices` - Liste des factures
- `loading` - État de chargement
- `error` - Message d'erreur
- `filter` - Filtre actif

**API appelée :**
- `GET /api/billing/invoices` - Liste
- `GET /api/billing/invoices/:id/pdf` - Téléchargement

**Design :**
- Glass morphism
- Couleurs Faketect (#2563eb)
- Icons Lucide React
- Responsive breakpoints

---

#### `AuthPage.jsx` (modifié) - Page authentification
**Modifications :**
- Ajout du choix type de compte (Particulier/Entreprise)
- Formulaire dynamique entreprise :
  - Nom entreprise
  - Forme juridique
  - SIRET
  - N° TVA
  - Adresse complète
  - Téléphone
- Appel API création profil après inscription
- Validation champs entreprise si sélectionné

**Nouveaux états :**
- `accountType` - 'individual' ou 'business'
- `companyInfo` - Objet avec champs entreprise

**Nouveaux imports :**
- `Building2`, `UserCircle` - Icons

---

### 🧩 Frontend - Composants (packages/web/src/components/)

#### `Header.jsx` (modifié) - En-tête
**Modifications :**
- Ajout lien "Factures" pour utilisateurs connectés
- Navigation vers `/invoices`
- Icon `FileText` de Lucide React

---

### 🗺️ Frontend - Routing (packages/web/src/)

#### `App.jsx` (modifié) - Application principale
**Modifications :**
- Import `InvoicesPage`
- Nouvelle route `/invoices`

---

### 📚 Documentation (docs/)

#### `BILLING-SYSTEM.md` - Documentation système
**Contenu :** 800+ lignes
- Vue d'ensemble
- Architecture base de données
- Documentation services
- Routes API avec exemples
- Configuration Stripe
- Scripts de test
- Troubleshooting

#### `INSTALLATION-BILLING.md` - Guide installation
**Contenu :** 600+ lignes
- Installation pas à pas
- Configuration Stripe détaillée
- Variables d'environnement
- Tests et vérifications
- Dépannage
- Checklist déploiement

#### `CHANGELOG-BILLING.md` - Journal des changements
**Contenu :** 400+ lignes
- Résumé des fonctionnalités
- Liste fichiers créés/modifiés
- Plan de migration
- Roadmap future

#### `README-BILLING.md` - Guide rapide
**Contenu :** 500+ lignes
- Résumé de ce qui a été fait
- Prochaines étapes prioritaires
- Checklist rapide
- FAQ

#### `FILES-STRUCTURE.md` - Ce fichier
**Contenu :** Structure complète et documentation

---

### ⚙️ Configuration (packages/api/)

#### `server.js` (modifié) - Serveur Express
**Modifications :**
- Import `billingRoutes`
- Mount `/api/billing` routes

#### `package.json` (modifié) - Dépendances
**Modifications :**
- Ajout `stripe@^14.0.0`

---

## 📊 Statistiques

### Fichiers
**Nouveaux :** 9 fichiers  
**Modifiés :** 5 fichiers  
**Documentation :** 5 fichiers  

### Code
**Backend :** ~1500 lignes  
**Frontend :** ~500 lignes  
**SQL :** ~400 lignes  
**Documentation :** ~2500 lignes  
**Total :** ~4900 lignes  

### Fonctionnalités
✅ Gestion profils (particuliers/entreprises)  
✅ Création factures automatique  
✅ Génération PDF professionnels  
✅ Intégration Stripe complète  
✅ Webhooks synchronisés  
✅ Interface utilisateur  
✅ API REST complète  
✅ Sécurité RLS  

---

## 🎯 Points d'entrée

### Backend
```javascript
// Service facturation
const billingService = require('./services/billing');
await billingService.createInvoice(userId, data);

// Service PDF
const invoicePDFService = require('./services/invoice-pdf');
await invoicePDFService.generateInvoicePDF(invoiceId);
```

### Frontend
```jsx
// Page factures
import InvoicesPage from './pages/InvoicesPage';
<Route path="/invoices" element={<InvoicesPage />} />
```

### API
```bash
# Créer profil
POST /api/billing/profile

# Lister factures
GET /api/billing/invoices

# Télécharger PDF
GET /api/billing/invoices/:id/pdf

# Checkout Stripe
POST /api/billing/checkout/quota-pack
```

---

## 🔗 Dépendances

### NPM Packages
- `stripe@^14.0.0` - SDK Stripe
- `pdfkit@^0.14.0` - Génération PDF
- `express@^4.18.2` - Framework web
- `@supabase/supabase-js@^2.39.0` - Client Supabase

### Services externes
- Stripe (paiements)
- Supabase (base de données, auth)

---

*Système de facturation Faketect v2.1.0*  
*En béton armé ! 💪🏗️*
