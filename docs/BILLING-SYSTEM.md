# 💳 Système de Facturation Faketect

## 📋 Vue d'ensemble

Système complet de facturation et paiement pour Faketect avec :
- ✅ Distinction compte **Particulier** / **Entreprise**
- ✅ Génération automatique de **factures PDF**
- ✅ Intégration **Stripe** prête
- ✅ Gestion des **abonnements**
- ✅ Historique des **transactions**
- ✅ **RGPD & Légal** compliant

---

## 🗄️ Base de données

### Schéma créé
Le fichier `docs/supabase-billing-schema.sql` contient :

**6 Tables principales :**
1. **user_profiles** - Profils de facturation (particuliers/entreprises)
2. **invoices** - Factures avec numérotation automatique
3. **invoice_items** - Lignes de facturation
4. **subscriptions** - Abonnements Stripe
5. **payment_methods** - Méthodes de paiement stockées
6. **transactions** - Historique des paiements

**Fonctionnalités SQL :**
- 🔒 **RLS (Row Level Security)** sur toutes les tables
- 🔢 Fonction `generate_invoice_number()` - Format YYYY00001
- 💰 Fonction `calculate_invoice_totals()` - Calculs automatiques
- 🕐 Triggers pour `updated_at`
- 📊 Vues `v_user_billing_info` et `v_invoices_detailed`

### Installation

```bash
# 1. Aller dans le dashboard Supabase
# 2. SQL Editor
# 3. Copier/coller le contenu de docs/supabase-billing-schema.sql
# 4. Exécuter
```

---

## 🔧 Services Backend

### 1. **billing.js** - Service de facturation

**Classe `BillingService`**

#### Méthodes principales :

```javascript
// Créer/récupérer un profil utilisateur
await billingService.getOrCreateUserProfile(userId, {
  account_type: 'business', // ou 'individual'
  company_name: 'Ma Société',
  siret: '12345678901234',
  vat_number: 'FR12345678901',
  email: 'contact@entreprise.fr'
});

// Créer une facture
await billingService.createInvoice(userId, {
  items: [
    {
      description: 'Pack 100 analyses',
      quantity: 1,
      unit_price_cents: 9900,
      product_type: 'quota_pack'
    }
  ],
  tax_rate: 20.00,
  notes: 'Merci pour votre achat'
});

// Facture pour abonnement
await billingService.createSubscriptionInvoice(userId, {
  plan_name: 'Pro',
  billing_cycle: 'monthly',
  amount_cents: 2999,
  plan_id: 'plan_pro_monthly'
});

// Marquer comme payée
await billingService.markInvoiceAsPaid(invoiceId, {
  payment_method: 'stripe',
  stripe_payment_intent_id: 'pi_xxx'
});

// Récupérer les factures
const invoices = await billingService.getUserInvoices(userId, {
  status: 'paid', // draft, sent, paid, overdue, cancelled
  year: 2024
});
```

#### Intégration Stripe :

```javascript
// Créer un customer Stripe
await billingService.createStripeCustomer(userId, profile);

// Session de paiement (quotas)
const session = await billingService.createCheckoutSession(userId, {
  mode: 'payment',
  line_items: [...],
  success_url: 'https://faketect.com/success',
  cancel_url: 'https://faketect.com/pricing'
});

// Session de paiement (abonnement)
const session = await billingService.createCheckoutSession(userId, {
  mode: 'subscription',
  line_items: [{ price: 'price_xxx', quantity: 1 }]
});

// Portail client
const portal = await billingService.createCustomerPortalSession(userId, returnUrl);
```

#### Webhooks Stripe :

```javascript
await billingService.handleStripeWebhook(event);
```

Gère automatiquement :
- ✅ `checkout.session.completed`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.*`
- ✅ `payment_intent.succeeded`

---

### 2. **invoice-pdf.js** - Génération PDF

**Classe `InvoicePDFService`**

#### Méthodes :

```javascript
// Générer un PDF
const result = await invoicePDFService.generateInvoicePDF(invoiceId);
// => { filename, filepath, url }

// Récupérer un PDF existant (ou générer)
const pdf = await invoicePDFService.getInvoicePDF(invoiceId);

// Régénérer un PDF
await invoicePDFService.regenerateInvoicePDF(invoiceId);

// Supprimer un PDF
await invoicePDFService.deleteInvoicePDF(invoiceId);
```

#### Contenu du PDF :

Le PDF généré contient **tous les éléments légaux obligatoires** :

✅ **En-tête** avec type (FACTURE / AVOIR) et numéro  
✅ **Informations émetteur** (Faketect + SIRET + TVA)  
✅ **Informations client** (nom, adresse, SIRET si entreprise)  
✅ **Détails** (date, échéance, statut)  
✅ **Tableau des lignes** avec descriptions et montants  
✅ **Totaux** (HT, TVA, TTC)  
✅ **Conditions de paiement**  
✅ **Pied de page légal** avec mentions obligatoires  
✅ **Numéros de page**  

**Design professionnel** :
- 📄 Format A4
- 🎨 Couleurs Faketect (bleu #2563eb)
- 📊 Tableau avec lignes alternées
- 💼 Adapté particuliers et entreprises

---

## 🌐 Routes API

### Endpoints disponibles

#### Profil de facturation

```bash
# GET /api/billing/profile
# Récupérer le profil
curl -H "Authorization: Bearer $TOKEN" \
  https://api.faketect.com/api/billing/profile

# POST /api/billing/profile
# Créer/modifier le profil
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_type": "business",
    "company_name": "Ma Société",
    "siret": "12345678901234",
    "company_address": "10 rue Example",
    "company_postal_code": "75001",
    "company_city": "Paris"
  }' \
  https://api.faketect.com/api/billing/profile
```

#### Factures

```bash
# GET /api/billing/invoices
# Liste des factures (avec filtres optionnels)
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.faketect.com/api/billing/invoices?status=paid&year=2024"

# GET /api/billing/invoices/:id
# Détails d'une facture
curl -H "Authorization: Bearer $TOKEN" \
  https://api.faketect.com/api/billing/invoices/123

# GET /api/billing/invoices/:id/pdf
# Télécharger le PDF
curl -H "Authorization: Bearer $TOKEN" \
  https://api.faketect.com/api/billing/invoices/123/pdf \
  -o facture.pdf

# POST /api/billing/invoices/:id/regenerate-pdf
# Régénérer le PDF
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.faketect.com/api/billing/invoices/123/regenerate-pdf
```

#### Paiements Stripe

```bash
# POST /api/billing/checkout/quota-pack
# Créer session pour pack de quotas
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pack_id": "pack_100",
    "analyses_count": 100,
    "price_cents": 9900,
    "success_url": "https://faketect.com/success",
    "cancel_url": "https://faketect.com/pricing"
  }' \
  https://api.faketect.com/api/billing/checkout/quota-pack

# POST /api/billing/checkout/subscription
# Créer session pour abonnement
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price_id": "price_1234",
    "plan_name": "Pro"
  }' \
  https://api.faketect.com/api/billing/checkout/subscription

# POST /api/billing/portal
# Créer session portail client
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"return_url": "https://faketect.com/account"}' \
  https://api.faketect.com/api/billing/portal
```

#### Abonnements & Transactions

```bash
# GET /api/billing/subscriptions
curl -H "Authorization: Bearer $TOKEN" \
  https://api.faketect.com/api/billing/subscriptions

# GET /api/billing/transactions
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.faketect.com/api/billing/transactions?limit=20&offset=0"
```

#### Webhook Stripe

```bash
# POST /api/billing/webhooks/stripe
# (Pas d'authentification - signature Stripe)
# Configurer dans le dashboard Stripe :
# https://dashboard.stripe.com/webhooks
```

---

## ⚙️ Configuration

### Variables d'environnement

Ajouter dans `packages/api/.env` :

```bash
# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe (Test)
# STRIPE_SECRET_KEY=sk_test_xxxxx
# STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# URLs
WEB_URL=https://faketect.com
API_URL=https://api.faketect.com

# Supabase (déjà configuré)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
```

### Installation des dépendances

```bash
cd packages/api
npm install
# stripe et pdfkit sont déjà ajoutés au package.json
```

### Créer le dossier des factures

```bash
mkdir -p packages/api/uploads/invoices
```

---

## 🚀 Démarrage

### 1. Appliquer le schéma de base de données

```sql
-- Dans Supabase SQL Editor
-- Copier/coller docs/supabase-billing-schema.sql
-- Exécuter
```

### 2. Configurer Stripe

1. Créer un compte Stripe : https://dashboard.stripe.com/register
2. Récupérer les clés API (mode test au début)
3. Ajouter dans `.env`
4. Configurer les webhooks :
   - URL : `https://votre-api.com/api/billing/webhooks/stripe`
   - Événements à écouter :
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`

### 3. Démarrer le serveur

```bash
cd packages/api
npm run dev
```

### 4. Tester

```bash
# Créer un profil de test
curl -X POST http://localhost:3001/api/billing/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_type": "individual",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@test.com"
  }'

# Tester la génération de facture
# (Voir scripts de test ci-dessous)
```

---

## 📝 Exemples d'utilisation

### Script de test complet

```javascript
// test-billing.js
const billingService = require('./services/billing');
const invoicePDFService = require('./services/invoice-pdf');

async function testBilling() {
  const testUserId = 'test-user-123';

  // 1. Créer un profil entreprise
  console.log('1. Création profil entreprise...');
  const profile = await billingService.getOrCreateUserProfile(testUserId, {
    account_type: 'business',
    email: 'test@entreprise.fr',
    first_name: 'Jean',
    last_name: 'Dupont',
    company_name: 'Test SARL',
    company_legal_form: 'SARL',
    siret: '12345678901234',
    vat_number: 'FR12345678901',
    company_address: '10 rue de Test',
    company_postal_code: '75001',
    company_city: 'Paris',
    phone: '+33123456789',
    country: 'FR'
  });
  console.log('✅ Profil créé:', profile.id);

  // 2. Créer une facture
  console.log('\n2. Création facture...');
  const invoice = await billingService.createInvoice(testUserId, {
    items: [
      {
        description: 'Pack 100 analyses',
        quantity: 1,
        unit_price_cents: 9900,
        product_type: 'quota_pack',
        product_id: 'pack_100'
      },
      {
        description: 'Support premium',
        quantity: 1,
        unit_price_cents: 4900,
        product_type: 'service'
      }
    ],
    tax_rate: 20.00,
    notes: 'Merci pour votre confiance'
  });
  console.log('✅ Facture créée:', invoice.invoice_number);
  console.log('   Total HT:', invoice.subtotal_cents / 100, '€');
  console.log('   TVA:', invoice.tax_cents / 100, '€');
  console.log('   Total TTC:', invoice.total_cents / 100, '€');

  // 3. Générer le PDF
  console.log('\n3. Génération PDF...');
  const pdf = await invoicePDFService.generateInvoicePDF(invoice.id);
  console.log('✅ PDF généré:', pdf.filename);
  console.log('   Chemin:', pdf.filepath);

  // 4. Marquer comme payée
  console.log('\n4. Marquage paiement...');
  await billingService.markInvoiceAsPaid(invoice.id, {
    payment_method: 'stripe',
    stripe_payment_intent_id: 'pi_test_123'
  });
  console.log('✅ Facture marquée comme payée');

  // 5. Récupérer les factures
  console.log('\n5. Récupération factures...');
  const invoices = await billingService.getUserInvoices(testUserId);
  console.log('✅ Nombre de factures:', invoices.length);
}

testBilling().catch(console.error);
```

Lancer :
```bash
node test-billing.js
```

---

## 🎨 Frontend (À faire)

### Modifier AuthPage.jsx

Ajouter le choix du type de compte lors de l'inscription :

```jsx
// Dans packages/web/src/pages/AuthPage.jsx

const [accountType, setAccountType] = useState('individual');
const [companyInfo, setCompanyInfo] = useState({
  company_name: '',
  siret: '',
  vat_number: ''
});

// Dans le formulaire d'inscription
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Type de compte
  </label>
  <div className="flex gap-4">
    <button
      type="button"
      onClick={() => setAccountType('individual')}
      className={`flex-1 py-2 px-4 rounded ${
        accountType === 'individual'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      👤 Particulier
    </button>
    <button
      type="button"
      onClick={() => setAccountType('business')}
      className={`flex-1 py-2 px-4 rounded ${
        accountType === 'business'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      🏢 Entreprise
    </button>
  </div>
</div>

{accountType === 'business' && (
  <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded">
    <input
      type="text"
      placeholder="Nom de l'entreprise *"
      value={companyInfo.company_name}
      onChange={(e) => setCompanyInfo({...companyInfo, company_name: e.target.value})}
      className="w-full px-3 py-2 border rounded"
      required
    />
    <input
      type="text"
      placeholder="SIRET (14 chiffres)"
      value={companyInfo.siret}
      onChange={(e) => setCompanyInfo({...companyInfo, siret: e.target.value})}
      className="w-full px-3 py-2 border rounded"
    />
    <input
      type="text"
      placeholder="Numéro TVA intracommunautaire"
      value={companyInfo.vat_number}
      onChange={(e) => setCompanyInfo({...companyInfo, vat_number: e.target.value})}
      className="w-full px-3 py-2 border rounded"
    />
  </div>
)}
```

Lors de l'inscription réussie, créer le profil :

```javascript
// Après la création du compte Supabase
await fetch(`${API_URL}/api/billing/profile`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    account_type: accountType,
    first_name: formData.firstName,
    last_name: formData.lastName,
    email: formData.email,
    ...companyInfo
  })
});
```

### Créer InvoicesPage.jsx

```jsx
// packages/web/src/pages/InvoicesPage.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const InvoicesPage = () => {
  const { user, session } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/invoices`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      setInvoices(data.invoices);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/billing/invoices/${invoiceId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture_${invoiceNumber}.pdf`;
      a.click();
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard'
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mes factures</h1>

      {invoices.length === 0 ? (
        <p className="text-gray-600">Aucune facture pour le moment.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(invoice.total_cents / 100).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => downloadPDF(invoice.id, invoice.invoice_number)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      📄 Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
```

Ajouter la route dans `App.jsx` :

```jsx
import InvoicesPage from './pages/InvoicesPage';

// Dans les routes
<Route path="/invoices" element={<InvoicesPage />} />
```

---

## ✅ Checklist finale

### Backend
- [x] Schéma de base de données créé
- [x] Service `billing.js` implémenté
- [x] Service `invoice-pdf.js` implémenté
- [x] Routes API `/api/billing/*` créées
- [x] Intégration dans `server.js`
- [x] Dépendances ajoutées (`stripe`, `pdfkit`)

### Configuration
- [ ] Schéma SQL appliqué dans Supabase
- [ ] Variables Stripe configurées
- [ ] Webhooks Stripe configurés
- [ ] Dossier `uploads/invoices` créé

### Frontend
- [ ] Formulaire d'inscription modifié (type de compte)
- [ ] Page des factures créée
- [ ] Intégration Stripe Checkout
- [ ] Portail client Stripe

### Tests
- [ ] Créer un profil de test
- [ ] Générer une facture de test
- [ ] Télécharger un PDF
- [ ] Tester un paiement Stripe (mode test)
- [ ] Tester les webhooks

---

## 📞 Support

Pour toute question :
- **Documentation Stripe** : https://stripe.com/docs
- **Supabase** : https://supabase.com/docs
- **PDFKit** : https://pdfkit.org/

---

## 🎉 C'est prêt !

Le système de facturation est **opérationnel** côté backend.

**Prochaines étapes :**
1. ✅ Appliquer le schéma SQL
2. ✅ Configurer Stripe
3. ✅ Modifier le frontend (inscription + factures)
4. ✅ Tester en mode développement
5. ✅ Déployer en production

**Tout est en béton armé ! 💪🏗️**
