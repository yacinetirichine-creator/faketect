# ✅ Tests & Validation - FakeTect

> Guide complet pour tester tous les plans, quotas, paiements et emails avant lancement

---

## 🎯 Checklist Globale

- [ ] Plans & Quotas (FREE → ENTERPRISE)
- [ ] Paiements Stripe (mode live)
- [ ] Emails (confirmation, analyses, erreurs)
- [ ] Sécurité & permissions
- [ ] Performance & erreurs

---

## 1️⃣ TESTS DES PLANS & QUOTAS

### Plan FREE (Gratuit)

**Configuration attendue** :
```
- Prix : 0€
- Analyses : 3/jour
- Historique : 7 jours
- Features : Images uniquement
```

#### Tests à effectuer :

**✅ Test 1.1 - Inscription utilisateur FREE**
```bash
# URL : http://localhost:5173/register
# Actions :
1. S'inscrire avec email : test-free@faketect.com
2. Vérifier email de confirmation reçu
3. Confirmer email et se connecter
4. Vérifier plan affiché : "FREE"
```

**Résultat attendu** :
- ✅ Email reçu dans les 2 minutes
- ✅ Dashboard affiche "Plan : FREE"
- ✅ Quota affiché : "0/3 analyses aujourd'hui"

**✅ Test 1.2 - Quota quotidien FREE (3/jour)**
```bash
# Actions :
1. Analyser image 1 → ✅ OK (quota 1/3)
2. Analyser image 2 → ✅ OK (quota 2/3)
3. Analyser image 3 → ✅ OK (quota 3/3)
4. Analyser image 4 → ❌ ERREUR attendue
```

**Résultat attendu** :
- ✅ 3 premières analyses passent
- ❌ 4ème analyse refusée avec message : "Quota quotidien atteint (3/3)"
- ✅ Email envoyé à l'utilisateur (quota atteint)

**✅ Test 1.3 - Réinitialisation quotidienne**
```bash
# Méthode manuelle (pour test rapide) :
# Option A : Modifier la DB
psql $DATABASE_URL
UPDATE "Analysis" SET "createdAt" = NOW() - INTERVAL '25 hours' 
WHERE "userId" = 'user-id-test-free';

# Option B : Attendre 24h réelles (test production)
```

**Résultat attendu** :
- ✅ Après 24h, quota revient à 0/3
- ✅ Utilisateur peut analyser à nouveau

**✅ Test 1.4 - Historique 7 jours FREE**
```bash
# Actions :
1. Créer 5 analyses datées de -8 jours
2. Créer 3 analyses datées de -5 jours
3. Accéder à l'historique
```

**SQL pour test** :
```sql
-- Analyses > 7 jours (doivent être masquées)
INSERT INTO "Analysis" ("userId", "fileName", "aiScore", "createdAt")
VALUES ('user-id', 'old.jpg', 50.0, NOW() - INTERVAL '8 days');

-- Analyses < 7 jours (visibles)
INSERT INTO "Analysis" ("userId", "fileName", "aiScore", "createdAt")
VALUES ('user-id', 'recent.jpg', 30.0, NOW() - INTERVAL '5 days');
```

**Résultat attendu** :
- ✅ Seulement 3 analyses récentes visibles
- ❌ 5 analyses > 7 jours masquées

---

### Plan STARTER (12€/mois)

**Configuration attendue** :
```
- Prix : 12€/mois (100€/an)
- Analyses : 100/mois
- Historique : 30 jours
- Features : Images + Documents/URL
```

#### Tests à effectuer :

**✅ Test 2.1 - Upgrade FREE → STARTER**
```bash
# Actions :
1. Se connecter avec compte FREE
2. Aller sur /pricing
3. Cliquer "Souscrire" sur STARTER
4. Remplir carte test Stripe : 4242 4242 4242 4242
5. Date : 12/34, CVC : 123
6. Valider paiement
```

**Résultat attendu** :
- ✅ Redirection vers Stripe Checkout
- ✅ Paiement accepté
- ✅ Redirection vers /dashboard
- ✅ Plan affiché : "STARTER"
- ✅ Quota : "0/100 analyses ce mois"
- ✅ Email confirmation paiement reçu

**✅ Test 2.2 - Quota mensuel STARTER (100/mois)**
```bash
# Script pour simuler 100 analyses :
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/analysis \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test-image.jpg"
  echo "Analyse $i/100"
done

# 101ème analyse :
curl -X POST http://localhost:3001/api/analysis \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test-image.jpg"
```

**Résultat attendu** :
- ✅ 100 premières analyses OK
- ❌ 101ème refuse avec "Quota mensuel atteint"

**✅ Test 2.3 - Historique 30 jours STARTER**
```bash
# Créer analyses à différentes dates
# Vérifier visibilité jusqu'à -30 jours
```

---

### Plan PRO (34€/mois)

**Configuration attendue** :
```
- Prix : 34€/mois (285€/an)
- Analyses : 500/mois
- Historique : 90 jours
- Features : + Batch 20 + API
```

#### Tests à effectuer :

**✅ Test 3.1 - Upgrade STARTER → PRO**
```bash
# Depuis dashboard STARTER :
1. Cliquer "Upgrade to PRO"
2. Payer différence proratisée
3. Vérifier nouveau quota : 500/mois
```

**✅ Test 3.2 - Batch processing (20 fichiers)**
```bash
# Upload 20 images simultanément
# Vérifier traitement en parallèle
```

**✅ Test 3.3 - API REST access**
```bash
# Générer API key depuis dashboard
curl -X POST https://api.faketect.com/v1/analyze \
  -H "X-API-Key: $API_KEY" \
  -F "file=@image.jpg"
```

---

### Plan BUSINESS (89€/mois)

**Configuration attendue** :
```
- Prix : 89€/mois (750€/an)
- Analyses : 2000/mois
- Historique : illimité
- Features : + Batch 50 + Certificats PDF
```

#### Tests à effectuer :

**✅ Test 4.1 - Certificats PDF**
```bash
# Analyser une image
# Télécharger certificat PDF
# Vérifier :
- Header bleu professionnel
- Sections bien alignées
- Footer avec branding
- Empreinte SHA-256
```

**✅ Test 4.2 - Quota 2000/mois**
```bash
# Simuler 2000 analyses
# Vérifier quota atteint à 2001
```

---

### Plan ENTERPRISE (249€/mois)

**Configuration attendue** :
```
- Prix : 249€/mois (2090€/an)
- Analyses : illimitées
- Historique : illimité
- Features : SLA 99.9% + Support 24/7 + White-label
```

#### Tests à effectuer :

**✅ Test 5.1 - Analyses illimitées**
```bash
# Faire 3000+ analyses
# Aucune limitation ne doit apparaître
```

**✅ Test 5.2 - Support prioritaire**
```bash
# Email : enterprise-support@faketect.com
# Vérifier réponse < 1h
```

---

## 2️⃣ TESTS PAIEMENTS STRIPE

### Configuration Live Mode

**⚠️ AVANT DE TESTER** :
```bash
# Backend .env
STRIPE_SECRET_KEY=sk_live_xxx  # Clé LIVE (pas test)
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend .env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Tests paiement réels

**✅ Test 6.1 - Carte bancaire valide**
```bash
# Utiliser vraie carte (petit montant : 12€)
# Plan STARTER pour tester
```

**Résultat attendu** :
- ✅ Paiement accepté
- ✅ Subscription créée dans Stripe Dashboard
- ✅ User.plan mis à jour en DB
- ✅ Email confirmation reçu
- ✅ Webhook reçu et traité

**✅ Test 6.2 - Carte refusée**
```bash
# Carte avec fonds insuffisants
```

**Résultat attendu** :
- ❌ Paiement refusé avec message clair
- ✅ Plan reste "FREE"
- ✅ Email erreur envoyé

**✅ Test 6.3 - Renouvellement automatique**
```bash
# Attendre 1 mois (ou forcer dans Stripe)
# Vérifier paiement automatique
```

**Résultat attendu** :
- ✅ Stripe charge automatiquement
- ✅ Email facture envoyé
- ✅ Subscription reste active

**✅ Test 6.4 - Annulation**
```bash
# Depuis dashboard :
1. Cliquer "Annuler abonnement"
2. Confirmer
```

**Résultat attendu** :
- ✅ Subscription cancellée dans Stripe
- ✅ Plan reste actif jusqu'à fin période
- ✅ Email confirmation annulation

**✅ Test 6.5 - Webhooks Stripe**
```bash
# Vérifier endpoint : /api/stripe/webhook
# Events à tester :
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

**Logs attendus** :
```bash
# Backend logs
✅ Webhook reçu : checkout.session.completed
✅ User plan updated: FREE → STARTER
✅ Email sent: subscription_confirmed
```

---

## 3️⃣ TESTS EMAILS

### Configuration Email

**Vérifier .env** :
```bash
EMAIL_USER=contact@faketect.com
EMAIL_PASS=glhtcjxyuwphfmuz  # App password Google
EMAIL_FROM=no-reply@faketect.com
```

### Tests emails automatiques

**✅ Test 7.1 - Email confirmation inscription**
```bash
# S'inscrire avec : test-email-1@gmail.com
```

**Email attendu** :
```
Objet : Bienvenue sur FakeTect
De : no-reply@faketect.com
À : test-email-1@gmail.com

Contenu :
- Titre : "Bienvenue !"
- Lien confirmation : https://faketect.com/confirm?token=xxx
- Logo FakeTect
- Couleurs brand (indigo)
```

**✅ Test 7.2 - Email analyse terminée**
```bash
# Faire analyse image
```

**Email attendu** :
```
Objet : Votre analyse est prête
Contenu :
- Score IA : XX%
- Verdict : Réel/Incertain/Fake
- Lien vers résultat
- Bouton télécharger certificat
```

**✅ Test 7.3 - Email quota atteint**
```bash
# Atteindre quota quotidien/mensuel
```

**Email attendu** :
```
Objet : Quota atteint - Passez à un plan supérieur
Contenu :
- Message : "Vous avez utilisé X/X analyses"
- CTA : "Upgrade vers STARTER"
- Comparatif plans
```

**✅ Test 7.4 - Email erreur analyse**
```bash
# Upload fichier corrompu
```

**Email attendu** :
```
Objet : Erreur lors de votre analyse
Contenu :
- Explication erreur
- Suggestions solutions
- Lien support
```

**✅ Test 7.5 - Email paiement réussi**
```bash
# Souscrire à STARTER
```

**Email attendu** :
```
Objet : Paiement confirmé - Bienvenue dans STARTER
Contenu :
- Montant payé : 12€
- Plan activé : STARTER
- Date renouvellement : JJ/MM/AAAA
- Facture PDF (attachement)
```

**✅ Test 7.6 - Email paiement échoué**
```bash
# Simuler échec paiement
```

**Email attendu** :
```
Objet : Échec du paiement - Action requise
Contenu :
- Raison échec
- Lien mettre à jour carte
- Délai avant suspension
```

---

## 4️⃣ TESTS SÉCURITÉ

**✅ Test 8.1 - Admin access control**
```bash
# Tenter accès /admin sans role ADMIN
curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Résultat attendu** :
- ❌ 403 Forbidden
- Message : "Admin access required"

**✅ Test 8.2 - JWT expiration**
```bash
# Attendre expiration token (24h)
# Tenter requête avec token expiré
```

**Résultat attendu** :
- ❌ 401 Unauthorized
- Redirection vers /login

**✅ Test 8.3 - CORS protection**
```bash
# Requête depuis domaine non autorisé
curl -X POST https://api.faketect.com/api/analysis \
  -H "Origin: https://malicious-site.com"
```

**Résultat attendu** :
- ❌ CORS error
- Header Access-Control-Allow-Origin absent

**✅ Test 8.4 - SQL Injection**
```bash
# Tenter injection dans login
POST /api/auth/login
{
  "email": "admin' OR '1'='1",
  "password": "anything"
}
```

**Résultat attendu** :
- ❌ Login échoue
- Aucune donnée leakée

**✅ Test 8.5 - File upload validation**
```bash
# Upload fichier malveillant (script.php, exe, etc.)
curl -X POST http://localhost:3001/api/analysis \
  -F "file=@malware.exe"
```

**Résultat attendu** :
- ❌ Upload refusé
- Message : "Type de fichier non autorisé"

---

## 5️⃣ TESTS PERFORMANCE

**✅ Test 9.1 - Temps réponse API**
```bash
# Mesurer temps endpoints critiques
time curl http://localhost:3001/api/health
time curl http://localhost:3001/api/analysis/history
```

**Seuils attendus** :
- /health : < 50ms
- /analysis/history : < 200ms
- /analysis (upload) : < 3s

**✅ Test 9.2 - Upload fichiers lourds**
```bash
# Image 10MB
# Image 20MB (limite)
# Image 25MB (refusé)
```

**✅ Test 9.3 - Charge simultanée**
```bash
# 100 requêtes simultanées
ab -n 100 -c 10 http://localhost:3001/api/health
```

**Résultat attendu** :
- ✅ 0% erreurs
- ✅ Temps moyen < 100ms

---

## 6️⃣ TESTS MONITORING

**✅ Test 10.1 - Sentry error tracking**
```bash
# Déclencher erreur volontaire
throw new Error('Test Sentry monitoring');
```

**Vérifier** :
- ✅ Erreur apparaît dans Sentry Dashboard
- ✅ Stack trace complète
- ✅ User context inclus

**✅ Test 10.2 - Email alerts**
```bash
# Vérifier notifications :
- Quota atteint
- Paiement échoué
- Erreur analyse
```

---

## 📊 MATRICE DE TESTS

| Test | FREE | STARTER | PRO | BUSINESS | ENTERPRISE |
|------|------|---------|-----|----------|------------|
| Quota quotidien | ✅ 3 | - | - | - | - |
| Quota mensuel | - | ✅ 100 | ✅ 500 | ✅ 2000 | ✅ ∞ |
| Historique | ✅ 7j | ✅ 30j | ✅ 90j | ✅ ∞ | ✅ ∞ |
| Images | ✅ | ✅ | ✅ | ✅ | ✅ |
| Documents/URL | ❌ | ✅ | ✅ | ✅ | ✅ |
| Batch | ❌ | ❌ | ✅ 20 | ✅ 50 | ✅ ∞ |
| API | ❌ | ❌ | ✅ | ✅ | ✅ |
| Certificats | ❌ | ❌ | ❌ | ✅ | ✅ |
| Support | Email | Email | Email | Email | 24/7 |

---

## 🚀 SCRIPT DE TEST AUTOMATISÉ

```bash
#!/bin/bash
# test-all.sh

echo "🧪 Tests FakeTect - Validation complète"
echo "======================================"

# 1. Tests Plans
echo "📋 Test 1/6 : Plans & Quotas..."
npm run test:plans

# 2. Tests Stripe
echo "💳 Test 2/6 : Paiements Stripe..."
npm run test:payments

# 3. Tests Emails
echo "📧 Test 3/6 : Emails..."
npm run test:emails

# 4. Tests Sécurité
echo "🔒 Test 4/6 : Sécurité..."
npm run test:security

# 5. Tests Performance
echo "⚡ Test 5/6 : Performance..."
npm run test:performance

# 6. Tests E2E
echo "🌐 Test 6/6 : End-to-End..."
npm run test:e2e

echo ""
echo "✅ Tous les tests terminés !"
echo "📊 Voir rapport : ./test-results.html"
```

---

## 📝 RAPPORT DE TEST

**Template à remplir** :

```markdown
# Rapport de validation - [DATE]

## ✅ Tests réussis
- [ ] Plan FREE (3/jour)
- [ ] Plan STARTER (100/mois)
- [ ] Plan PRO (500/mois)
- [ ] Plan BUSINESS (2000/mois)
- [ ] Plan ENTERPRISE (illimité)
- [ ] Paiements Stripe live
- [ ] Emails confirmation
- [ ] Emails analyses
- [ ] Webhooks Stripe
- [ ] Sécurité admin
- [ ] Performance < 3s

## ❌ Tests échoués
- Liste des problèmes détectés

## 🐛 Bugs trouvés
1. [Bug description]
   - Sévérité : Critique/Majeur/Mineur
   - Étapes reproduction
   - Fix proposé

## ✨ Recommandations
- Améliorations suggérées
```

---

## 🎯 CHECKLIST FINALE AVANT LANCEMENT

- [ ] Tous les plans testés en production
- [ ] Paiements Stripe mode LIVE validés
- [ ] Emails envoyés et reçus correctement
- [ ] Webhooks Stripe fonctionnels
- [ ] Quotas respectés (quotidien + mensuel)
- [ ] Historique filtré par plan
- [ ] Admin dashboard accessible uniquement par ADMIN
- [ ] Certificats PDF générés correctement
- [ ] Sentry capture les erreurs
- [ ] Performance < 3s pour analyses
- [ ] Mobile/tablette responsive
- [ ] Multi-langue (9 langues)
- [ ] SEO meta tags présents
- [ ] Security headers configurés

---

**🚀 PRÊT POUR LE LANCEMENT !**
