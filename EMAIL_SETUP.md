# 📧 Configuration Email avec Google Workspace

## 🎯 Objectif

Envoyer des emails transactionnels automatiques via votre compte Google Workspace (Gmail professionnel).

## ✅ Emails Automatiques

1. **Bienvenue** : Après inscription (10 tests gratuits offerts)
2. **Limite atteinte** : Quand l'utilisateur FREE utilise ses 10 tests (CTA upgrade)
3. **Rappel suppression** : 7 jours avant suppression du compte inactif (23 jours après création)

## 🛠️ Configuration Google Workspace

### Étape 1 : Créer un mot de passe d'application Google

Google Workspace (et Gmail) exige un **mot de passe d'application** pour Nodemailer (pas votre mot de passe habituel).

#### A. Activer la validation en 2 étapes

1. Aller sur [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Cliquer sur **Validation en 2 étapes**
3. **Activer** la validation en 2 étapes si ce n'est pas déjà fait

#### B. Générer un mot de passe d'application

1. Aller sur [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sélectionner :
   - **Application** : Autre (nom personnalisé)
   - **Nom** : `FakeTect Backend`
3. Cliquer sur **Générer**
4. **Copier le mot de passe** (16 caractères, ex: `abcd efgh ijkl mnop`)

⚠️ **Important** : Ce mot de passe ne sera affiché qu'une seule fois !

### Étape 2 : Configurer les variables d'environnement

#### Backend local (`.env`)

Ajouter ces 3 variables :

```bash
# Email Configuration (Google Workspace)
EMAIL_USER=votre-email@votreentreprise.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=noreply@votreentreprise.com
```

**Explications** :
- `EMAIL_USER` : Votre adresse Google Workspace
- `EMAIL_PASS` : Le mot de passe d'application (16 caractères)
- `EMAIL_FROM` : Adresse d'expéditeur (peut être la même que EMAIL_USER)

#### Production (Render)

1. Aller dans les **Environment Variables** de votre service backend Render
2. Ajouter les 3 variables :
   - `EMAIL_USER` : `votre-email@votreentreprise.com`
   - `EMAIL_PASS` : `abcd efgh ijkl mnop`
   - `EMAIL_FROM` : `noreply@votreentreprise.com`
3. **Redéployer** le service

### Étape 3 : Redémarrer le backend

```bash
./start-backend.sh
```

Vous devriez voir :
```
✅ Email configuré - notifications activées
```

## 📨 Utilisation des Emails

### 1. Email de Bienvenue

**Déclenché** : Automatiquement après inscription

**Contenu** :
- Titre : "🎉 Bienvenue sur FakeTect !"
- 10 tests gratuits offerts
- Valides 30 jours
- CTA : "Commencer l'analyse"
- Multi-langue (FR/EN)

### 2. Email Limite Atteinte

**Déclenché** : Quand l'utilisateur FREE atteint 10/10 tests

**Contenu** :
- Titre : "⚠️ Limite FREE atteinte"
- Liste des plans payants
- CTA : "Voir les plans"
- Multi-langue (FR/EN)

### 3. Email Rappel Suppression

**Déclenché** : 23 jours après création du compte FREE (cron daily à 3h)

**Contenu** :
- Titre : "⏰ Votre compte sera supprimé dans 7 jours"
- Explication inactivité
- CTA : "Me connecter"
- Multi-langue (FR/EN)

## 🔍 Vérification

### Logs backend

**Avec email configuré** :
```
✅ Email configuré - notifications activées
✅ Email envoyé: 🎉 Bienvenue sur FakeTect ! → user@example.com
```

**Sans email** (mode dégradé) :
```
⚠️  Email non configuré - notifications désactivées (mode dégradé)
⚠️  Email non envoyé (désactivé): 🎉 Bienvenue → user@example.com
```

### Test manuel d'inscription

1. S'inscrire sur le frontend : `http://localhost:5173/register`
2. Vérifier les logs backend pour :
   ```
   ✅ Email envoyé: 🎉 Bienvenue sur FakeTect ! → votre-email@example.com
   ```
3. Vérifier votre boîte mail (vérifier aussi les spams la première fois)

### Test limite FREE

1. Faire 10 analyses avec un compte FREE
2. À la 10ème, vérifier les logs :
   ```
   ✅ Email envoyé: ⚠️ Limite FREE atteinte → user@example.com
   ```

## 🚨 Limites Gmail/Google Workspace

### Plan Gratuit Gmail
- **500 emails/jour** : Largement suffisant pour démarrer
- **Limitation** : Si dépassement, emails en attente 24h

### Plan Google Workspace (payant)
- **2000 emails/jour** : Pour croissance rapide
- **Meilleure délivrabilité** : Moins de risque spam

## 🎨 Personnalisation des Templates

Les templates HTML sont dans `backend/src/services/email.js`.

**Structure d'un template** :
```javascript
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* Styles inline (compatibilité email) */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${msg.title}</h1>
    </div>
    <div class="content">
      <p>${msg.intro}</p>
      <!-- Contenu -->
      <a href="${frontendUrl}/pricing" class="button">${msg.cta}</a>
    </div>
  </div>
</body>
</html>
`;
```

**Variables disponibles** :
- `user.name` : Nom de l'utilisateur
- `user.email` : Email de l'utilisateur
- `user.language` : Langue (fr/en/es/de/pt/it)
- `frontendUrl` : URL du frontend (depuis `FRONTEND_URL`)

## 📊 Statistiques d'Envoi

Les logs backend contiennent :
- ✅ **Succès** : `Email envoyé: [SUJET] → [EMAIL]`
- ❌ **Échecs** : `Erreur envoi email: [MESSAGE]`

Pour monitoring avancé, utiliser Google Workspace Admin Console :
- Rapports → Rapports d'email
- Taux de livraison, bounces, etc.

## 🆘 Dépannage

### "Invalid login: 535-5.7.8 Username and Password not accepted"

**Cause** : Mot de passe d'application invalide ou validation 2 étapes désactivée

**Solution** :
1. Vérifier que la validation en 2 étapes est active
2. Régénérer un nouveau mot de passe d'application
3. Copier-coller exactement (avec espaces) : `abcd efgh ijkl mnop`

### Emails en spam

**Solutions** :
1. **SPF/DKIM** : Configurer dans Google Workspace Admin
2. **DMARC** : Ajouter un enregistrement DNS
3. **Domaine vérifié** : Utiliser `@votredomaine.com` (pas `@gmail.com`)
4. **Volume progressif** : Commencer petit pour établir la réputation

### "Email non configuré - mode dégradé"

**Cause** : Variables `EMAIL_USER` ou `EMAIL_PASS` manquantes

**Solution** :
1. Vérifier `.env` (local) ou Environment Variables (Render)
2. Redémarrer le backend
3. Vérifier les logs au démarrage

### Emails ne partent pas

1. **Vérifier connexion** : 
   ```bash
   node -e "require('./src/services/email').initEmail()"
   ```

2. **Tester manuellement** :
   ```javascript
   const { sendEmail } = require('./src/services/email');
   sendEmail({
     to: 'test@example.com',
     subject: 'Test',
     html: '<p>Hello World</p>'
   });
   ```

3. **Vérifier quotas Gmail** : 
   - Dashboard Google Workspace → Rapports
   - Si > 500/jour, attendre 24h

## 💡 Conseils

1. **Utiliser un email dédié** : `noreply@votredomaine.com` ou `support@votredomaine.com`
2. **Tester en local** : S'inscrire avec votre propre email pour vérifier le rendu
3. **Multi-langue** : Les templates s'adaptent automatiquement à `user.language`
4. **Logs** : Toujours vérifier les logs backend pour détecter les problèmes
5. **Fallback** : L'app fonctionne sans email (mode dégradé)

## 🔄 Migration vers un autre service

Si besoin de changer de service email plus tard (Resend, SendGrid, etc.), il suffit de :

1. Modifier `backend/src/services/email.js`
2. Changer le transporteur Nodemailer
3. Conserver les mêmes fonctions exportées (`sendWelcomeEmail`, etc.)

Le reste du code n'a pas besoin d'être modifié ! 🎉

---

✅ **Email configuré** - Prêt pour notifier vos utilisateurs !
