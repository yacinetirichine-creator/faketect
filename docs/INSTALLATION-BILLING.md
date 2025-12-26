# 🚀 Installation Complète du Système de Facturation Faketect

## ✅ Fichiers créés

### Backend (packages/api/)
```
packages/api/
├── services/
│   ├── billing.js                 ✅ Service principal de facturation
│   └── invoice-pdf.js             ✅ Génération de PDF
├── routes/
│   └── billing.js                 ✅ Routes API /api/billing/*
├── server.js                      ✅ Modifié (routes intégrées)
└── package.json                   ✅ Modifié (stripe ajouté)
```

### Frontend (packages/web/)
```
packages/web/src/
├── pages/
│   ├── AuthPage.jsx               ✅ Modifié (type de compte)
│   └── InvoicesPage.jsx           ✅ Nouvelle page factures
├── components/
│   └── Header.jsx                 ✅ Modifié (lien factures)
└── App.jsx                        ✅ Modifié (route /invoices)
```

### Documentation (docs/)
```
docs/
├── supabase-billing-schema.sql    ✅ Schéma SQL complet
├── BILLING-SYSTEM.md              ✅ Documentation système
└── INSTALLATION-BILLING.md        ✅ Ce fichier
```

---

## 📦 Installation - Étape par étape

### 1️⃣ Backend - Dépendances

```bash
cd packages/api
npm install
```

Vérifier que `stripe` et `pdfkit` sont installés :
```bash
npm list stripe pdfkit
```

### 2️⃣ Base de données - Supabase

#### Appliquer le schéma SQL

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (icône ⚡ dans le menu)
4. Cliquer sur **New Query**
5. Copier/coller le contenu de `docs/supabase-billing-schema.sql`
6. Cliquer sur **Run** ou `Ctrl+Enter`

**✅ Vérification :** Vous devriez voir :
```
Success. No rows returned
```

#### Vérifier les tables créées

Dans l'onglet **Table Editor**, vous devriez voir :
- ✅ `user_profiles`
- ✅ `invoices`
- ✅ `invoice_items`
- ✅ `subscriptions`
- ✅ `payment_methods`
- ✅ `transactions`

### 3️⃣ Configuration Stripe

#### Créer un compte Stripe

1. Aller sur https://dashboard.stripe.com/register
2. Créer un compte (ou se connecter)
3. **Mode Test** : Utiliser les clés de test au début

#### Récupérer les clés API

Dans le dashboard Stripe :
1. Cliquer sur **Developers** (en haut à droite)
2. Cliquer sur **API keys**
3. Copier :
   - **Publishable key** (commence par `pk_test_`)
   - **Secret key** (commence par `sk_test_`)

#### Configurer les webhooks

1. Dans **Developers** → **Webhooks**
2. Cliquer sur **Add endpoint**
3. **Endpoint URL** : `https://votre-domaine.com/api/billing/webhooks/stripe`
   - Pour dev local : utiliser **Stripe CLI** (voir plus bas)
4. **Events to send** : Sélectionner :
   - ✅ `checkout.session.completed`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `payment_intent.succeeded`
5. Copier le **Signing secret** (commence par `whsec_`)

### 4️⃣ Variables d'environnement

Éditer `packages/api/.env` :

```bash
# Stripe - Mode TEST (pour commencer)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# URLs
WEB_URL=http://localhost:5173
API_URL=http://localhost:3001

# Supabase (déjà configuré normalement)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Autres (existants)
SIGHTENGINE_USER=xxxxx
SIGHTENGINE_SECRET=xxxxx
```

**⚠️ Important :** Ne jamais commit le `.env` dans Git !

### 5️⃣ Créer les dossiers nécessaires

```bash
cd packages/api
mkdir -p uploads/invoices
```

Vérifier :
```bash
ls -la uploads/
```

Devrait afficher :
```
drwxr-xr-x  invoices/
drwxr-xr-x  reports/
drwxr-xr-x  temp/
```

### 6️⃣ Frontend - Environnement

Éditer `packages/web/.env` :

```bash
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Publishable Key (pour le frontend si checkout direct)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 Tests

### Test 1 : Démarrer le serveur

```bash
cd packages/api
npm run dev
```

Vous devriez voir :
```
✅ Server running on port 3001
⚠️  Stripe non configuré - fonctionnalités de paiement désactivées
   (si vous n'avez pas encore mis STRIPE_SECRET_KEY)
```

### Test 2 : Démarrer le frontend

```bash
cd packages/web
npm run dev
```

Ouvrir http://localhost:5173

### Test 3 : Inscription avec type de compte

1. Aller sur http://localhost:5173/signup
2. Remplir le formulaire
3. **Choisir "Entreprise"**
4. Remplir les informations entreprise
5. S'inscrire

**✅ Vérification :** Dans Supabase → Table Editor → `user_profiles`, vous devriez voir votre profil avec :
- `account_type = 'business'`
- `company_name` rempli
- Autres champs entreprise

### Test 4 : Créer une facture de test

Créer un fichier `packages/api/test-invoice.js` :

```javascript
require('dotenv').config();
const billingService = require('./services/billing');
const invoicePDFService = require('./services/invoice-pdf');

async function testInvoice() {
  // Remplacer par votre user_id (récupéré dans Supabase auth.users)
  const userId = 'VOTRE-USER-ID-ICI';

  try {
    console.log('1. Création profil de test...');
    const profile = await billingService.getOrCreateUserProfile(userId, {
      account_type: 'business',
      email: 'test@entreprise.fr',
      first_name: 'Jean',
      last_name: 'Dupont',
      company_name: 'Test SARL',
      siret: '12345678901234',
      vat_number: 'FR12345678901',
      company_address: '10 rue de Test',
      company_postal_code: '75001',
      company_city: 'Paris',
      phone: '+33123456789'
    });
    console.log('✅ Profil:', profile.id);

    console.log('\n2. Création facture...');
    const invoice = await billingService.createInvoice(userId, {
      items: [
        {
          description: 'Pack 100 analyses',
          quantity: 1,
          unit_price_cents: 9900,
          product_type: 'quota_pack'
        }
      ],
      tax_rate: 20.00,
      notes: 'Merci pour votre confiance'
    });
    console.log('✅ Facture:', invoice.invoice_number);
    console.log('   Total TTC:', (invoice.total_cents / 100).toFixed(2), '€');

    console.log('\n3. Génération PDF...');
    const pdf = await invoicePDFService.generateInvoicePDF(invoice.id);
    console.log('✅ PDF:', pdf.filename);
    console.log('   Chemin:', pdf.filepath);

    console.log('\n4. Marquage paiement...');
    await billingService.markInvoiceAsPaid(invoice.id, {
      payment_method: 'stripe',
      stripe_payment_intent_id: 'pi_test_123'
    });
    console.log('✅ Facture payée');

    console.log('\n✨ Test réussi !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

testInvoice();
```

Lancer :
```bash
node test-invoice.js
```

**✅ Vérification :**
- Script s'exécute sans erreur
- Facture créée dans Supabase (`invoices`)
- PDF généré dans `uploads/invoices/`
- Ouvrir le PDF et vérifier le contenu

### Test 5 : Page des factures

1. Se connecter sur le frontend
2. Cliquer sur **Factures** dans le header
3. Voir la liste des factures
4. Cliquer sur **Télécharger PDF**

---

## 🔧 Développement local avec Stripe CLI

Pour tester les webhooks en local :

### Installer Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Se connecter

```bash
stripe login
```

### Écouter les webhooks

```bash
stripe listen --forward-to localhost:3001/api/billing/webhooks/stripe
```

Copier le **webhook signing secret** affiché (commence par `whsec_`) et le mettre dans `.env` :
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Tester un webhook

```bash
stripe trigger checkout.session.completed
```

---

## 🚀 Déploiement en production

### 1. Passer en mode production Stripe

Dans le dashboard Stripe :
1. Toggle **View test data** → **OFF**
2. Récupérer les vraies clés API
3. Créer les webhooks pour l'URL de production
4. Mettre à jour les `.env` de production

### 2. Variables d'environnement production

```bash
# Production .env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
WEB_URL=https://faketect.com
API_URL=https://api.faketect.com
```

### 3. Compléter les mentions légales

Éditer les fichiers :
- `docs/legal/MENTIONS-LEGALES.md`
- `packages/api/services/legal-service.js`
- `packages/api/services/invoice-pdf.js`

Remplacer les placeholders :
- `[ADRESSE COMPLÈTE]` → Votre adresse
- `[SIRET]` → Votre SIRET
- `[NUMÉRO TVA]` → Votre numéro de TVA

### 4. Vérifier la sécurité

```bash
# Vérifier que .env est dans .gitignore
cat .gitignore | grep .env

# Doit afficher :
# .env
# .env.local
```

---

## 📋 Checklist finale

### Backend
- [ ] ✅ Dépendances installées (`stripe`, `pdfkit`)
- [ ] ✅ Schéma SQL appliqué dans Supabase
- [ ] ✅ Variables Stripe configurées dans `.env`
- [ ] ✅ Dossier `uploads/invoices` créé
- [ ] ✅ Serveur démarre sans erreur

### Frontend
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ Inscription fonctionne avec choix du type
- [ ] ✅ Page factures accessible et affiche les données
- [ ] ✅ Téléchargement PDF fonctionne

### Stripe
- [ ] ✅ Compte créé
- [ ] ✅ Clés API copiées
- [ ] ✅ Webhooks configurés (ou Stripe CLI en dev)
- [ ] ✅ Test de paiement réussi

### Légal
- [ ] ⏳ Informations entreprise complétées dans les fichiers
- [ ] ⏳ Mentions légales révisées par un avocat (recommandé)

### Production
- [ ] ⏳ Stripe en mode live
- [ ] ⏳ Webhooks production configurés
- [ ] ⏳ Variables d'environnement production
- [ ] ⏳ Tests end-to-end en production

---

## 🆘 Dépannage

### Erreur : "Stripe non configuré"

**Cause :** `STRIPE_SECRET_KEY` manquante

**Solution :**
```bash
# Vérifier .env
cat packages/api/.env | grep STRIPE_SECRET_KEY
```

Si vide, ajouter la clé depuis Stripe dashboard.

### Erreur : "relation "user_profiles" does not exist"

**Cause :** Schéma SQL non appliqué

**Solution :**
1. Aller dans Supabase SQL Editor
2. Exécuter `docs/supabase-billing-schema.sql`

### Erreur : "No such file or directory: uploads/invoices"

**Cause :** Dossier non créé

**Solution :**
```bash
cd packages/api
mkdir -p uploads/invoices
```

### Les webhooks ne fonctionnent pas en local

**Cause :** Stripe ne peut pas atteindre localhost

**Solution :**
```bash
# Utiliser Stripe CLI
stripe listen --forward-to localhost:3001/api/billing/webhooks/stripe
```

### Le PDF ne se génère pas

**Cause :** Dépendance `pdfkit` manquante

**Solution :**
```bash
cd packages/api
npm install pdfkit
```

### Erreur lors de l'inscription

**Cause :** API non joignable ou erreur réseau

**Solution :**
1. Vérifier que l'API tourne : http://localhost:3001/api/health
2. Vérifier `VITE_API_URL` dans `packages/web/.env`
3. Regarder la console du navigateur (F12)

---

## 📞 Support

- **Stripe Documentation** : https://stripe.com/docs
- **Supabase Documentation** : https://supabase.com/docs
- **PDFKit Documentation** : https://pdfkit.org/

---

## 🎉 Félicitations !

Le système de facturation est maintenant **complètement opérationnel** ! 🚀

**Prochaines étapes suggérées :**
1. ✅ Tester tous les flux (inscription → facture → paiement)
2. ✅ Personnaliser le design des factures PDF
3. ✅ Ajouter des packs de quotas prédéfinis
4. ✅ Créer des abonnements dans Stripe
5. ✅ Implémenter les emails de notification
6. ✅ Ajouter un système de promotion/coupons

**Système en béton armé complet ! 💪🏗️**
