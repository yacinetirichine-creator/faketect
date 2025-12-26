# 🔍 FakeTect v2.0

**FakeTect - Détecteur d'images IA multi-plateforme avec analyse de documents**

---

## 🆕 Nouveautés v2.0

- 📄 **Analyse de documents** : PDF, Word, PowerPoint, Excel
- 🔗 **Analyse par URL** : Coller un lien d'image
- 📦 **Analyse par lot** : Jusqu'à 20 images simultanément
- 📊 **Rapport PDF** : Export professionnel téléchargeable
- 🧾 **Certification** : Certificat signé + vérification publique
- 🔍 **Métadonnées EXIF** : Détecter appareil, logiciel, date...

---

## 🏗️ Architecture

```
faketect/
├── packages/
│   ├── api/            # Backend Express + Supabase
│   ├── web/            # Frontend React
│   ├── shared/         # Code partagé (future app mobile)
│   └── extension/      # Extension Chrome/Firefox
└── docs/               # Documentation
```

## 📁 Fichiers Supportés

### Images directes
| Format | Extensions |
|--------|------------|
| JPEG | .jpg, .jpeg |
| PNG | .png |
| GIF | .gif |
| WebP | .webp |

### Documents (extraction d'images)
| Format | Extension | Librairie |
|--------|-----------|-----------|
| PDF | .pdf | pdfjs-dist + canvas |
| Word | .docx | jszip (extraction `/word/media/*`) |
| PowerPoint | .pptx | jszip (extraction `/ppt/media/*`) |
| Excel | .xlsx | jszip (extraction `/xl/media/*`) |

---

## 🎯 Plateformes

| Plateforme | Status |
|------------|--------|
| 🌐 Web App | ✅ Prêt |
| 🧩 Extension Chrome/Firefox | ✅ Prêt |
| 📱 Mobile (React Native) | 🔜 Préparé |

---

## 🚀 Installation

## 📚 Documentation

- `docs/API.md` (endpoints & auth)
- `docs/SUPABASE-SETUP.md` (setup Supabase + schémas)
- `docs/CERTIFICATION.md` (hash/signature/vérification)
- `docs/SECURITY-QUOTA.md` (CORS, rate-limit, quotas)

### 1. Prérequis
- Node.js 18+
- Compte Supabase (gratuit)
- Clés API Sightengine & Illuminarty

### 2. Configuration

```bash
# Cloner et installer
cd faketect
npm install

# Configurer les variables d'environnement
cp packages/api/.env.example packages/api/.env
cp packages/web/.env.example packages/web/.env
# Remplir avec vos clés
```

Notes:
- Ne committez jamais `packages/api/.env` (clés/secret). Si une clé a été partagée par erreur, faites-la tourner (rotate) côté provider.
- La clé pour “l'autre site d'analyse” correspond à `ILLUMINARTY_API_KEY` dans `packages/api/.env`.

Variables API utiles (API):
- `SIGHTENGINE_USER`, `SIGHTENGINE_SECRET`
- `ILLUMINARTY_API_KEY`
- Optionnel: `AI_DECISION_THRESHOLD` (défaut `0.7`)
- Optionnel: `GUEST_DAILY_LIMIT` (défaut `3`)
- Recommandé en prod: `CERT_SIGNING_SECRET` (signature des certificats)

### 3. Base de données
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter `docs/supabase-schema.sql` dans l'éditeur SQL

### 4. Lancer

```bash
# Terminal 1 - API
cd packages/api && npm run dev

# Terminal 2 - Web
cd packages/web && npm run dev

# Ouvrir http://localhost:5173
```

---

## 💰 Coûts Mensuels

| Service | Coût |
|---------|------|
| Supabase | 0€ (gratuit) |
| Sightengine | ~27€ |
| Illuminarty | ~9€ |
| Hébergement | ~6€ |
| **Total** | **~42€/mois** |

---

## 📊 Système de Score

| Niveau | Score | Signification |
|--------|-------|---------------|
| 🟢 Haute | >85% | Très probablement IA |
| 🟡 Moyenne | 60-85% | Possiblement IA |
| 🔴 Faible | <60% | Résultat incertain |

---

## 📝 License

MIT - Créé par YACINE
