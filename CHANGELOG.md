# Changelog - FakeTect

## [2.0.1] - 2025-12-20

### 🔒 Security

- **CRITICAL:** Durcissement de la vérification `DEV_AUTH_BYPASS` avec triple validation
  - Évite activation accidentelle en production
  - Avertissement console si activé
- Ajout de validation pour bloquer les extensions de fichiers dangereuses (.exe, .sh, .bat, etc.)
- Codes d'erreur standardisés avec gestion améliorée

### 🐛 Bug Fixes

- **CRITICAL:** Correction fuite mémoire dans `guest-quota.js` (Map non nettoyée)
- **CRITICAL:** Correction fuite mémoire dans `supabase.js` (inMemoryVideoQuota non nettoyée)
- **CRITICAL:** Ajout du nettoyage automatique des fichiers temporaires (uploads/reports)
- Amélioration gestion d'erreurs avec codes standardisés (UNAUTHORIZED, QUOTA_EXCEEDED, etc.)

### ✨ Features

- **Nouveau service:** Système de métriques de performance (`services/metrics.js`)
  - Suivi des analyses (total, par type, par utilisateur)
  - Mesure des temps de réponse (moyenne, P95, P99)
  - Taux de détection IA et succès des providers
  - Quotas dépassés et taux d'erreur
- **Nouveau endpoint:** `GET /api/metrics` (sécurisé par token admin)
- **Amélioration:** Health check détaillé avec métriques en temps réel
- **Amélioration:** Upload vidéo avec affichage de la progression
- **Amélioration:** Timeout vidéo étendu à 10 minutes pour gros fichiers

### 🚀 Performance

- Implémentation de retry logic avec backoff exponentiel pour Supabase
  - 3 tentatives avec délais croissants (1s, 2s, 4s)
  - Appliqué à `getUser()`, `getProfile()`, `checkQuota()`
- Nettoyage périodique automatique (toutes les heures):
  - Maps en mémoire (quotas invités et vidéo)
  - Fichiers temporaires > 1h d'ancienneté
- Optimisation mémoire et stabilité long-terme

### 📝 Documentation

- Ajout de `AMELIORATIONS.md` avec analyse détaillée
- Documentation des nouveaux endpoints
- Guide de configuration et déploiement

### 🔧 Configuration

- Nouvelle variable optionnelle: `ADMIN_METRICS_TOKEN`
- Mise à jour de `.env.example`

---

## [2.0.0] - 2025-12-XX

### ✨ Features

- Analyse multi-provider (Sightengine + Illuminarty)
- Support vidéo avec extraction de frames
- Analyse de documents (PDF, Word, PowerPoint, Excel)
- Système de facturation Stripe
- Génération de rapports PDF certifiés
- Gestion RGPD complète
- Quotas pour invités et utilisateurs authentifiés

### 🏗️ Architecture

- Architecture monorepo (API, Web, Extension)
- Intégration Supabase pour auth et données
- Rate limiting et sécurité renforcée
- Support multi-plateforme (Web, Extension Chrome)

---

## Format

Ce changelog suit le format [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).
