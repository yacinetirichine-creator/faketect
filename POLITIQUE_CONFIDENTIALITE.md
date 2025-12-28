# POLITIQUE DE CONFIDENTIALITÉ

**Dernière mise à jour : 28 décembre 2024**

## 1. INFORMATIONS LÉGALES

La présente politique de confidentialité est éditée par :

**JARVIS**  
Société par actions simplifiée au capital de 100 EUR  
Siège social : 128 Rue la Boétie, 75008 PARIS  
SIREN : 928 499 166  
RCS Paris  

**Responsable de la publication et Délégué à la Protection des Données (DPO) :**  
Email : contact@faketect.com  
Adresse : 128 Rue la Boétie, 75008 PARIS

**Hébergeur :**  
- Frontend : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA
- Backend & Base de données : Render Services Inc., 525 Brannan Street, San Francisco, CA 94107, USA
- Stockage fichiers : Supabase Inc., 970 Toa Payoh North, Singapore 318992

---

## 2. PRÉAMBULE

JARVIS, en tant que responsable du traitement, accorde une importance particulière à la protection de vos données personnelles et s'engage à les traiter dans le respect du Règlement Général sur la Protection des Données (RGPD) n°2016/679 du 27 avril 2016 et de la loi Informatique et Libertés n°78-17 du 6 janvier 1978 modifiée.

La plateforme **Faketect** permet la détection de deepfakes par analyse d'images, vidéos et textes générés par intelligence artificielle.

---

## 3. DONNÉES PERSONNELLES COLLECTÉES

### 3.1 Données d'identification et de compte
- Nom et prénom
- Adresse email
- Mot de passe (chiffré avec bcrypt)
- Date de création du compte
- Langue préférée
- Statut d'abonnement

### 3.2 Données de paiement
- Informations de facturation (nom, adresse)
- Historique des transactions
- Identifiant client Stripe
- **Note importante :** Les données bancaires (numéro de carte) ne sont jamais stockées sur nos serveurs. Elles sont traitées directement par notre prestataire de paiement sécurisé Stripe, certifié PCI-DSS niveau 1.

### 3.3 Données d'utilisation
- Fichiers téléversés pour analyse (images, vidéos, textes)
- Résultats des analyses effectuées
- Historique des détections
- Métadonnées techniques (date, heure, type de fichier)
- Certificats d'authenticité générés

### 3.4 Données techniques
- Adresse IP
- Type et version de navigateur
- Système d'exploitation
- Pages visitées et durée des visites
- Source de trafic (référent)
- Données de cookies (voir Politique de Cookies)

### 3.5 Données pour les administrateurs
- Rôle utilisateur (user/admin)
- Logs d'activité administrative

---

## 4. FINALITÉS ET BASES JURIDIQUES DES TRAITEMENTS

| Finalité | Base juridique | Durée de conservation |
|----------|---------------|----------------------|
| Création et gestion du compte utilisateur | Exécution du contrat (Art. 6.1.b RGPD) | Durée de la relation contractuelle + 3 ans |
| Fourniture du service de détection de deepfakes | Exécution du contrat (Art. 6.1.b RGPD) | Durée de la relation contractuelle |
| Traitement des paiements et facturation | Obligation légale (Art. 6.1.c RGPD) | 10 ans (obligations comptables et fiscales) |
| Support client et assistance | Intérêt légitime (Art. 6.1.f RGPD) | 3 ans après la dernière interaction |
| Amélioration des services et analyses statistiques | Intérêt légitime (Art. 6.1.f RGPD) | Données anonymisées conservées indéfiniment |
| Envoi de newsletters et communications marketing | Consentement (Art. 6.1.a RGPD) | Jusqu'au retrait du consentement + 3 ans |
| Prévention de la fraude et sécurité | Intérêt légitime (Art. 6.1.f RGPD) | 1 an après détection |
| Respect des obligations légales | Obligation légale (Art. 6.1.c RGPD) | Selon obligations légales |

---

## 5. DESTINATAIRES DES DONNÉES

### 5.1 Destinataires internes
- Personnel autorisé de JARVIS (développeurs, support client, administrateurs)
- Accès strictement limité selon le principe du besoin d'en connaître

### 5.2 Sous-traitants et prestataires
Nous partageons vos données uniquement avec des prestataires de confiance, liés par des contrats de sous-traitance conformes à l'article 28 du RGPD :

**Hébergement et infrastructure :**
- Vercel Inc. (hébergement frontend) - USA, Clauses Contractuelles Types (CCT)
- Render Services Inc. (backend, base de données) - USA, Clauses Contractuelles Types (CCT)
- Supabase Inc. (stockage fichiers) - Singapour, Clauses Contractuelles Types (CCT)

**Paiement :**
- Stripe Inc. (traitement paiements) - USA/Irlande, certifié PCI-DSS niveau 1, CCT

**Intelligence Artificielle :**
- OpenAI LLC (API de détection IA) - USA, conformité RGPD via CCT
  - Note : Les fichiers analysés peuvent être traités par OpenAI selon leurs conditions d'utilisation

**Analyses et performance :**
- Services d'analytics (si activés) - avec anonymisation IP

### 5.3 Autorités et tiers autorisés
En cas d'obligation légale, vos données peuvent être communiquées aux :
- Autorités judiciaires, policières ou administratives
- Organismes de régulation (CNIL, DGCCRF)
- Commissaires aux comptes et experts-comptables

---

## 6. TRANSFERTS DE DONNÉES HORS UE

Certains de nos prestataires sont situés hors de l'Union Européenne (USA, Singapour). Ces transferts sont sécurisés par :

1. **Clauses Contractuelles Types (CCT)** approuvées par la Commission Européenne
2. **Certifications** (Privacy Shield successeurs, ISO 27001)
3. **Mesures de sécurité supplémentaires** : chiffrement de bout en bout, pseudonymisation

Vous disposez du droit d'obtenir une copie des garanties appropriées en contactant contact@faketect.com.

---

## 7. DURÉE DE CONSERVATION DES DONNÉES

### Comptes actifs
- Données de compte : Pendant toute la durée de la relation contractuelle
- Fichiers téléversés : 90 jours après l'analyse (suppression automatique)
- Résultats d'analyse : Conservés tant que le compte est actif

### Comptes inactifs
- Suppression automatique après 3 ans d'inactivité (aucune connexion)
- Email de notification 30 jours avant suppression

### Après fermeture de compte
- Données de compte : Suppression immédiate
- Données de facturation : 10 ans (obligation légale comptable)
- Données anonymisées : Conservation illimitée à des fins statistiques

### Logs et sécurité
- Logs de connexion : 12 mois
- Logs de sécurité : 12 mois

---

## 8. SÉCURITÉ DES DONNÉES

JARVIS met en œuvre des mesures techniques et organisationnelles pour protéger vos données :

### Mesures techniques
- **Chiffrement** : HTTPS/TLS pour toutes les communications
- **Chiffrement des mots de passe** : bcrypt avec salage
- **Chiffrement des données sensibles** : AES-256 pour le stockage
- **Pare-feu** : WAF (Web Application Firewall)
- **Sauvegardes** : Quotidiennes, chiffrées, stockées dans plusieurs datacenters
- **Authentification sécurisée** : JWT avec expiration, tokens session
- **Protection DDoS** : Via Cloudflare/Vercel

### Mesures organisationnelles
- **Accès restreint** : Authentification multi-facteurs pour les administrateurs
- **Journalisation** : Logs d'accès aux données personnelles
- **Formation** : Sensibilisation RGPD du personnel
- **Tests de sécurité** : Audits réguliers, tests de pénétration
- **Plan de réponse** : Procédure en cas de violation de données

### Notification de violation
En cas de violation de données susceptible d'engendrer un risque pour vos droits :
- Notification à la CNIL sous 72h
- Information des personnes concernées dans les meilleurs délais

---

## 9. VOS DROITS (RGPD)

Conformément aux articles 12 à 22 du RGPD, vous disposez des droits suivants :

### 9.1 Droit d'accès (Art. 15)
Obtenir la confirmation que vos données sont traitées et en recevoir une copie.

### 9.2 Droit de rectification (Art. 16)
Corriger vos données inexactes ou incomplètes.

### 9.3 Droit à l'effacement / "Droit à l'oubli" (Art. 17)
Demander la suppression de vos données dans les cas suivants :
- Données non nécessaires aux finalités initiales
- Retrait du consentement
- Opposition au traitement
- Traitement illicite
- Obligation légale de suppression

**Exceptions** : Conservation nécessaire pour obligations légales, constatation de droits en justice, archives d'intérêt public.

### 9.4 Droit à la limitation du traitement (Art. 18)
Demander le gel temporaire du traitement dans certains cas.

### 9.5 Droit à la portabilité (Art. 20)
Recevoir vos données dans un format structuré et couramment utilisé (JSON, CSV).

### 9.6 Droit d'opposition (Art. 21)
- **Opposition au profilage et marketing** : À tout moment
- **Opposition aux traitements fondés sur l'intérêt légitime** : Pour motifs légitimes

### 9.7 Droit de retirer votre consentement (Art. 7.3)
Pour les traitements basés sur le consentement, retrait possible à tout moment.

### 9.8 Droit de définir des directives post-mortem (Art. 85 LIL)
Définir le sort de vos données après votre décès.

### 9.9 Droit de ne pas faire l'objet d'une décision automatisée (Art. 22)
Contester toute décision basée uniquement sur un traitement automatisé.

---

## 10. EXERCICE DE VOS DROITS

### Comment exercer vos droits ?
**Par email :** contact@faketect.com  
**Par courrier :** JARVIS - DPO, 128 Rue la Boétie, 75008 PARIS

### Informations à fournir
- Nom, prénom
- Adresse email de votre compte
- Copie de pièce d'identité (en cas de doute sur l'identité)
- Description précise de votre demande

### Délai de réponse
- **1 mois** à compter de la réception de votre demande
- Prolongation possible de 2 mois supplémentaires en cas de complexité (avec notification)

### Gratuité
L'exercice de vos droits est **gratuit**. Des frais peuvent être facturés uniquement en cas de demandes manifestement infondées ou excessives.

---

## 11. RÉCLAMATION AUPRÈS DE LA CNIL

Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'autorité de contrôle :

**Commission Nationale de l'Informatique et des Libertés (CNIL)**  
3 Place de Fontenoy  
TSA 80715  
75334 PARIS CEDEX 07  
Téléphone : 01 53 73 22 22  
Site web : https://www.cnil.fr/fr/plaintes

---

## 12. COOKIES ET TRACEURS

Voir notre **Politique de Cookies** détaillée disponible sur notre site.

### Résumé
Nous utilisons :
- **Cookies strictement nécessaires** : Authentification, sécurité (sans consentement requis)
- **Cookies de performance** : Analytics anonymisé (avec consentement)
- **Cookies fonctionnels** : Préférences utilisateur, langue (avec consentement)

Vous pouvez gérer vos préférences via le bandeau de consentement ou les paramètres de votre compte.

---

## 13. MINEURS

Nos services sont destinés aux personnes majeures (18 ans et plus). Si vous avez moins de 18 ans, vous devez obtenir l'accord de vos parents ou tuteurs légaux avant de créer un compte.

Si nous découvrons qu'un mineur a créé un compte sans autorisation parentale, nous supprimerons immédiatement ce compte.

---

## 14. LIENS EXTERNES

Notre site peut contenir des liens vers des sites tiers. Nous ne sommes pas responsables de leurs pratiques en matière de protection des données. Nous vous invitons à consulter leurs politiques de confidentialité respectives.

---

## 15. MODIFICATIONS DE LA POLITIQUE

Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification substantielle sera :
- Notifiée par email aux utilisateurs enregistrés
- Affichée sur le site avec mise à jour de la date
- Effective 30 jours après notification

L'utilisation continue de nos services après modification vaut acceptation de la nouvelle politique.

---

## 16. DONNÉES COLLECTÉES AUTOMATIQUEMENT

### Intelligence artificielle et analyse
Les fichiers téléversés (images, vidéos, textes) sont analysés par nos algorithmes et peuvent être transmis à nos partenaires IA (OpenAI). Ces données sont :
- Traitées de manière confidentielle
- Supprimées automatiquement après 90 jours
- Non utilisées pour entraîner des modèles IA sans votre consentement explicite

### Métadonnées des fichiers
Nous collectons automatiquement :
- Type de fichier (JPEG, PNG, MP4, etc.)
- Taille du fichier
- Résolution (pour images/vidéos)
- Date de création du fichier (EXIF si disponible)
- Hash cryptographique pour détection de doublons

---

## 17. PARTAGE DE DONNÉES AVEC LES FORCES DE L'ORDRE

En cas de demande légale des autorités compétentes (police, justice), nous pouvons être contraints de communiquer vos données personnelles dans les cas suivants :
- Réquisition judiciaire
- Enquête préliminaire
- Prévention d'infractions graves

Ces communications se font dans le strict respect de la législation en vigueur et uniquement dans la limite de ce qui est légalement requis.

---

## 18. UTILISATION DE L'INTELLIGENCE ARTIFICIELLE

### Transparence sur l'IA
Notre service utilise des modèles d'intelligence artificielle pour :
- Détecter les deepfakes dans les images et vidéos
- Analyser les textes générés par IA
- Générer des scores de probabilité

### Limitations et responsabilité
- Les résultats sont probabilistes et ne constituent pas une preuve absolue
- Aucune décision automatisée n'est prise sans possibilité d'intervention humaine
- Vous pouvez contester tout résultat en contactant notre support

---

## 19. DONNÉES SENSIBLES

Nous ne collectons **AUCUNE** donnée sensible au sens de l'article 9 du RGPD :
- Origine raciale ou ethnique
- Opinions politiques, religieuses ou philosophiques
- Appartenance syndicale
- Données génétiques ou biométriques
- Données de santé
- Vie sexuelle ou orientation sexuelle

Si de telles données apparaissent dans les fichiers que vous téléversez pour analyse, elles sont traitées de manière strictement confidentielle et supprimées selon notre calendrier de rétention.

---

## 20. CONTACT

Pour toute question relative à cette politique de confidentialité ou à l'exercice de vos droits :

**Email :** contact@faketect.com  
**Courrier :** JARVIS - Service Protection des Données  
128 Rue la Boétie, 75008 PARIS  
**Téléphone :** (À compléter si disponible)

**Délégué à la Protection des Données (DPO) :**  
dpo@faketect.com

---

**Date d'entrée en vigueur : 28 décembre 2024**  
**Version : 1.0**
