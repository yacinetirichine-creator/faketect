# Instructions de Finalisation Juridique

## 📋 Informations à Compléter depuis vos Documents

### Documents Requis
1. **KBIS** - `/Users/yacinetirichine/Desktop/Jarvis/JARVIS - KBIS.pdf`
2. **Récépissé** - `/Users/yacinetirichine/Desktop/Jarvis/JARVIS - RECEPISSE BE.pdf`

## 🔍 Informations à Extraire et Compléter

### 1. Depuis le KBIS

Recherchez et notez ces informations dans votre KBIS :

- **Dénomination sociale** : _________________
- **Forme juridique** : (SARL, SAS, SA, EI, etc.) _________________
- **Capital social** : _________________€
- **Adresse du siège social** : 
  ```
  _________________________________
  _________________________________
  Code postal : ________ Ville : _________________
  ```
- **SIRET** : _________________
- **SIREN** : _________________
- **RCS** : (Ville) _________________ (Numéro) _________________
- **Code APE/NAF** : _________________
- **Date d'immatriculation** : _________________
- **Dirigeant(s)** :
  - Nom : _________________
  - Fonction : _________________
- **Numéro TVA intracommunautaire** : FR_________________

### 2. Autres Informations Nécessaires

- **Téléphone entreprise** : _________________
- **Email contact** : _________________
- **Email DPO (Délégué Protection Données)** : dpo@faketect.com (ou autre) _________________
- **Email juridique** : legal@faketect.com (ou autre) _________________

### 3. Assurance (Recommandé)

- **Assureur RC Professionnelle** : _________________
- **Numéro de police** : _________________

### 4. Médiateur de la Consommation (Obligatoire si B2C)

Choisir un médiateur agréé par la CECMC :
- **Nom du médiateur** : _________________
- **Adresse** : _________________
- **Site web** : _________________
- **Email** : _________________

Liste des médiateurs : https://www.economie.gouv.fr/mediation-conso/mediateurs-references

## 📝 Fichiers à Mettre à Jour

### 1. Mentions Légales
**Fichier :** `docs/legal/MENTIONS-LEGALES.md`

Remplacer :
```markdown
**Nom de l'entreprise** : [À compléter selon KBIS]
**Forme juridique** : [À compléter selon KBIS]
**Capital social** : [À compléter selon KBIS]
**Siège social** : [À compléter selon KBIS]
**SIRET** : [À compléter selon KBIS]
**RCS** : [À compléter selon KBIS]
**APE/NAF** : [À compléter selon KBIS]
**TVA intracommunautaire** : [À compléter]
**Directeur de la publication** : [À compléter]
**Téléphone** : [À compléter]
```

Par les vraies valeurs.

### 2. CGV (Conditions Générales de Vente)
**Fichier :** `docs/legal/CGV.md`

Section "Article 20 - Contact" :
```markdown
**JARVIS**
Siège social : [Adresse complète]
SIRET : [Numéro]
RCS : [Ville] [Numéro]
Capital social : [Montant]
TVA intracommunautaire : [Numéro]
**Téléphone :** [Numéro]
```

Section "Article 16 - Réclamations et Médiation" :
```markdown
**[Nom du médiateur]**
Adresse : [Adresse]
Site web : [URL]
Email : [Email]
```

### 3. Service Juridique (Backend)
**Fichier :** `packages/api/services/legal-service.js`

Dans `LEGAL_CONFIG.company` :
```javascript
company: {
  name: 'JARVIS', // ou nom complet
  legalForm: 'SAS', // SARL, SA, EI, etc.
  address: 'Adresse complète du siège',
  siret: '12345678900001',
  rcs: 'Paris B 123456789',
  capital: '10000',
  tva: 'FR12345678900',
  email: 'legal@faketect.com',
  dpo: 'dpo@faketect.com'
},
```

### 4. Variables d'Environnement
**Fichier :** `packages/api/.env`

Ajouter/Modifier :
```bash
# Informations entreprise
COMPANY_NAME=JARVIS
COMPANY_LEGAL_FORM=SAS
COMPANY_SIRET=12345678900001
COMPANY_RCS="Paris B 123456789"
COMPANY_ADDRESS="Adresse complète"
COMPANY_CAPITAL=10000
COMPANY_TVA=FR12345678900

# Contacts
DPO_EMAIL=dpo@faketect.com
LEGAL_EMAIL=legal@faketect.com
SUPPORT_EMAIL=support@faketect.com

# Sécurité (IMPORTANT - générer un vrai secret)
CERT_SIGNING_SECRET=votre-secret-aleatoire-minimum-32-caracteres
```

### 5. Composant React (Frontend)
**Fichier :** `packages/web/src/pages/LegalPage.jsx`

Dans les sections affichant les infos entreprise, remplacer :
```jsx
<p>
  [Forme juridique]<br />
  SIRET : [À compléter]<br />
  [Adresse complète]
</p>
```

## 🔐 Génération du Secret de Signature

**CRITIQUE** : Le secret de signature des certificats doit être fort et aléatoire.

### Sur Mac/Linux :
```bash
openssl rand -base64 32
```

### Alternative :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copier le résultat dans `.env` :
```bash
CERT_SIGNING_SECRET=le-secret-genere-ici
```

## ✅ Checklist de Vérification

Une fois toutes les informations complétées :

- [ ] KBIS lu et informations extraites
- [ ] Mentions légales mises à jour
- [ ] CGU mises à jour
- [ ] CGV mises à jour
- [ ] Politique de confidentialité vérifiée
- [ ] Service juridique backend configuré
- [ ] Variables d'environnement configurées
- [ ] Secret de signature généré
- [ ] Composants React mis à jour
- [ ] Médiateur de la consommation choisi
- [ ] Emails configurés (legal@, dpo@, support@)
- [ ] Assurance RC Pro souscrite
- [ ] Tests effectués :
  - [ ] Génération de certificat
  - [ ] Affichage des mentions légales
  - [ ] Footer avec liens juridiques
  - [ ] Formulaire de consentement
- [ ] Validation par un avocat (recommandé)

## 📧 Emails à Créer

Créez ces adresses email professionnelles :

1. **contact@faketect.com** - Contact général
2. **legal@faketect.com** - Questions juridiques
3. **dpo@faketect.com** - Données personnelles (DPO)
4. **support@faketect.com** - Support technique
5. **complaints@faketect.com** - Réclamations
6. **refunds@faketect.com** - Remboursements/Rétractation
7. **cancel@faketect.com** - Résiliations
8. **orders@faketect.com** - Commandes

**Astuce :** Vous pouvez créer des alias pointant tous vers la même boîte initialement.

## 🎯 Prochaines Étapes

### Immédiat (Avant Production)
1. Compléter toutes les informations ci-dessus
2. Générer le secret de signature
3. Tester la génération de certificats
4. Faire valider par un avocat

### Court Terme (Premier Mois)
1. Mettre en place le registre des traitements RGPD
2. Former l'équipe aux obligations légales
3. Configurer les logs d'audit
4. Tester les procédures RGPD

### Moyen Terme (3-6 Mois)
1. Effectuer un audit de conformité complet
2. Revoir les documents juridiques
3. Vérifier les durées de conservation
4. Mettre à jour si nécessaire

## 📞 Besoin d'Aide ?

### Ressources Gratuites
- **CNIL** : Guides et modèles - https://www.cnil.fr
- **Bpifrance** : Conseils juridiques - https://www.bpifrance.fr
- **CCI** : Accompagnement entreprises - https://www.cci.fr

### Professionnels à Consulter
- **Avocat en droit du numérique** (fortement recommandé)
- **Expert-comptable** (pour aspects fiscaux)
- **Consultant RGPD** (pour conformité données)

---

**Note Importante :** Ce document est un guide pour vous aider à compléter les informations. Il ne constitue pas un conseil juridique. Consultez un avocat pour validation.

**Date :** 19 décembre 2024  
**Version :** 1.0
