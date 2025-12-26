# Certification (rapport vérifiable)

Objectif: produire un **rapport PDF** accompagné d’un **certificat** (snapshot des résultats) pouvant être **vérifié** via un endpoint public.

## Vue d’ensemble

- Un certificat = `payload` JSON (canonique) + `payload_hash` (SHA-256) + `signature` (HMAC SHA-256 base64url) + `pdf_hash` (SHA-256 du fichier).
- Stockage en base: table `certificates`.
- Vérification publique: `GET /api/report/verify/:certificateId`.

## Endpoints

- Batch → rapport certifié:
  - `POST /api/report/generate/:batchId`
- Analyse unique → rapport certifié:
  - `POST /api/report/generate-analysis/:analysisId`
- Vérification (public):
  - `GET /api/report/verify/:certificateId`

## Clés & rotation

Variables (API):

- `CERT_SIGNING_SECRET` (recommandé en prod)
- `CERT_SIGNING_SECRET_OLD` (optionnel) : permet de vérifier des certificats signés avec une ancienne clé.

Comportement:

- Si `CERT_SIGNING_SECRET` est absent → les certificats sont générés mais **non signés** (`signed=false`, `signature=null`) et `signature_valid=false`.

## Algorithme

- `alg`: `HS256`
- Canonicalisation JSON: tri des clés récursif (voir `packages/api/services/certification.js`).
- Signature: `HMAC-SHA256(canonical_payload, secret)` encodé en base64url.

## Payload (structure)

Le `payload` contient notamment:

- `certificate_id`, `generated_at`, `certificate_version`
- `generator` (produit/composant/version)
- `purpose` (contexte métier, optionnel)
- `subject` (batch/document/source, ou override pour analyse unique)
- `results` (liste minimale des analyses + agrégats)
- `methodology` (description + providers + threshold)

## Purpose (contexte juridique/usage)

`purpose` est utilisé pour afficher une section “Contexte & recommandations” dans le PDF.

Valeurs supportées (recommandées):

- `media_presse`
- `assurances`
- `recrutement_rh`
- `banques_fintech`
- `juridique_investigations`

Le serveur normalise aussi des alias (ex: `media`, `presse`, `kyc`, `enquête`, etc.).

## Base de données (Supabase)

- Exécuter `docs/supabase-certification.sql`.
- Table: `certificates`
  - `payload` JSONB, `payload_hash`, `signature`, `pdf_filename`, `pdf_hash`, etc.
- RLS:
  - lecture/écriture/suppression: restreinte au propriétaire (`auth.uid() = user_id`).
  - L’API (service role) peut insérer même si RLS active.

## Vérification

`GET /api/report/verify/:certificateId` renvoie:

- métadonnées (`created_at`, `purpose`, `alg`, `payload_hash`, `pdf_hash`…)
- `signature_valid`: résultat de la vérification HMAC avec `CERT_SIGNING_SECRET` ou `CERT_SIGNING_SECRET_OLD`
- `summary`: synthèse des résultats (nombre d’items, IA détectées, score moyen)

## Notes “preuve” / limites

- Un certificat prouve l’intégrité (payload & PDF hashés) et l’origine serveur (signature HMAC), pas une vérité absolue.
- Les scores de détection restent probabilistes; pour un usage sensible, il faut compléter par:
  - conservation des sources (originaux / URLs / horodatage)
  - chaîne de custody interne (qui a importé, quand, depuis où)
  - vérification humaine et recoupements

## Procédure de preuve (reproductible)

1) Générer un rapport certifié (auth requis):

```bash
curl -s \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"purpose":"media_presse"}' \
  http://localhost:3001/api/report/generate-analysis/<analysisId>
```

2) Vérifier le certificat (public):

```bash
curl -s http://localhost:3001/api/report/verify/<certificateId>
```

3) Télécharger le PDF (auth requis) et comparer le hash local au `pdf_hash` renvoyé par `/verify`:

```bash
curl -L \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -o rapport.pdf \
  http://localhost:3001/api/report/download/<rapport-xxxxxxxx.pdf>

shasum -a 256 rapport.pdf
```

## Vérification offline (admin / audit)

L’endpoint public ne renvoie pas le `payload` complet. Si vous avez accès au `payload` (table `certificates`), vous pouvez recalculer `payload_hash` et vérifier la signature localement.

1) Récupérer `payload`, `payload_hash`, `signature` depuis Supabase (SQL Editor):

```sql
select payload, payload_hash, signature
from certificates
where id = '<certificateId>';
```

2) Recalculer en local (dans ce repo):

```bash
node - <<'NODE'
const { canonicalJSONStringify, sha256Hex, verifyCertificateSignature } = require('./packages/api/services/certification');

const payload = JSON.parse(process.env.CERT_PAYLOAD_JSON);
const signature = process.env.CERT_SIGNATURE;

const payloadString = canonicalJSONStringify(payload);
console.log('payload_hash:', sha256Hex(payloadString));
console.log('signature_valid:', verifyCertificateSignature(payload, signature));
NODE
```

## Générer un PDF de démo (sans Supabase)

Permet de valider rapidement le rendu PDF + les textes par `purpose`.

```bash
# Depuis la racine du repo
PURPOSE=banques_fintech npm -w packages/api run report:sample
```
