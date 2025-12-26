# Déploiement (Vercel + Domaines)

Objectif:
- `faketect.com` → site (landing)
- `app.faketect.com` → application web (redirige `/` vers `/app`)
- `api.faketect.com` → API (Render/Docker avec `ffmpeg`)

## 1) Pré-requis
- Repo Git (GitHub) avec ce monorepo
- Projet Supabase configuré
- API déployée (recommandé hors Vercel si tu veux l'analyse vidéo via `ffmpeg`)

## 2) Déployer le frontend sur Vercel

Créer un **projet Vercel** connecté au repo.

Réglages Vercel:
- **Root Directory**: `packages/web`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Variables d'environnement (Vercel → Project Settings → Environment Variables):
- `VITE_API_URL` = `https://api.faketect.com` (ou ton URL d'API)
- `VITE_SUPABASE_URL` = `https://<project>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `<anon-key>`

Note:
- `packages/web/vercel.json` gère le fallback SPA + la redirection automatique de `app.faketect.com/` vers `/app`.

## 3) Configurer les domaines

Dans Vercel → Project → Settings → Domains:
- Ajouter `faketect.com`
- Ajouter `www.faketect.com` (optionnel)
- Ajouter `app.faketect.com`

Dans Render (pour l'API):
- Ajouter `api.faketect.com` comme **Custom Domain** du service `faketect-api`

DNS:
- Suivre exactement les instructions Vercel (A/CNAME) pour pointer le domaine.

Recommandation DNS (générique):
- `faketect.com` → Vercel
- `app.faketect.com` → Vercel
- `api.faketect.com` → Render

Le provider DNS (OVH/Cloudflare/etc) te donnera soit:
- un `CNAME` vers `cname.vercel-dns.com` (souvent pour sous-domaines),
- et/ou des enregistrements `A` (souvent pour apex `faketect.com`).

## 4) API (recommandation)

L'endpoint `POST /api/analyze/video` dépend de `ffmpeg`. Sur Vercel (serverless), `ffmpeg` n'est généralement pas disponible.

Recommandé:
- Déployer l'API (`packages/api`) sur Render/Fly/Railway/Docker avec `ffmpeg` installé.
- Exposer l'API sur `https://api.faketect.com`.

### Déploiement Render (recommandé)

Le repo contient un blueprint Render `render.yaml` et un Dockerfile `packages/api/Dockerfile`.

Étapes:
1. Render → **New** → **Blueprint** → sélectionner le repo `yacinetirichine-creator/faketect`
2. Render détecte `render.yaml` et propose le service `faketect-api`
3. Renseigner les variables `sync:false` (Supabase + providers + `CERT_SIGNING_SECRET`)
4. Déployer
5. Render → Service → **Settings** → **Custom Domains** → ajouter `api.faketect.com`

CORS côté API (prod):
- Dans `packages/api/.env`, mettre par ex.
  - `ALLOWED_ORIGINS=https://faketect.com,https://app.faketect.com`

## 6) Checklist finale

- Vercel: `packages/web` déployé + domaines `faketect.com` et `app.faketect.com` validés
- Render: `faketect-api` up + `https://api.faketect.com/api/health` retourne `status=ok`
- Web: `VITE_API_URL=https://api.faketect.com`
- Supabase: schéma SQL appliqué (inclut quota vidéo)

## 5) Quotas vidéo

- `VIDEO_MAX_SECONDS=60` (limite de durée analysée)
- `VIDEO_DAILY_LIMIT=15` (quota vidéos/jour/utilisateur)

Si Supabase est utilisé:
- Exécuter le SQL de `docs/supabase-schema.sql` (inclut `video_daily_usage` + RPC quota vidéo).
