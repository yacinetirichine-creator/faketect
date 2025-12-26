# 📜 Certificats Premium FakeTect

## 🎯 Vue d'ensemble

Le système de **certificats premium** permet de générer des documents PDF professionnels pour attester de l'authenticité (ou de la manipulation) d'une image analysée.

### ✨ Fonctionnalités

- ✅ **Verdict clair** : AUTHENTIQUE / SUSPECT / INCERTAIN / FAUX
- ✅ **Pourcentage détaillé** : Score de probabilité IA (0-100%)
- ✅ **Explication grand public** : Texte vulgarisé pour tous
- ✅ **Explication technique** : Analyse détaillée pour experts
- ✅ **Justification du score** : Pourquoi 87% et pas 50% ?
- ✅ **QR Code de vérification** : Lien vers page de vérification en ligne
- ✅ **Texte juridique** : Attestation légale avec timestamp
- ✅ **Design professionnel** : Logo, couleurs FakeTect, 3 pages

---

## 📋 Cas d'usage

### 1. **Journalisme**
Un journaliste reçoit une photo "exclusive" d'un événement. Il l'analyse avec FakeTect et génère un certificat montrant que l'image est manipulée à 92%. Il peut publier le certificat comme preuve.

### 2. **Justice / Tribunaux**
Un avocat présente une photo comme preuve dans un procès. La partie adverse conteste son authenticité. Le certificat FakeTect avec explications techniques peut être présenté au juge.

### 3. **Réseaux sociaux**
Un utilisateur partage une image virale. Un fact-checker génère un certificat FakeTect avec QR code et le publie pour dénoncer le fake.

### 4. **Assurances**
Une compagnie d'assurance reçoit des photos de sinistre. Elle vérifie leur authenticité et conserve les certificats comme preuve d'enquête.

---

## 🚀 Installation

### 1. Installer la dépendance QR Code

```bash
cd packages/api
npm install qrcode
```

### 2. Créer la table dans Supabase

Exécuter le script SQL dans Supabase Dashboard > SQL Editor :

```sql
-- Voir docs/supabase-certificates-schema.sql
```

### 3. Créer le dossier uploads/certificates

```bash
mkdir -p packages/api/uploads/certificates
```

---

## 📡 API Endpoints

### 1. **Générer un certificat**

```http
POST /api/certificate/generate
Content-Type: application/json
Authorization: Bearer <token> (optionnel)

{
  "analysisId": "uuid-de-l-analyse",
  "language": "fr",  // ou "en"
  "purpose": "journalism"  // ou "legal", "general"
}
```

**Réponse :**
```json
{
  "success": true,
  "certificate": {
    "id": "abc123-uuid",
    "filename": "certificate-abc123.pdf",
    "downloadUrl": "/api/certificate/download/abc123-uuid",
    "verifyUrl": "https://faketect.com/verify/abc123-uuid",
    "verdict": "FAUX",
    "score": 87
  }
}
```

### 2. **Télécharger un certificat**

```http
GET /api/certificate/download/:certificateId
```

Renvoie le fichier PDF en téléchargement.

### 3. **Vérifier un certificat**

```http
GET /api/certificate/verify/:certificateId
```

**Réponse :**
```json
{
  "valid": true,
  "certificate": {
    "id": "abc123",
    "verdict": "FAUX",
    "score": 87,
    "createdAt": "2025-12-20T15:30:00Z",
    "analysis": {
      "filename": "image.jpg",
      "score": 0.87,
      "confidence": "high",
      "isAI": true,
      "analyzedAt": "2025-12-20T15:25:00Z"
    }
  }
}
```

### 4. **Lister ses certificats**

```http
GET /api/certificate/list
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "success": true,
  "certificates": [
    {
      "id": "abc123",
      "verdict": "FAUX",
      "score": 87,
      "filename": "image.jpg",
      "createdAt": "2025-12-20T15:30:00Z",
      "downloadUrl": "/api/certificate/download/abc123",
      "verifyUrl": "https://faketect.com/verify/abc123"
    }
  ]
}
```

---

## 📄 Structure du certificat PDF

### **Page 1 : Verdict principal**

```
┌─────────────────────────────────────────┐
│ FakeTect - CERTIFICAT D'AUTHENTICITÉ    │
│ ID: abc123-xyz                          │
└─────────────────────────────────────────┘

╔═══════════════════════════════════════╗
║  ⛔  FAUX                             ║
║                                       ║
║  IMAGE FORTEMENT MANIPULÉE PAR IA     ║
║                                       ║
║  87%  Probabilité IA                  ║
╚═══════════════════════════════════════╝

📖 EXPLICATION SIMPLE

Cette image présente de forts indices de 
manipulation par IA (87%). Les métadonnées
de l'image contiennent des marqueurs de
génération IA. Notre analyse a détecté des
traces du modèle Stable Diffusion...
```

### **Page 2 : Analyse technique**

```
🔬 POURQUOI CE SCORE ?

Le score est calculé à partir de :
• SightEngine (analyse visuelle) : 85%
• Illuminarty (détection de modèle IA) : 89%
• Moyenne pondérée combinée : 87%

Ce score élevé indique la détection de
multiples indicateurs forts...

⚙️ DÉTAILS TECHNIQUES

Analyse Technique :

• Score Combiné : 87% (seuil : 70%)
• Niveau de Confiance : Élevé
• Score SightEngine : 85%
• Score Illuminarty : 89%
• Modèle Détecté : Stable Diffusion 1.5
• Marqueurs EXIF IA : Présents

Méthodologie :
Notre système utilise une approche
probabiliste multi-moteurs...

┌──────────────┐
│   QR CODE    │  ← Vérifier en ligne
│   [QR]       │     faketect.com/verify
└──────────────┘
```

### **Page 3 : Attestation juridique**

```
⚖️ DÉCLARATION LÉGALE

CERTIFICAT D'ANALYSE D'AUTHENTICITÉ

Numéro de certificat : abc123-xyz
Délivré le : 20 décembre 2025 à 15:30 CET
Délivré par : FakeTect SAS - Service de Détection IA

Le présent certificat atteste que l'image
"photo.jpg" a été analysée par notre système
de détection d'IA et a obtenu un score de
probabilité de manipulation de 87%.

VERDICT OFFICIEL : FAUX

Cette analyse est fournie à titre informatif
et constitue une expertise technique. Les
résultats sont de nature probabiliste et ne
doivent pas être considérés comme une preuve
absolue...

Ce certificat est signé numériquement et
vérifiable à l'adresse :
https://faketect.com/verify/abc123-xyz

╔════════════════════════════════════════╗
║ Signé numériquement par FakeTect SAS   ║
║ Hash: abc123-xyz-defgh                 ║
║ Timestamp: 2025-12-20T15:30:00.000Z    ║
║ Verify: faketect.com/verify/abc123     ║
╚════════════════════════════════════════╝

FakeTect SAS | contact@faketect.com
```

---

## 🎨 Personnalisation

### Changer la langue

```javascript
const certificate = await generatePremiumCertificate(analysis, {
  language: 'en'  // Anglais
});
```

### Personnaliser le but

```javascript
const certificate = await generatePremiumCertificate(analysis, {
  purpose: 'legal',  // Contexte juridique
  userProfile: {
    name: 'Me Dupont',
    organization: 'Cabinet d\'Avocats XYZ'
  }
});
```

---

## 🔒 Sécurité

### Signature numérique

Chaque certificat contient :
- **ID unique** (UUID v4)
- **Hash SHA-256** du contenu
- **Timestamp** ISO 8601
- **URL de vérification** unique

### Vérification publique

N'importe qui peut scanner le QR code ou visiter `faketect.com/verify/{id}` pour vérifier l'authenticité du certificat.

### Stockage

- PDF stockés dans `packages/api/uploads/certificates/`
- Métadonnées dans Supabase (`certificates` table)
- Nettoyage automatique des anciens fichiers (>30 jours)

---

## 📊 Exemples frontend

### React - Générer un certificat

```jsx
import { useState } from 'react';

function CertificateButton({ analysisId }) {
  const [loading, setLoading] = useState(false);
  
  const generateCertificate = async () => {
    setLoading(true);
    
    const response = await fetch('/api/certificate/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        analysisId,
        language: 'fr',
        purpose: 'general'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Télécharger le PDF
      window.open(data.certificate.downloadUrl, '_blank');
    }
    
    setLoading(false);
  };
  
  return (
    <button onClick={generateCertificate} disabled={loading}>
      {loading ? 'Génération...' : '📜 Générer un certificat'}
    </button>
  );
}
```

### Afficher le QR code de vérification

```jsx
function CertificateCard({ certificate }) {
  return (
    <div className="certificate-card">
      <h3>Certificat {certificate.verdict}</h3>
      <p>Score : {certificate.score}%</p>
      
      <img 
        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${certificate.verifyUrl}`}
        alt="QR Code de vérification"
      />
      
      <a href={certificate.verifyUrl} target="_blank">
        Vérifier en ligne →
      </a>
      
      <a href={certificate.downloadUrl} download>
        📥 Télécharger PDF
      </a>
    </div>
  );
}
```

---

## 🧪 Tests

### Test manuel

```bash
# 1. Analyser une image
curl -X POST http://localhost:3001/api/analyze/image \
  -F "image=@test.jpg"
  
# Récupérer l'analysisId de la réponse

# 2. Générer un certificat
curl -X POST http://localhost:3001/api/certificate/generate \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "abc-123",
    "language": "fr"
  }'

# 3. Télécharger le PDF
curl http://localhost:3001/api/certificate/download/xyz-456 \
  --output certificate.pdf

# 4. Vérifier
curl http://localhost:3001/api/certificate/verify/xyz-456
```

---

## 📈 Métriques

Suivre dans Supabase :

```sql
-- Nombre de certificats générés
SELECT COUNT(*) FROM certificates;

-- Certificats par verdict
SELECT verdict, COUNT(*) 
FROM certificates 
GROUP BY verdict;

-- Certificats les plus récents
SELECT * FROM certificates
ORDER BY created_at DESC
LIMIT 10;

-- Score moyen des certificats
SELECT AVG(score) FROM certificates;
```

---

## 🚀 Déploiement

### Variables d'environnement

Aucune variable supplémentaire requise ! Le système utilise les variables existantes de Supabase.

### Checklist

- [ ] Installer `npm install qrcode`
- [ ] Créer la table `certificates` dans Supabase
- [ ] Créer le dossier `uploads/certificates`
- [ ] Tester génération en local
- [ ] Déployer sur Render
- [ ] Créer page `/verify/:id` sur le frontend

---

## 💡 Améliorations futures

- [ ] Certificats multilingues (ES, DE, IT, AR)
- [ ] Watermark sur le PDF
- [ ] Signature électronique qualifiée (eIDAS)
- [ ] Export au format blockchain (NFT de preuve)
- [ ] API webhook pour envoi automatique par email
- [ ] Template personnalisable par organisation

---

## 📞 Support

Pour toute question :
- 📧 Email : contact@faketect.com
- 📚 Docs : https://faketect.com/docs
- 💬 Discord : https://discord.gg/faketect

---

**FakeTect** - Détection IA professionnelle
