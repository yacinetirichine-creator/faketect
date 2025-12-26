# FakeTect v2.1.0 - Changelog

## 📅 Date: 25 Décembre 2025

## 🎉 Nouvelles fonctionnalités

### 1. Système Free Plan obligatoire
- ⛔ **Analyses anonymes désactivées** - Les utilisateurs doivent maintenant s'inscrire pour analyser
- ✅ **Plan Free gratuit** avec 3 analyses/jour sans carte bancaire
- 🎁 Inscription rapide en 30 secondes
- 📊 Historique des analyses conservé

### 2. Dashboard Client complet (`/dashboard`)
- 📈 **Vue d'ensemble** avec statistiques personnalisées
- 📋 **Historique** de toutes les analyses avec filtres (IA détectée/Authentique)
- 🧾 **Factures** accessibles et téléchargeables
- 📊 **Statistiques** détaillées sur 30 jours avec graphiques
- 🎯 **Widget quota** avec progression visuelle

### 3. Dashboard Admin amélioré
- 💰 **Chiffre d'affaires** réel (total + mensuel)
- 📊 **Répartition utilisateurs** par plan (Free, Starter, Pro, Business, Enterprise)
- 🚨 **Problèmes IA** remontés avec compteur (ouvertes/total)
- 👥 **Liste clients** avec nombre d'analyses et dernier accès
- 🔒 **Blocage utilisateurs** avec confirmation
- 📤 **Export CSV** des utilisateurs

### 4. Landing Page améliorée
- 🎨 **Animation 3D interactive** qui suit la souris
- 📊 **Compteurs animés** pour les statistiques
- ⭐ **Social proof** avec évaluations
- 🎯 **CTA optimisés** pour l'inscription gratuite
- 🏢 **Cas d'usage** par secteur (Assurances, RH, Médias, Juridique)

### 5. Améliorations techniques
- 🔐 Middleware `requireAuthMiddleware` pour forcer l'authentification
- 📡 Nouvelles routes API `/api/user/*` pour le dashboard client
- 🗄️ Schéma SQL mis à jour avec nouvelles tables et fonctions
- ⚡ Performance optimisée avec lazy loading

## 🐛 Corrections de bugs
- Fix: Analyses sans inscription qui contournaient les quotas
- Fix: Stats admin incorrectes pour le CA
- Fix: Problèmes de remontées agent IA non visibles

## 📁 Fichiers modifiés

### Backend (packages/api)
- `middleware/auth.js` - Ajout `requireAuthMiddleware`, blocage analyses anonymes
- `routes/user.js` - **NOUVEAU** - Routes dashboard client
- `routes/admin.js` - Stats améliorées avec CA détaillé
- `server.js` - Ajout routes user

### Frontend (packages/web)
- `src/App.jsx` - Ajout route `/dashboard`
- `src/pages/ClientDashboard.jsx` - **NOUVEAU** - Dashboard client
- `src/pages/LandingPage.jsx` - Animation 3D et refonte design
- `src/pages/HomePage.jsx` - Blocage analyses anonymes
- `src/pages/AdminDashboard.jsx` - Stats améliorées
- `src/index.css` - Styles 3D et animations

### Base de données
- `docs/supabase-v2.1-update.sql` - **NOUVEAU** - Migrations pour v2.1

## 🚀 Instructions de déploiement

### 1. Exécuter les migrations SQL
```sql
-- Dans l'éditeur SQL de Supabase
-- Exécuter le contenu de docs/supabase-v2.1-update.sql
```

### 2. Déployer le code
```bash
git add .
git commit -m "v2.1.0 - Free Plan obligatoire, Dashboard Client, Admin amélioré"
git push origin main
# Le déploiement Vercel se fait automatiquement
```

### 3. Vérifier les variables d'environnement
Assurez-vous que `ADMIN_EMAILS` contient votre email admin.

## 📝 Notes importantes

- Les utilisateurs existants avec plan `free` conservent leurs quotas
- Les nouvelles inscriptions démarrent automatiquement en plan `free` avec 3 analyses/jour
- L'historique des analyses est conservé pour tous les utilisateurs
- Le CA mensuel se réinitialise automatiquement chaque 1er du mois
