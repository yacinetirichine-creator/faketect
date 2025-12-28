# 🚀 Guide Rapide - Tests & Validation FakeTect

> **Objectif** : Valider tous les plans, paiements et emails avant lancement en production

---

## ⚡ Démarrage Rapide (5 minutes)

### 1. Lancer le backend
```bash
cd backend
node src/index.js
# Attendre : "🚀 FakeTect API: http://localhost:3001"
```

### 2. Lancer les tests automatiques
```bash
cd ..
./test-validation.sh
```

### 3. Voir les résultats
```
✅ Réussis  : 11/17
❌ Échoués  : 6/17
```

---

## 📋 Tests Manuels Prioritaires

### Test 1 : Plan FREE (5 min)

```bash
# 1. S'inscrire
Naviguer vers : http://localhost:5173/register
Email : test-free@exemple.com
Password : Test1234!

# 2. Vérifier quota
- Dashboard affiche : "0/3 analyses aujourd'hui"

# 3. Faire 3 analyses
- Upload image 1 → OK (1/3)
- Upload image 2 → OK (2/3)  
- Upload image 3 → OK (3/3)
- Upload image 4 → ❌ "Quota atteint"

# ✅ Test réussi si 4ème refusée
```

---

### Test 2 : Paiement STARTER (10 min)

```bash
# 1. Aller sur Pricing
http://localhost:5173/pricing

# 2. Cliquer "Souscrire" STARTER (12€)

# 3. Carte test Stripe
Numéro : 4242 4242 4242 4242
Date : 12/34
CVC : 123
Code postal : 75001

# 4. Vérifier
- ✅ Paiement accepté
- ✅ Redirection dashboard
- ✅ Plan affiché : "STARTER"
- ✅ Quota : "0/100 analyses ce mois"
- ✅ Email confirmation reçu (dans 2 min)

# ⚠️ IMPORTANT : Utiliser mode TEST Stripe
# Backend .env : STRIPE_SECRET_KEY=sk_test_...
```

---

### Test 3 : Emails (5 min)

```bash
# Vérifier boîte email (contact@faketect.com)

1. Email confirmation inscription
   - ✅ Reçu dans < 2 min
   - ✅ Design professionnel
   - ✅ Logo FakeTect
   - ✅ Lien de confirmation

2. Email analyse terminée
   - ✅ Score IA affiché
   - ✅ Verdict (Réel/Incertain/Fake)
   - ✅ Bouton "Voir le résultat"

3. Email quota atteint
   - ✅ Après 3ème analyse (FREE)
   - ✅ CTA "Upgrade vers STARTER"
```

---

## 🔍 Tests Approfondis (30 min)

### Checklist Complète

**Plans** :
- [ ] FREE : 3/jour, historique 7j
- [ ] STARTER : 100/mois, historique 30j
- [ ] PRO : 500/mois, historique 90j
- [ ] BUSINESS : 2000/mois, historique ∞
- [ ] ENTERPRISE : ∞, support 24/7

**Paiements** :
- [ ] Checkout Stripe fonctionne
- [ ] Subscription créée en DB
- [ ] Email confirmation envoyé
- [ ] Webhook traité
- [ ] Annulation fonctionne

**Emails** :
- [ ] Confirmation inscription
- [ ] Analyse terminée
- [ ] Quota atteint
- [ ] Paiement réussi
- [ ] Paiement échoué

**Sécurité** :
- [ ] Admin access protégé (403)
- [ ] JWT expiration (24h)
- [ ] File upload validé
- [ ] CORS configuré

**Performance** :
- [ ] API < 200ms
- [ ] Upload < 3s
- [ ] Dashboard responsive

---

## 🐛 Problèmes Connus

### ❌ Tests échoués actuellement (6/17)

1. **Database connection check** - Le health check ne vérifie pas explicitement la DB
2. **Analyse avec fichier** - Nécessite Sightengine API key configurée
3. **Stripe products** - Endpoint /api/plans retourne les plans en dur, pas depuis Stripe

### ✅ À corriger avant production

```bash
# 1. Ajouter DB check dans health endpoint
# backend/src/index.js
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

# 2. Configurer Sightengine pour tests
# backend/.env
SIGHTENGINE_API_USER=your_api_user
SIGHTENGINE_API_SECRET=your_api_secret

# 3. Endpoint /api/plans devrait retourner produits Stripe
# Vérifier backend/src/routes/plans.js
```

---

## 📊 Rapport de Test

### Utiliser le template

```bash
# Copier le template
cp RAPPORT_TEST_TEMPLATE.md RAPPORT_TEST_$(date +%Y%m%d).md

# Remplir au fur et à mesure des tests
# Cocher : ⬜ → ✅ ou ❌
```

### Exemple de remplissage

```markdown
| Test | Statut | Commentaire |
|------|--------|-------------|
| Inscription utilisateur | ✅ | Email reçu en 30s |
| Quota 3/jour respecté | ✅ | 4ème analyse refusée |
| Paiement Stripe | ✅ | Montant : 12€ |
```

---

## 🎯 Critères de Validation

### PRÊT POUR PRODUCTION si :

✅ **100%** des tests plans réussis  
✅ **100%** des tests paiements réussis  
✅ **100%** des tests emails réussis  
✅ **0** bug critique  
✅ **< 3** bugs majeurs  
✅ Performance < 3s pour analyses  
✅ Responsive mobile/tablette  

### NON PRÊT si :

❌ Bugs critiques (paiement, sécurité, perte de données)  
❌ Emails non envoyés  
❌ Quotas non respectés  
❌ Paiements Stripe échouent  

---

## 🔧 Scripts Utiles

### Créer utilisateur admin

```bash
cd backend
node src/scripts/make-admin.js your-email@exemple.com
```

### Réinitialiser quota utilisateur

```sql
-- Connecter à la DB
psql $DATABASE_URL

-- Supprimer analyses d'aujourd'hui
DELETE FROM "Analysis" 
WHERE "userId" = 'user-id-here' 
AND "createdAt" > CURRENT_DATE;
```

### Tester webhook Stripe

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks localement
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Déclencher événement test
stripe trigger checkout.session.completed
```

---

## 📞 Support Tests

**Problème avec les tests ?**

1. Vérifier backend démarré : `curl http://localhost:3001/api/health`
2. Vérifier DB connectée : `psql $DATABASE_URL`
3. Vérifier logs backend : `tail -f backend/logs/backend.log`
4. Consulter `TESTS_VALIDATION.md` pour détails
5. Voir rapport template : `RAPPORT_TEST_TEMPLATE.md`

**Contact** :
- Email : support@faketect.com
- Documentation : `/docs`

---

## ✅ Prochaines Étapes

Une fois tous les tests passés :

1. [ ] Mettre Stripe en mode LIVE
2. [ ] Configurer domaine production
3. [ ] Déployer sur Vercel + Render
4. [ ] Tester en production
5. [ ] Monitorer avec Sentry
6. [ ] Lancement ! 🚀

---

**Bon courage pour les tests ! 💪**
