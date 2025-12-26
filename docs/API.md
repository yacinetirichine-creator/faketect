# API FakeTect (packages/api)

Base URL (dev): `http://localhost:3001`

## Auth

- **Invité (sans token)**: autorisé sur les endpoints d’analyse (quota journalier invité).
- **Connecté (token Supabase)**: ajouter `Authorization: Bearer <access_token>`.

> Les endpoints `/api/history/*` et `/api/report/*` (sauf `/verify`) nécessitent une authentification.

## Format des erreurs

- `400` requête invalide
- `401` non authentifié
- `429` quota/rate-limit
- `500` erreur serveur (message détaillé en `NODE_ENV=development`)

## Endpoints

### Health

- `GET /api/health`
  - Retourne l’état + flags de configuration.

### Quota

- `GET /api/quota`
  - Invité: quota invité.
  - Connecté: quota lié au profil / vue `user_stats`.
  - Connecté: ajoute aussi `video_quota` (quota vidéo / jour).

### Analyse (image)

- `POST /api/analyze/upload` (multipart)
  - Champ: `image` (fichier)
  - Auth: optionnelle

```bash
curl -s \
  -F "image=@./image.jpg" \
  http://localhost:3001/api/analyze/upload | jq
```

- `POST /api/analyze/url` (JSON)
  - Body: `{ "url": "https://…" }`
  - Protocoles acceptés: `http`/`https`

```bash
curl -s \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/image.jpg"}' \
  http://localhost:3001/api/analyze/url | jq
```

- `POST /api/analyze/base64` (JSON)
  - Body: `{ "image": "data:image/png;base64,..." | "...", "filename": "...", "source": "extension" }`

```bash
curl -s \
  -H 'Content-Type: application/json' \
  -d '{"image":"data:image/png;base64,AAA...","filename":"capture.png","source":"extension"}' \
  http://localhost:3001/api/analyze/base64 | jq
```

### Analyse (vidéo → frames)

- `POST /api/analyze/video` (multipart)
  - Champ: `video` (fichier)
  - Auth: **requis**
  - Quota: **15 vidéos / jour / utilisateur** (plafonné à 15 via `VIDEO_DAILY_LIMIT`)
  - Comportement: n’analyse que les **60 premières secondes** (plafonné à 60 via `VIDEO_MAX_SECONDS`), extraction de frames via **ffmpeg**.
  - Retour: agrégation (max/avg), % frames IA, et top frames “evidence”.

```bash
curl -s \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -F "video=@./sample.mp4" \
  http://localhost:3001/api/analyze/video | jq
```

### Batch (images / document)

- `POST /api/batch/images` (multipart)
  - Champ: `images` (jusqu’à 20 fichiers)

```bash
curl -s \
  -F "images=@./1.jpg" \
  -F "images=@./2.jpg" \
  http://localhost:3001/api/batch/images | jq
```

- `POST /api/batch/document` (multipart)
  - Champ: `document` (`.pdf`, `.docx`, `.pptx`, `.xlsx`)
  - Extraction:
    - PDF: **rendu des pages** en images (limité par `MAX_PDF_PAGES`).
    - Office: extraction des fichiers `*/media/*` via ZIP.

```bash
curl -s \
  -F "document=@./dossier.pdf" \
  http://localhost:3001/api/batch/document | jq
```

- `GET /api/batch/:id`
  - Auth: requis
  - Retourne batch + analyses.

### Historique (auth requis)

- `GET /api/history?limit=50&offset=0`
- `GET /api/history/batches`
- `GET /api/history/stats`

### Rapports PDF + Certification

- `POST /api/report/generate/:batchId` (auth requis)
  - Body optionnel: `{ "purpose": "media_presse" | "assurances" | "recrutement_rh" | "banques_fintech" | "juridique_investigations" | "..." }`
  - Alias acceptés: `use_case`, `context`
  - Retourne: `report.download_url` + `certificate.id` + `certificate.verify_url`.

- `POST /api/report/generate-analysis/:analysisId` (auth requis)
  - Même body optionnel `purpose` (alias: `use_case`, `context`).
  - Produit **1 analyse = 1 certificat**.

- `GET /api/report/download/:filename` (auth requis)
  - Restreint à `rapport-[a-f0-9]{8}.pdf`.

- `GET /api/report/verify/:certificateId` (public)
  - Retourne les métadonnées + `signature_valid`.

> Détails de signature/stockage: voir `docs/CERTIFICATION.md`.
