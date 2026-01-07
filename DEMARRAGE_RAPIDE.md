# 🚀 Guide de Démarrage Rapide - FakeTect

## ❌ Problème de Connexion Résolu

Le problème de connexion était dû à :
1. ❌ Dépendances non installées (backend et frontend)
2. ❌ Fichier `.env` manquant dans le backend
3. ❌ Client Prisma non généré
4. ⚠️ DATABASE_URL Supabase non configurée

### ✅ Corrections Appliquées

- ✅ Installation des dépendances backend (`npm install`)
- ✅ Installation des dépendances frontend (`npm install`)
- ✅ Création du fichier `.env` avec configuration de base
- ✅ Génération du client Prisma

## 🔧 Configuration Finale Requise

### 1. Configurer la Base de Données Supabase

**Votre fichier `backend/.env` nécessite votre mot de passe Supabase :**

```bash
cd backend
nano .env  # ou utilisez votre éditeur préféré
```

Modifiez la ligne :
```env
DATABASE_URL="postgresql://postgres.ljrwqjaflgtfddcyumqg:[YOUR_PASSWORD]@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres"
```

**Comment obtenir votre mot de passe :**
1. Allez sur https://supabase.com/dashboard/project/ljrwqjaflgtfddcyumqg/settings/database
2. Section "Database Password" → Cliquez sur "Reset Database Password" si vous l'avez oublié
3. Copiez le mot de passe et remplacez `[YOUR_PASSWORD]` dans le .env

### 2. Pousser le Schéma vers Supabase

```bash
cd backend
npx prisma db push
```

Cette commande créera les tables `User` et `Analysis` dans votre base Supabase.

## 🚀 Démarrage des Serveurs

### Terminal 1 - Backend :
```bash
cd backend
npm run dev
```

Le backend démarrera sur http://localhost:3001

### Terminal 2 - Frontend :
```bash
cd frontend
npm run dev
```

Le frontend démarrera sur http://localhost:5173

## ✅ Vérification

Une fois les deux serveurs démarrés :

1. Ouvrez http://localhost:5173
2. Essayez de vous inscrire avec un nouveau compte
3. Ou connectez-vous si vous avez déjà un compte

## 🐛 Erreurs Courantes

### "Can't reach database server"
→ Le mot de passe Supabase n'est pas configuré dans `backend/.env`

### "Failed to load resource: 400" sur /api/auth/register
→ Vérifiez que le schéma Prisma est poussé : `npx prisma db push`

### "CORS error"
→ Vérifiez que `FRONTEND_URL=http://localhost:5173` est dans `backend/.env`

## 📝 Variables d'Environnement Minimales

Votre `backend/.env` doit contenir au minimum :

```env
DATABASE_URL="postgresql://postgres.ljrwqjaflgtfddcyumqg:VOTRE_MOT_DE_PASSE@db.ljrwqjaflgtfddcyumqg.supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345678"
PORT=3001
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_TEST_KEY
```

Les autres variables (OpenAI, Illuminarty, etc.) sont optionnelles et pour les fonctionnalités avancées.

## 🎉 C'est Parti !

Une fois configuré, vous pouvez :
- ✅ Créer un compte
- ✅ Se connecter
- ✅ Analyser des images/vidéos (avec les APIs configurées)
- ✅ Gérer votre profil

---

**Besoin d'aide ?** Consultez `SUPABASE_CONFIG.md` pour plus de détails sur la configuration.
