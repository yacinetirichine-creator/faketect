# 🚨 URGENT : Corriger l'URL de l'API

## Problème identifié

Le site charge indéfiniment car `VITE_API_URL` est configuré sur `https://api.faketect.com` qui n'existe pas.

## Solution

### Option 1 : Via Vercel Dashboard (RECOMMANDÉ - 2 minutes)

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `faketect`
3. Allez dans **Settings** → **Environment Variables**
4. Trouvez `VITE_API_URL` et cliquez sur **Edit**
5. Changez la valeur en : `https://faketect-api.onrender.com`
6. Cliquez sur **Save**
7. Allez dans **Deployments** et cliquez sur **Redeploy** pour la dernière version

### Option 2 : Via Vercel CLI (5 minutes)

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Aller dans le dossier web
cd packages/web

# Supprimer l'ancienne variable
vercel env rm VITE_API_URL production

# Ajouter la nouvelle
vercel env add VITE_API_URL production
# Quand demandé, entrer: https://faketect-api.onrender.com

# Redéployer
vercel --prod
```

## Vérification

Une fois redéployé (environ 1-2 minutes), testez :

```bash
# Vérifier que l'API répond
curl https://faketect-api.onrender.com/api/health

# Tester le site
open https://faketect.app
```

Le site devrait maintenant se charger correctement !

## Contexte technique

- ✅ Backend API: `https://faketect-api.onrender.com` (fonctionne)
- ❌ Ancien domaine: `https://api.faketect.com` (n'existe pas)
- Le fichier `.env` local a été corrigé mais n'est pas versionné (pour la sécurité)
- Les variables d'environnement Vercel doivent être mises à jour manuellement
