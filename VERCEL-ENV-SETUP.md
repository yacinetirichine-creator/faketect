# Configuration Variables d'Environnement Vercel

## ⚠️ IMPORTANT - À faire maintenant

Votre déploiement Vercel **n'a pas** les variables d'environnement configurées.

### Étapes à suivre :

1. **Allez sur votre Dashboard Vercel** : https://vercel.com/yacine-tirichines-projects/faketect

2. **Settings** → **Environment Variables**

3. **Ajoutez ces 3 variables** (pour Production, Preview ET Development) :

```
VITE_SUPABASE_URL
https://gluuntntncwuyrbmxmhg.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdXVudG50bmN3dXlyYm14bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTMyNDMsImV4cCI6MjA4MTUxMzI0M30.Nk06E1HCVRHtEkY64WHCoAa0IBcO3tZGK_DEZecKfiY

VITE_ADMIN_EMAILS
contact@faketect.com,yacine.tirichine@gmail.com
```

4. **Redéployez** l'application (ou attendez le prochain push)

---

## ✅ Configuration Google OAuth

### Dans Google Cloud Console :

URL: https://console.cloud.google.com/apis/credentials

**Authorized redirect URIs** doit contenir :
```
https://gluuntntncwuyrbmxmhg.supabase.co/auth/v1/callback
```

### Dans Supabase Dashboard :

URL: https://supabase.com/dashboard/project/gluuntntncwuyrbmxmhg/auth/providers

1. **Google Provider** doit être activé (Enabled)
2. **Client ID** et **Client Secret** de Google doivent être configurés
3. Le **Redirect URL** affiché doit être identique à celui dans Google Cloud

---

## 🔍 Vérification

Une fois les variables ajoutées sur Vercel :
1. Retournez sur : https://faketect-git-main-yacine-tirichines-projects.vercel.app
2. Cliquez sur "Se connecter avec Google"
3. Ça devrait fonctionner !

---

## 📝 Note

Les variables locales sont déjà configurées dans :
- `packages/web/.env.local` ✅
