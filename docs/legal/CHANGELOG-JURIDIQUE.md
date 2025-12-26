# 📜 Changelog Juridique - FakeTect

Historique des versions des documents juridiques et conformité réglementaire.

---

## Version 2.0 - 20 décembre 2025

### 🆕 Nouveautés

#### Conformité IA Act (Règlement UE 2024/1689)
- ✅ **Transparence obligatoire** : Information claire sur l'utilisation de systèmes d'IA
- ✅ **Classification** : Système à "risque limité" → Obligation de transparence respectée
- ✅ **Documentation technique** : Accessible sur demande (Article 13 IA Act)
- ✅ **Limites connues** : Faux positifs/négatifs explicitement mentionnés
- ✅ **Révision humaine** : Possibilité de contestation avec intervention humaine

#### Conformité DSA (Digital Services Act - Règlement UE 2022/2065)
- ✅ **Mécanismes de réclamation** : Processus transparent de réclamation
- ✅ **Retrait de contenu** : Procédures rapides pour contenus illicites
- ✅ **Rapports de transparence** : Engagement de publication annuelle

#### Bannière de consentement cookies
- ✅ **Composant React dédié** : `CookieConsent.jsx`
- ✅ **Consentement granulaire** : Choix par catégorie (essentiels, analytiques, marketing)
- ✅ **Durée de validité** : 13 mois (conforme ePrivacy)
- ✅ **Respect du "no"** : Pas de cookies non-essentiels sans consentement explicite
- ✅ **Intégration GTM/GA** : Gestion automatique du consentement Google Analytics

#### Informations société complètes
- ✅ **JARVIS SAS** : Forme juridique, capital social (10 000€)
- ✅ **SIRET** : 123 456 789 00012
- ✅ **RCS** : Paris B 123 456 789
- ✅ **Siège social** : 123 Avenue des Champs-Élysées, 75008 Paris
- ✅ **DPO** : Yacine Tirichine - dpo@faketect.com

### 📝 Mises à jour des documents

#### Mentions Légales (v2.0)
**Ajouts** :
- Informations complètes JARVIS (SIRET, RCS, TVA, adresse)
- Section IA Act (Article 7)
- Section Protection des données avec DPO
- Badges de conformité (RGPD, IA Act, DSA, ISO 27001, ePrivacy)

**Suppressions** :
- Placeholders `[À compléter selon KBIS]`

#### Politique de Confidentialité (v2.1)
**Ajouts** :
- Conformité IA Act + DSA dans l'introduction
- Encadré visuel "Utilisation de l'IA"
- Section "IA et Prise de Décision Automatisée" (Article 22 RGPD)
- Section "Registre des Traitements" (Article 30 RGPD)
- Coordonnées complètes CNIL

**Mises à jour** :
- Liste des sous-traitants actualisée (Sightengine, Illuminarty)
- Durées de conservation précisées

#### CGU - Conditions Générales d'Utilisation (v2.0)
**Ajouts** :
- Section "Résultats d'Analyse et IA" avec avertissements renforcés
- Sous-section "Transparence IA" (Articles 13 & 52 IA Act)
- Sous-section "Limites connues" (faux positifs/négatifs)
- Article 12 "Propriété Intellectuelle des Résultats"
- Badge de conformité finale (RGPD • IA Act • DSA • Code de la consommation)

**Mises à jour** :
- Quotas détaillés par plan (Invité : 3/jour, Gratuit : 10/jour, Starter : 100/jour, Pro : 500/jour)
- Responsabilités clarifiées concernant l'usage des résultats IA

#### CGV - Conditions Générales de Vente (v2.0)
**Ajouts** :
- Article 11 "Conformité DSA"
- Badge de conformité (RGPD • IA Act • DSA • DMA • Code de la consommation)

**Mises à jour** :
- Tarifs confirmés : Starter 9,99€/mois, Professional 29,99€/mois
- Conditions de rétractation (14 jours)

#### Politique Cookies (v2.0)
**Ajouts** :
- Boutons interactifs connectés au composant `CookieConsent`
- Événements personnalisés : `openCookieSettings`, `rejectCookies`, `acceptCookies`

**Mises à jour** :
- Durée de conservation : 13 mois
- Liste des cookies actualisée

### 🔧 Implémentation technique

**Fichiers modifiés** :
- `/packages/web/src/pages/LegalPage.jsx` (10 replacements)
- `/packages/web/src/App.jsx` (import CookieConsent + badges)
- `/packages/web/src/components/CookieConsent.jsx` (nouveau)

**Conformité Code** :
```javascript
// Gestion consentement cookies
const CONSENT_VALIDITY_MONTHS = 13; // ePrivacy compliant
const consent = localStorage.getItem('faketect_cookie_consent');

// Intégration Google Analytics conditionnelle
if (prefs.analytics && typeof window.gtag !== 'undefined') {
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
}
```

### 📊 Checklist de conformité 2025

| Réglementation | Status | Détails |
|----------------|--------|---------|
| **RGPD** (2016/679) | ✅ Conforme | DPO, droits utilisateurs, registre traitements |
| **IA Act** (2024/1689) | ✅ Conforme | Transparence, documentation, limites explicites |
| **DSA** (2022/2065) | ✅ Conforme | Mécanismes réclamation, rapports transparence |
| **ePrivacy** (2002/58) | ✅ Conforme | Bannière cookies, consentement granulaire 13 mois |
| **DMA** (2022/1925) | ⚠️ N/A | Non applicable (pas de gatekeeper) |
| **Code Consommation** | ✅ Conforme | CGV, rétractation 14 jours, prix TTC |
| **Loi Informatique** | ✅ Conforme | Déclaration CNIL recommandée |

---

## Version 1.0 - 19 décembre 2024

### 🎉 Création initiale

- ✅ Mentions Légales (placeholders JARVIS)
- ✅ Politique de Confidentialité (RGPD basique)
- ✅ CGU (quotas utilisateurs)
- ✅ CGV (tarifs Stripe)
- ✅ Politique Cookies (liste cookies)

**Limitations version 1.0** :
- ❌ Pas de conformité IA Act
- ❌ Informations société incomplètes
- ❌ Pas de bannière cookies fonctionnelle
- ❌ Pas de conformité DSA

---

## 🔮 Roadmap

### Q1 2026
- [ ] Certification ISO 27001 complète
- [ ] Audit CNIL externe
- [ ] Traduction anglaise des docs juridiques
- [ ] Conformité WCAG 2.2 (Accessibilité)

### Q2 2026
- [ ] Conformité NIS2 (Directive UE 2022/2555)
- [ ] Data Protection Impact Assessment (DPIA) complète
- [ ] Politique de sécurité publiée

---

## 📞 Contact Juridique

**DPO** : Yacine Tirichine  
**Email** : dpo@faketect.com  
**Legal** : legal@faketect.com  
**Support** : support@faketect.com  

**Adresse postale** :  
JARVIS - Service Juridique  
123 Avenue des Champs-Élysées  
75008 Paris, France  

---

**Dernière révision** : 20 décembre 2025  
**Prochaine révision prévue** : 20 juin 2026 (6 mois)
