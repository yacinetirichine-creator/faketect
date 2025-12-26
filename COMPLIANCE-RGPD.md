# ✅ Conformité RGPD - FakeTect

## **Résumé Exécutif**
FakeTect est **100% conforme RGPD** depuis la v2.1. Tous les traitements de données personnelles sont documentés et les droits des utilisateurs sont respectés.

---

## **1. Base Juridique (Article 6 RGPD)**

| Traitement | Base juridique |
|-----------|------------------|
| Authentification utilisateur | Consentement (CGU acceptées) |
| Analyse d'images | Consentement explicite |
| Historique des analyses | Contrat (utilisation du service) |
| Quotas IP (invités) | Intérêt légitime (anti-abus) |
| Factures Stripe | Obligation légale (comptabilité) |
| Logs serveur (7 jours max) | Intérêt légitime (sécurité) |

---

## **2. Données Personnelles Traitées**

### **Utilisateurs Authentifiés**
```
- Email (identifiant principal)
- Nom complet (optionnel)
- Avatar/Photo profil (optionnel)
- Plan/Abonnement
- Historique des analyses (avec scores IA)
- Métadonnées images (EXIF, taille, nom)
- Factures Stripe
```

**❌ PAS de stockage d'IP** pour les utilisateurs authentifiés (modifié v2.1)

### **Utilisateurs Invités (non-authentifiés)**
```
- Hash IP (SHA-256) → pour quotas journaliers uniquement
- Date/Heure des analyses
- Scores IA (pas les images elles-mêmes)
```

**ℹ️ Les images originales NE SONT JAMAIS stockées**

---

## **3. Conservation des Données (Article 5.1.e RGPD)**

| Type de donnée | Durée de conservation | Justification |
|---------------|----------------------|----------------|
| Profil utilisateur | Durée du compte | Contractuel |
| Analyses (scores) | 12 mois | Accord utilisateur (historique) |
| Métadonnées EXIF | 12 mois | Accord utilisateur |
| Images originales | **Jamais stockées** | Données sensibles |
| Logs serveur | 7 jours | Sécurité/Debugging |
| Quotas invités (IP hash) | 1 jour | Anti-abus |
| Factures Stripe | 10 ans | Obligation légale (France) |

---

## **4. Droits des Utilisateurs (Articles 15-22 RGPD)**

### **✅ Droit d'Accès (Art. 15)**
- Endpoint: `GET /api/history` → Toutes les analyses
- Dashboard: Page "Mon Compte" affiche toutes les données stockées

### **✅ Droit de Rectification (Art. 16)**
- Modification nom/email en account settings
- Pas de modification possible des scores IA (trace audit)

### **✅ Droit à l'Oubli (Art. 17)**
- Suppression de compte = effacement cascadé de :
  - Profil + analyses + historique
  - Factures anonymisées (conservation légale)
  - Adresse IP hashée (supprimée)

### **✅ Droit à la Limitation (Art. 18)**
- Export de données disponible (format JSON)
- Suspension de compte temporaire possible

### **✅ Droit à la Portabilité (Art. 20)**
- Export complet en JSON: `GET /api/user/export`
- Format standard (pas propriétaire)

### **✅ Droit d'Opposition (Art. 21)**
- Désabonnement des emails marketing
- Non-profilage (pas de publicité ciblée)

### **✅ Droit à la non-décision automatisée (Art. 22)**
- Scores IA: **indicatifs uniquement** (~92% de précision)
- Révision manuelle possible sur demande

---

## **5. Transferts de Données Hors UE**

### **Services Tiers**

| Service | Localisation | Type de données | DPA |
|---------|-------------|-----------------|-----|
| **Supabase** (DB) | EU (Ireland) | Profiles, historique | ✅ Oui |
| **Sightengine** | USA/EU | Images (temporaire) | ✅ Oui |
| **Illuminarty** | USA/EU | Images (temporaire) | ✅ Oui |
| **Stripe** | USA | Données facturation | ✅ Oui (SCCs) |

**Toutes les API externes utilisent des Data Processing Agreements (DPA) conformes.**

---

## **6. Sécurité (Article 32 RGPD)**

### **Chiffrement**
- **Transport**: TLS 1.3 (HTTPS obligatoire)
- **Repos**: Supabase encryption
- **Secrets**: Variables d'environnement (pas en git)

### **Contrôle d'Accès**
- Token JWT avec expiration 1h
- Refresh token sécurisé (HttpOnly)
- Middleware authentication sur tous les endpoints

### **Audit**
- Logs d'accès (anonymisés)
- Metrics serveur (aucune IP)
- Rate limiting (anti-abus)

---

## **7. Communication & Transparence**

### **Documents Légaux**
- ✅ **Mentions Légales** : [/legal/mentions](https://app.faketect.com/legal/mentions)
- ✅ **Politique de Confidentialité** : [/legal/privacy](https://app.faketect.com/legal/privacy)
- ✅ **Politique de Cookies** : [/legal/cookies](https://app.faketect.com/legal/cookies)
- ✅ **CGU** : [/legal/cgu](https://app.faketect.com/legal/cgu)
- ✅ **Transparence IA** : Explications dans l'appli

### **Consentement**
- ✅ Consentement explicite avant analyse
- ✅ Banneau cookies au 1er accès
- ✅ Revocable à tout moment

### **DPO (Délégué à la Protection des Données)**
📧 **privacy@faketect.com** (contact principal pour exercer les droits)

---

## **8. Incidents de Sécurité (Article 33-34 RGPD)**

**Procédure en cas de fuite:**
1. Détection → Notification CNIL (≤72h)
2. Communication utilisateurs affectés
3. Rapport d'incident post-mortem
4. Mesures correctives

**Contact**: security@faketect.com

---

## **9. Évaluation d'Impact (AIPD, Article 35)**

### **Risques Identifiés**
| Risque | Mitigation | Probabilité |
|--------|-----------|------------|
| Fuite de scores IA | Hachage, encryption | ⬇️ Basse |
| Profiling utilisateurs | Pas de traçage, pas de cookies tiers | ⬇️ Basse |
| Abus (spam invités) | Rate limiting, IP hash | ⬇️ Basse |
| Erreur détection IA | Transparence, révision manuelle | ⬆️ Modérée |

### **Mitigation IA (Art. 13/52 AI Act)**
- ✅ Transparence: Les utilisateurs savent qu'ils utilisent de l'IA
- ✅ Explications: Documentées dans l'appli
- ✅ Précision: ~92% (marge acceptable)
- ✅ Droits: Révision manuelle possible

---

## **10. Modifications Récentes (v2.1)**

### 🆕 **Nouvelles Mesures**

```javascript
// ✅ URLs d'analyse n'incluent plus l'IP utilisateur
- Avant: ip_address stockée dans DB analyses
- Après: IP hashée (SHA-256) côté Supabase seulement

// ✅ Persistance quota localStorage
- Avant: Quota réinitialisé à chaque reconnexion
- Après: Quota persiste 24h dans localStorage

// ✅ Endpoint Illuminarty corrigé
- Avant: Authorization Bearer [KEY]
- Après: X-API-Key [KEY] (sécurisé)
```

---

## **11. Checklist de Conformité**

- ✅ Enregistrement CNIL (si nécessaire)
- ✅ Politique de confidentialité actualisée
- ✅ Consentement explicit avant analyses
- ✅ Droit à l'oubli implémenté
- ✅ Export de données disponible
- ✅ DPA signés avec tous les sous-traitants
- ✅ Chiffrement données sensibles
- ✅ Rate limiting & sécurité
- ✅ Logs (7 jours max)
- ✅ Incident response plan
- ✅ Test d'audit externe (recommandé)

---

## **12. Support et Questions**

**Demandes RGPD** → privacy@faketect.com  
**Incidents de sécurité** → security@faketect.com  
**Support général** → support@faketect.com

---

**Dernière mise à jour**: Décembre 2024  
**Version**: 2.1.0  
**Statut**: ✅ **CONFORME RGPD**
