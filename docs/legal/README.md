# Système Juridique FakeTect - Documentation

Ce dossier contient l'infrastructure juridique complète de la plateforme FakeTect, garantissant la conformité légale et la protection juridique maximale.

## 📋 Documents Juridiques Disponibles

### 1. Mentions Légales (`MENTIONS-LEGALES.md`)
Informations légales obligatoires selon la loi pour la confiance dans l'économie numérique (LCEN).

**Contenu :**
- Identification de l'éditeur (JARVIS)
- Informations d'hébergement
- Propriété intellectuelle
- Responsabilité
- Droit applicable

### 2. Politique de Confidentialité (`POLITIQUE-CONFIDENTIALITE.md`)
Conformité totale au RGPD (Règlement Général sur la Protection des Données).

**Contenu :**
- Données collectées et finalités
- Durées de conservation
- Mesures de sécurité
- Droits des utilisateurs (accès, rectification, effacement, etc.)
- Transferts de données
- Contact DPO
- Notification de violations

### 3. Conditions Générales d'Utilisation - CGU (`CGU.md`)
Régissent l'utilisation de la plateforme FakeTect.

**Contenu :**
- Définitions
- Accès au service
- Description des fonctionnalités
- Quotas et limitations
- Obligations de l'utilisateur
- Propriété intellectuelle
- Résultats d'analyse (nature informative)
- Responsabilité et garanties
- Suspension et résiliation
- Droit applicable

### 4. Conditions Générales de Vente - CGV (`CGV.md`)
Régissent les services payants (si/quand implémentés).

**Contenu :**
- Services proposés et tarifs
- Modalités de paiement
- Facturation
- Droit de rétractation (14 jours)
- Garanties légales
- Résiliation
- Médiation de la consommation
- Droit applicable

### 5. Politique de Cookies (`POLITIQUE-COOKIES.md`)
Conformité aux directives CNIL et RGPD.

**Contenu :**
- Types de cookies utilisés
- Cookies essentiels (exemptés de consentement)
- Cookies analytiques (avec consentement)
- Gestion des préférences
- Services tiers
- Droits RGPD sur les données cookies

## 🔐 Service Juridique Technique

### Fichier : `legal-service.js`

Service robuste en béton armé pour la gestion des aspects juridiques techniques.

#### Composants Principaux

##### 1. **LegalCertificateGenerator**
Générateur de certificats juridiquement conformes avec :
- ✅ Horodatage certifié ISO 8601
- ✅ Signature numérique HMAC-SHA256
- ✅ Chaîne de traçabilité (Chain of Custody)
- ✅ Mentions légales intégrées
- ✅ Disclaimers contextualisés
- ✅ Conformité RGPD
- ✅ Base légale du traitement
- ✅ URL de vérification
- ✅ Audit trail complet
- ✅ Expiration automatique

**Méthodes :**
```javascript
// Générer un certificat légal complet
await generateLegalCertificate(analysisData, {
  userId: 'user-123',
  purpose: 'legal', // ou 'journalistic', 'academic', 'personal', 'commercial'
  language: 'fr',
  ipAddress: '1.2.3.4',
  includeTimestamp: true,
  includeChainOfCustody: true,
  includeRGPDNotice: true
});

// Vérifier l'authenticité d'un certificat
await verifyCertificate(certificate);
```

**Caractéristiques du certificat :**
- ID unique sécurisé
- Version et standard (ISO/IEC 27001)
- Horodatage multi-format (ISO, Unix, UTC)
- Identification émetteur (JARVIS + KBIS)
- Bénéficiaire et contexte
- Finalité et base légale RGPD
- Résultats d'analyse sanitisés
- Hash d'intégrité (SHA-256)
- Chaîne de traçabilité complète
- Disclaimers juridiques
- Droits RGPD
- Signature numérique
- Durée de validité

##### 2. **RGPDComplianceService**
Service de conformité RGPD.

**Méthodes :**
```javascript
// Générer une notice de traitement
generateDataProcessingNotice('analysis', 'fr');

// Générer un formulaire de consentement
generateConsentForm(['analysis', 'account'], 'fr');

// Valider une demande d'exercice de droit RGPD
validateRGPDRequest('access', userData);
```

**Fonctionnalités :**
- Notices de traitement structurées
- Formulaires de consentement conformes
- Validation des demandes RGPD
- Respect des délais légaux (1 mois)
- Gratuité des demandes

##### 3. **LegalComplianceService**
Service de conformité légale générale.

**Méthodes :**
```javascript
// Générer un disclaimer contextualisé
generateDisclaimer('analysis', 'fr');

// Valider la conformité contractuelle
validateContractCompliance('cgu');

// Générer un footer légal complet
generateLegalFooter('fr');
```

**Fonctionnalités :**
- Disclaimers contextualisés
- Validation des documents juridiques
- Génération de footers légaux
- Liens vers documents obligatoires

## 🛡️ Protection Juridique

### Niveaux de Protection

#### 1. **Protection des Résultats d'Analyse**
- ⚠️ Disclaimer clair : résultats indicatifs, pas de preuve légale absolue
- ⚠️ Nature probabiliste explicitée
- ⚠️ Possibilité de faux positifs/négatifs mentionnée
- ⚠️ Responsabilité de l'utilisateur clarifiée

#### 2. **Protection de la Responsabilité**
- ❌ Exclusion des dommages indirects
- ❌ Exclusion de la perte de profits/données
- ❌ Exclusion des décisions basées sur les résultats
- ✅ Plafond de responsabilité défini (100€ comptes gratuits)
- ✅ Force majeure prévue

#### 3. **Protection des Données (RGPD)**
- ✅ Base légale pour chaque traitement
- ✅ Finalités explicites et limitées
- ✅ Durées de conservation respectées
- ✅ Sécurité renforcée (chiffrement, isolation)
- ✅ Droits utilisateurs garantis
- ✅ DPO désigné
- ✅ Registre des traitements
- ✅ Notification des violations < 72h

#### 4. **Protection Contractuelle**
- ✅ CGU/CGV complètes et à jour
- ✅ Acceptation explicite requise
- ✅ Modifications notifiées
- ✅ Droit de résiliation
- ✅ Médiation prévue

#### 5. **Protection de la Propriété Intellectuelle**
- © Tous droits réservés sur le Service
- ™ Marques protégées
- 🔒 Code source protégé
- 📜 Licences claires

## 🔄 Conformité Réglementaire

### Textes de Référence

#### Union Européenne
- **RGPD** - Règlement (UE) 2016/679
- **Directive ePrivacy** - 2002/58/CE

#### France
- **Loi Informatique et Libertés** (modifiée)
- **Code de la consommation**
  - L.221-18 : Droit de rétractation (14 jours)
  - L.217-4 et suivants : Garantie de conformité
  - L.612-1 : Médiation de la consommation
- **Code civil** - Garantie des vices cachés
- **Code de commerce** - Pénalités de retard
- **LCEN** - Loi pour la confiance dans l'économie numérique

#### Standards Internationaux
- **ISO/IEC 27001** - Sécurité de l'information
- **ISO 8601** - Format date/heure

### Organismes de Contrôle
- **CNIL** - Commission Nationale Informatique et Libertés
- **DGCCRF** - Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes
- **Médiateur de la consommation**

## 📞 Contacts Juridiques

### Points de Contact
- **Juridique général :** legal@faketect.com
- **DPO (Données personnelles) :** dpo@faketect.com
- **Support :** support@faketect.com
- **Réclamations :** complaints@faketect.com
- **Rétractation :** refunds@faketect.com
- **Résiliation :** cancel@faketect.com

### Délais de Réponse
- **Demandes générales :** 7 jours ouvrés
- **Demandes RGPD :** maximum 1 mois
- **Réclamations :** 7 jours ouvrés

## 🔧 Configuration Technique

### Variables d'Environnement Requises

```bash
# Signature des certificats (CRITIQUE - CHANGER EN PRODUCTION)
CERT_SIGNING_SECRET=votre-secret-fort-et-aleatoire-minimum-32-caracteres
CERT_SIGNING_SECRET_OLD=ancien-secret-pour-rotation

# Informations entreprise (depuis KBIS)
COMPANY_NAME=JARVIS
COMPANY_LEGAL_FORM=SAS
COMPANY_SIRET=12345678900001
COMPANY_RCS=Paris B 123456789
COMPANY_ADDRESS=Adresse complète
COMPANY_CAPITAL=10000
COMPANY_TVA=FR12345678900

# Contacts
DPO_EMAIL=dpo@faketect.com
LEGAL_EMAIL=legal@faketect.com
SUPPORT_EMAIL=support@faketect.com
```

### Sécurité des Secrets

⚠️ **IMPORTANT :** Le `CERT_SIGNING_SECRET` doit être :
- Aléatoire (minimum 256 bits)
- Unique par environnement
- Changé régulièrement (rotation tous les 6 mois)
- Stocké de manière sécurisée (secrets manager)
- Jamais commité dans Git

**Génération d'un secret fort :**
```bash
openssl rand -base64 32
```

## 📊 Audit et Conformité

### Logs d'Audit
Le système génère automatiquement des logs pour :
- Génération de certificats
- Demandes RGPD
- Modifications de comptes
- Accès aux données sensibles

**Rétention :** 24 mois

### Revue Périodique
- **Mensuelle :** Vérification des logs d'audit
- **Trimestrielle :** Revue des documents juridiques
- **Annuelle :** Audit de conformité complet

## 🚀 Mise en Production

### Checklist Avant Production

- [ ] Compléter les informations KBIS dans les documents
- [ ] Configurer `CERT_SIGNING_SECRET` fort
- [ ] Valider les adresses email de contact
- [ ] Tester la génération de certificats
- [ ] Vérifier la conformité RGPD
- [ ] Valider les disclaimers avec un avocat
- [ ] Configurer le DPO
- [ ] Mettre en place les logs d'audit
- [ ] Tester le formulaire de consentement
- [ ] Valider les durées de conservation
- [ ] Configurer la médiation de la consommation
- [ ] Vérifier les liens juridiques sur le site
- [ ] Tester les demandes RGPD
- [ ] Former l'équipe aux obligations légales

### Maintenance Juridique

#### Actions Régulières
1. **Quotidienne :** Monitoring des violations de données
2. **Hebdomadaire :** Traitement des demandes RGPD
3. **Mensuelle :** Revue des logs d'audit
4. **Trimestrielle :** Mise à jour des documents si nécessaire
5. **Annuelle :** Audit de conformité complet

#### Veille Juridique
- Suivre les évolutions du RGPD
- Surveiller les décisions de la CNIL
- Mettre à jour en cas de changement législatif
- Former l'équipe aux nouvelles obligations

## 📖 Ressources Utiles

### Documentation Officielle
- **CNIL :** https://www.cnil.fr
- **Service Public :** https://www.service-public.fr
- **EUR-Lex (RGPD) :** https://eur-lex.europa.eu
- **Légifrance :** https://www.legifrance.gouv.fr

### Outils
- **Générateur de mentions légales :** https://mentions-legales.com
- **Générateur de politique de confidentialité :** https://www.privacy-policy-template.com
- **CNIL - Kit conformité RGPD :** https://www.cnil.fr/fr/rgpd-passer-a-laction

## ⚖️ Disclaimer

Ce système juridique a été conçu pour offrir une protection maximale, mais il ne remplace pas les conseils d'un avocat spécialisé. Il est fortement recommandé de :

1. Faire valider les documents par un avocat
2. Adapter les contenus à votre situation spécifique
3. Compléter les informations manquantes (KBIS, contacts, etc.)
4. Maintenir les documents à jour
5. Former l'équipe aux obligations légales

---

**Version :** 1.0  
**Date de création :** 19 décembre 2024  
**Auteur :** Système juridique FakeTect  
**Conformité :** RGPD, Code de la consommation, LCEN
