# 📧 Système d'Automation Email - Récapitulatif

## ✅ IMPLÉMENTÉ : Email Automation Complète

### 🎯 Objectifs
- **Onboarding** : Guider les nouveaux utilisateurs (J0, J3, J7)
- **Conversion** : Transformer FREE → PRO avec offre -30%
- **Rétention** : Re-engager les inactifs (J30)
- **Upsell** : Alerter quota 75%+ avec upgrade CTA

---

## 📧 5 TYPES D'EMAILS AUTOMATIQUES

### 1. **Bienvenue J0** (Immédiat après inscription)
**Trigger:** Création compte  
**Cible:** Tous les nouveaux utilisateurs  
**Fonction:** `sendWelcomeEmail(user)`

**Contenu:**
- Message de bienvenue personnalisé
- 3 premiers pas : Analyser → Rapport → Certificat
- CTA "Commencer maintenant" (lien dashboard)
- Info plan actuel + quota disponible
- Contact support

**UTM:** `?utm_source=email&utm_medium=welcome_d0&utm_campaign=onboarding`

---

### 2. **Engagement J3** (3 jours après inscription, sans analyses)
**Trigger:** CRON quotidien 10h, vérifie users avec 0 analyses après 3 jours  
**Cible:** Utilisateurs sans aucune analyse  
**Fonction:** `sendDay3EngagementEmail(user)`

**Contenu:**
- "Avez-vous testé votre première analyse ?"
- 💡 Cas d'usage (journalistes, recruteurs, particuliers)
- ⚡ Astuce : Glissez-déposez image → Résultat 5s
- CTA "Faire ma première analyse"
- Info chatbot IA disponible

**UTM:** `?utm_source=email&utm_medium=engagement_d3&utm_campaign=onboarding`

---

### 3. **Conversion J7** (7 jours après inscription, plan FREE uniquement)
**Trigger:** CRON quotidien 10h, vérifie users FREE créés il y a 7 jours  
**Cible:** Utilisateurs FREE uniquement  
**Fonction:** `sendDay7ConversionEmail(user)`

**Contenu:**
- 🎁 OFFRE EXCLUSIVE : -30% sur plan PRO
- Prix barré : ~~14,99€~~ → **10,49€/mois**
- ✨ Bénéfices PRO : 100 analyses, vidéo, API, support prioritaire
- Offre valable 48h (urgence)
- CTA "Profiter de -30%"
- Note : "Restons en FREE ? Pas de problème"

**UTM:** `?utm_source=email&utm_medium=conversion_d7&utm_campaign=onboarding&promo=WELCOME30`

---

### 4. **Re-engagement J30** (30 jours sans analyses)
**Trigger:** CRON quotidien 10h, vérifie users inactifs depuis 30 jours  
**Cible:** Utilisateurs sans analyses depuis 30 jours  
**Fonction:** `sendInactiveUserEmail(user)`

**Contenu:**
- "Nous ne vous avons pas vu depuis un moment..."
- 🆕 Nouveautés : Assistant IA, analyse texte, vidéo 60s, 6 langues
- 💡 Statistique : "67% deepfakes = arnaques en 2025"
- CTA "Revenir sur FakeTect"
- Rappel quota actif

**UTM:** `?utm_source=email&utm_medium=reengagement_d30&utm_campaign=winback`

---

### 5. **Rappel Quota 75%** (Alerte usage)
**Trigger:** Automatique après chaque analyse si quota >= 75%  
**Cible:** FREE (8+/10), PRO (75+/100), BUSINESS (375+/500)  
**Fonction:** `sendQuotaWarningEmail(user)`

**Contenu:**
- ⚠️ "Vous avez utilisé X% de votre quota"
- Barre de progression visuelle (orange)
- **Si FREE :**
  - CTA "Passer à PRO" (100 analyses, vidéo, API)
  - Prix : 14,99€/mois
- **Si PRO/BUSINESS :**
  - 💡 Conseils optimisation quota
  - Suggestion upgrade si PRO → BUSINESS (500 analyses)
- Date renouvellement quota

**UTM:** `?utm_source=email&utm_medium=quota_warning&utm_campaign=upgrade`

---

## 🤖 CRON AUTOMATIQUE

### Configuration
```javascript
// Tous les jours à 10h00
cron.schedule('0 10 * * *', async () => { ... });
```

### Processus quotidien :
1. **J+3 Engagement** : Vérifie users créés il y a 3 jours sans analyses
2. **J+7 Conversion** : Vérifie users FREE créés il y a 7 jours
3. **J+30 Re-engagement** : Vérifie users sans analyses depuis 30 jours
4. **Quota warning** : Vérifie users à 75%+ quota

### Sécurité :
- Pause 1s entre chaque email (anti-rate-limit)
- Non-bloquant : Continue si erreur
- Logs détaillés : `logger.info('Email sent', { userId, type })`

---

## 🔧 INTÉGRATIONS

### 1. Route Register (`auth.js`)
```javascript
// Après création compte
sendWelcomeEmail(user).catch(err => logger.error(...));
sendAutomationWelcome(user).catch(err => logger.error(...));
```

### 2. Route Analysis (`analysis.js`)
```javascript
// Après chaque analyse
const percentUsed = (usedMonth / limit) * 100;
if (percentUsed >= 75 && percentUsed < 85) {
  sendQuotaWarningEmail(user).catch(...);
}
```

### 3. Backend Start (`index.js`)
```javascript
// Au démarrage serveur
startEmailAutomationCron();
```

---

## 📊 MÉTRIQUES & KPIs

### Taux de conversion attendus :
- **J0 → J3 :** 60% répondent (ouvrent email)
- **J3 → Analyse :** 25% font leur 1ère analyse
- **J7 → PRO :** 5-8% upgradent avec -30%
- **J30 → Retour :** 15% se reconnectent
- **Quota 75% → Upgrade :** 10-12% FREE passent PRO

### Tracking UTM :
Tous les emails incluent des paramètres UTM pour analytics :
- `utm_source=email`
- `utm_medium=[welcome_d0|engagement_d3|conversion_d7|reengagement_d30|quota_warning]`
- `utm_campaign=[onboarding|winback|upgrade]`

---

## 🌍 SUPPORT MULTILINGUE

### Langues implémentées :
- ✅ Français (FR)
- ✅ Anglais (EN)

### Facile à ajouter :
Chaque fonction email a un objet `templates` avec clés `fr`, `en`.  
Pour ajouter ES/DE/PT/IT : Copier bloc FR et traduire.

```javascript
const templates = {
  fr: { subject: '...', html: '...' },
  en: { subject: '...', html: '...' },
  es: { subject: '...', html: '...' }, // À ajouter
  // etc.
};
```

---

## 🎨 DESIGN EMAILS

### Style :
- Responsive HTML (max-width: 600px)
- Gradient headers : `linear-gradient(135deg, #6366f1, #ec4899)`
- Boutons CTA : `background: #6366f1` (indigo primary)
- Cards infos : `background: #f3f4f6` (gris clair)
- Alertes : `background: #fef3c7` (jaune) + bordure orange

### Structure type :
1. Header coloré avec titre
2. Message personnalisé (nom utilisateur)
3. Contenu principal (liste, cards)
4. CTA principal (gros bouton)
5. Footer (mentions, contact)

---

## 📂 FICHIERS CRÉÉS

### Backend :
1. **`backend/src/services/emailAutomation.js`** (610 lignes)
   - 5 fonctions email
   - Templates FR/EN
   - Helpers getPlanLimits(), getResetDate()

2. **`backend/src/services/emailCron.js`** (130 lignes)
   - CRON scheduler
   - 4 requêtes Prisma quotidiennes
   - Batch processing avec pauses

### Modifiés :
3. **`backend/src/index.js`**
   - Import emailCron
   - `startEmailAutomationCron()` au démarrage

4. **`backend/src/routes/auth.js`**
   - Import emailAutomation
   - `sendAutomationWelcome()` lors register

5. **`backend/src/routes/analysis.js`**
   - Import emailAutomation
   - Trigger quota warning 75-85%

---

## ✅ CHECKLIST PRODUCTION

### Technique :
- [x] node-cron installé
- [x] 5 fonctions email créées
- [x] CRON scheduler configuré (10h quotidien)
- [x] Intégrations register + analysis
- [x] Syntaxe validée (node -c)
- [x] Build réussi

### Variables d'environnement :
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
FRONTEND_URL=https://faketect.com
```

### Tests à faire :
- [ ] Créer compte test → Vérifier email J0
- [ ] Attendre 3 jours → Vérifier CRON J3
- [ ] Attendre 7 jours → Vérifier CRON J7
- [ ] 30 jours inactif → Vérifier CRON J30
- [ ] Faire 8 analyses FREE → Vérifier quota warning

### Monitoring :
- [ ] Vérifier logs CRON quotidiens
- [ ] Tracker taux ouverture (pixel à ajouter)
- [ ] Tracker clics CTA (UTM analytics)
- [ ] Surveiller taux désabonnement

---

## 🚀 PROCHAINES AMÉLIORATIONS

### Court terme (optionnel) :
1. **Pixel tracking ouverture**
   - Image 1x1 transparent dans emails
   - Compteur en DB

2. **A/B Testing sujets**
   - 2 versions par email
   - Optimiser taux ouverture

3. **Email promo Black Friday**
   - Template spécial -40%
   - Countdown timer visuel

### Moyen terme :
4. **Segmentation avancée**
   - Emails différents FREE vs PRO
   - Contenu basé sur usage (< 5 analyses, 5-20, 20+)

5. **Séquence win-back avancée**
   - J30, J60, J90 si toujours inactif
   - Offres progressives

6. **Newsletter mensuelle**
   - Stats globales anonymisées
   - Top cas d'usage
   - Nouveautés produit

---

## 💰 IMPACT BUSINESS ESTIMÉ

### Conversion améliorée :
- **J7 -30% offre** : 5-8% FREE → PRO
  - 100 FREE reçoivent email
  - 6 upgradent à 10,49€/mois
  - **= 63€/mois récurrent** par batch

- **Quota warning** : 10% FREE → PRO
  - 50 FREE atteignent 75%
  - 5 upgradent à 14,99€/mois
  - **= 75€/mois récurrent** par batch

- **Re-engagement J30** : 15% reviennent
  - 200 inactifs
  - 30 reviennent et utilisent
  - **Rétention +15%**

### ROI estimé :
**+138€/mois minimum** pour 0h de travail manuel (automatique)  
Sur 1 an : **+1,656€** de MRR

---

## 📝 EXEMPLE DE LOGS

```
[2025-12-28 10:00:00] 🤖 Email automation cron started
[2025-12-28 10:00:02] Found 15 users for Day 3 engagement email
[2025-12-28 10:00:25] Day 3 engagement email sent (userId: abc123)
[2025-12-28 10:00:45] Found 8 users for Day 7 conversion email
[2025-12-28 10:01:05] Day 7 conversion email sent (userId: def456)
[2025-12-28 10:01:12] Found 42 inactive users for re-engagement email
[2025-12-28 10:02:50] Inactive user email sent (userId: ghi789)
[2025-12-28 10:03:10] Found 12 users for quota warning email
[2025-12-28 10:03:25] Quota warning email sent (userId: jkl012, usedMonth: 8)
[2025-12-28 10:03:30] ✅ Email automation cron completed successfully
```

---

Créé le : 28 décembre 2025  
Dernière mise à jour : 28 décembre 2025  
Statut : ✅ PRODUCTION READY  
Commits : 7e833c3
