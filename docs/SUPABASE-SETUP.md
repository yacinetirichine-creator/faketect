# 🗄️ Configuration Supabase

## 1. Créer un projet

1. Aller sur [supabase.com](https://supabase.com)
2. **Start your project** → Se connecter avec GitHub
3. **New Project** :
   - Name: `faketect`
   - Password: (générer un mot de passe)
   - Region: `West EU (Paris)`
4. Attendre ~2 min

## 2. Récupérer les clés

**Settings** → **API** :
- **Project URL** → `SUPABASE_URL`
- **anon public** → `SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_KEY` (⚠️ secret)

## 3. Créer les tables

**SQL Editor** → **New query** → Coller `supabase-schema.sql` → **Run**

Ce script crée aussi le quota "invité" (3 analyses gratuites/jour par IP hash) via la table `guest_daily_usage` et deux RPC : `get_guest_quota` / `consume_guest_quota`.

### Activer la certification (requis pour les rapports certifiés)

Dans **SQL Editor** → **New query** → Coller `supabase-certification.sql` → **Run**

Ce script ajoute la table `certificates` (payload JSONB + hash + signature + hash PDF) et des policies RLS.

Sans cette table, les endpoints de génération de rapport certifié (`/api/report/generate*`) ne pourront pas persister/vérifier les certificats.

## 4. Configurer les .env

### Backend (packages/api/.env)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Recommandé (prod): signature HMAC des certificats
CERT_SIGNING_SECRET=change-me
```

### Frontend (packages/web/.env)
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 5. Google OAuth (optionnel)

1. **Authentication** → **Providers** → **Google** → Enable
2. Créer credentials sur [Google Cloud Console](https://console.cloud.google.com)
3. Redirect URI: `https://[projet].supabase.co/auth/v1/callback`

## Limites gratuites

- 500 MB BDD
- 1 GB transfert/mois
- 50k requêtes auth/mois

**Largement suffisant pour un MVP !**
