# Sécurité & Quotas (API)

## CORS (production)

- En `NODE_ENV=development`: CORS permissif.
- En production: **allowlist obligatoire** via `ALLOWED_ORIGINS` (liste CSV).
- Les origines `chrome-extension://` et `moz-extension://` sont autorisées.

## Auth

- Auth via token Supabase (`Authorization: Bearer <token>`).
- `DEV_AUTH_BYPASS=true` (dev uniquement, et seulement si Supabase non configuré) permet de simuler un user.

## Rate limiting

- `express-rate-limit` sur `/api/*`
- `RATE_LIMIT_PER_MINUTE` (défaut 60/min).

## Upload & validation

- `POST /api/analyze/upload`: limite 10MB, types image autorisés.
- `POST /api/analyze/base64`: limite 10MB décodés.
- `POST /api/analyze/url`: uniquement `http/https`, longueur max 2048.
- Noms de fichiers: normalisés (anti caractères de contrôle / anti path tricks).

## Documents (PDF/Office)

- PDF: rendu page→image via `pdfjs-dist` + `canvas`.
- Limitation:
  - `MAX_PDF_PAGES` (défaut 20)
  - `PDF_RENDER_SCALE` (défaut 2)

## Vidéo (frames)

- Endpoint: `POST /api/analyze/video`
- Auth: requis (coût élevé, anti-abus)
- Dépendance: `ffmpeg` doit être installé sur le serveur
- Limites par défaut:
  - `VIDEO_DAILY_LIMIT=15` (quota journalier par utilisateur, plafonné à 15)
  - `VIDEO_MAX_SECONDS=60` (plafonné à 60)
  - sampling coarse `VIDEO_COARSE_FPS=0.5`
  - rafale `VIDEO_BURST_FPS=2` sur `VIDEO_BURST_WINDOW_SECONDS=4`
  - plafond `VIDEO_MAX_FRAMES=80`

## Téléchargement de rapports

- `GET /api/report/download/:filename`:
  - auth requis
  - filename restreint à `rapport-[a-f0-9]{8}.pdf`
  - contrôle `path.resolve` pour empêcher traversal

## Quotas

### Invité

- Limite journalière: `GUEST_DAILY_LIMIT` (défaut 3).
- Persistance si Supabase admin configuré:
  - RPC: `get_guest_quota`, `consume_guest_quota` (dans `docs/supabase-schema.sql`).
- Fallback si Supabase indisponible: store mémoire (reset au restart).

### Utilisateur connecté

- `checkQuota(userId)` lit la vue `user_stats`.
- Si le check quota échoue côté Supabase: l’API renvoie `503` (pour éviter un “fail-open”).

## Recommandations prod (minimum)

- `NODE_ENV=production`
- `DEV_AUTH_BYPASS=false`
- `ALLOWED_ORIGINS=https://votre-domaine.tld`
- Renseigner `CERT_SIGNING_SECRET` (et stocker en secret manager)
- Activer logs/monitoring + rotation des clés Supabase si fuite
