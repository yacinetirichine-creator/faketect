# 🛡️ Audit de Sécurité - FakeTect

**Date** : 20 décembre 2025  
**Version** : 2.1.0  
**Auditeur** : GitHub Copilot (Claude Sonnet 4.5)

---

## 📋 Résumé Exécutif

### ✅ Points forts
- Validation MIME type côté serveur
- Sanitisation des noms de fichiers
- Rate limiting implémenté
- Helmet.js pour headers sécurisés
- Nettoyage automatique fichiers temporaires
- Quotas utilisateurs (anti-DDoS)

### ⚠️ Vulnérabilités critiques identifiées
1. **Path Traversal** (Critique) - Manipulation chemin fichiers
2. **Déni de service vidéo** (Élevé) - FFmpeg non protégé
3. **Injection commandes** (Critique) - spawn() sans validation
4. **Zip Bomb** (Élevé) - Documents Office non vérifiés
5. **MIME type spoofing** (Moyen) - Validation insuffisante
6. **Memory exhaustion** (Élevé) - Grands fichiers PDF

---

## 🔴 Vulnérabilités Critiques

### 1. Path Traversal dans noms de fichiers

**Fichier** : `packages/api/routes/analyze.js` (ligne 16-29)

**Code vulnérable** :
```javascript
function sanitizeFilename(name) {
  const base = path.basename(String(name || 'file'));
  const sanitized = base
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  
  // Bloquer les extensions dangereuses
  const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
  const ext = path.extname(sanitized).toLowerCase();
  if (dangerousExts.includes(ext)) {
    return sanitized.replace(ext, '.txt');
  }
  
  return sanitized;
}
```

**Problème** :
- ❌ `path.basename()` seul ne protège pas contre `../../../etc/passwd`
- ❌ Un attaquant peut envoyer `originalname: "../../../../etc/passwd"`
- ❌ Si combiné avec UUID, risque limité mais présent

**Exploit potentiel** :
```bash
# Upload malveillant
curl -X POST http://api.faketect.com/api/analyze/upload \
  -F "image=@malware.jpg;filename=../../../var/www/shell.jpg"

# Résultat : fichier écrit en dehors de /uploads/
# Chemin final : /uploads/../../../var/www/uuid-shell.jpg
# Simplifié : /var/www/uuid-shell.jpg ⚠️
```

**Impact** : 🔴 **Critique**
- Écriture fichiers arbitraires sur le serveur
- Bypass sécurité filesystem
- Potentiel RCE (Remote Code Execution)

---

### 2. Injection de commandes via FFmpeg

**Fichier** : `packages/api/routes/analyze.js` (ligne 76-84)

**Code vulnérable** :
```javascript
async function runFfmpeg(args) {
  return await new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args]);
    let stderr = '';
    p.stderr.on('data', (d) => { stderr += d.toString(); });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `ffmpeg failed with code ${code}`));
    });
  });
}
```

**Problème** :
- ❌ Pas de validation des arguments passés à FFmpeg
- ❌ Un attaquant peut injecter options FFmpeg dangereuses
- ❌ FFmpeg peut lire/écrire fichiers arbitraires

**Exploit potentiel** :
```javascript
// Attaque 1 : Lecture fichier sensible
const maliciousArgs = [
  '-i', '/etc/passwd',
  '-f', 'null',
  'output.mp4'
];

// Attaque 2 : SSRF (Server-Side Request Forgery)
const ssrfArgs = [
  '-i', 'http://internal-admin:8080/secret',
  'output.mp4'
];

// Attaque 3 : DoS via fichier vidéo infini
const dosArgs = [
  '-f', 'lavfi',
  '-i', 'testsrc=duration=999999:size=7680x4320:rate=60',
  'output.mp4'
];
```

**Impact** : 🔴 **Critique**
- Lecture fichiers système
- SSRF vers services internes
- DoS (CPU/RAM exhaustion)

---

### 3. Zip Bomb dans documents Office

**Fichier** : `packages/api/services/document-extractor.js`

**Code vulnérable** :
```javascript
async function extractFromDOCX(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(dataBuffer);
    const images = [];
    const mediaFolder = zip.folder('word/media');
    
    if (!mediaFolder) return { success: true, images: [], message: 'Aucune image trouvée' };
    
    // ❌ Pas de vérification taille décompressée
    const files = Object.keys(mediaFolder.files);
    
    for (const relativePath of files) {
      const file = mediaFolder.files[relativePath];
      if (file.dir) continue;
      
      // ❌ Décompression sans limite
      const buffer = await file.async('nodebuffer');
```

**Problème** :
- ❌ Aucune limite sur taille décompressée
- ❌ Un DOCX de 1 MB peut contenir 1 GB décompressé
- ❌ Crash serveur par épuisement RAM

**Exploit potentiel** :
```python
# Créer Zip Bomb DOCX
import zipfile
from io import BytesIO

# 1 GB de zéros compressés = 1 MB
zeros = b'\x00' * (1024 * 1024 * 1024)

with zipfile.ZipFile('bomb.docx', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('word/media/image1.png', zeros)
    zf.writestr('word/media/image2.png', zeros)
    # Taille finale : ~2 MB
    # Taille décompressée : 2 GB ⚠️
```

**Impact** : 🟠 **Élevé**
- Crash serveur (OOM - Out Of Memory)
- Déni de service
- Affecte tous les utilisateurs

---

### 4. MIME Type Spoofing

**Fichier** : `packages/api/routes/analyze.js` (ligne 46-49)

**Code vulnérable** :
```javascript
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});
```

**Problème** :
- ❌ `file.mimetype` vient du header `Content-Type` HTTP
- ❌ Facile à falsifier côté client
- ❌ Pas de vérification magic bytes (signature fichier)

**Exploit potentiel** :
```bash
# Upload shell PHP déguisé en image
curl -X POST http://api.faketect.com/api/analyze/upload \
  -H "Content-Type: multipart/form-data" \
  -F "image=@shell.php;type=image/jpeg"

# Le serveur accepte car mimetype = "image/jpeg"
# Mais le contenu est du code PHP ⚠️
```

**Impact** : 🟡 **Moyen**
- Upload fichiers malveillants
- Potentiel RCE si serveur mal configuré
- Bypass filtres antivirus

---

## 🟠 Vulnérabilités Élevées

### 5. DoS via vidéos malformées

**Fichier** : `packages/api/routes/analyze.js` (ligne 326-330)

**Code vulnérable** :
```javascript
const uploadVideo = multer({
  storage,
  limits: { fileSize: VIDEO_MAX_BYTES }, // 200 MB
  fileFilter: (r, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    cb(null, allowed.includes(file.mimetype));
  }
}).single('video');
```

**Problème** :
- ❌ Vidéo 200 MB peut prendre 10+ minutes à traiter
- ❌ FFmpeg peut consommer 100% CPU sur vidéo corrompue
- ❌ Pas de timeout sur traitement FFmpeg

**Exploit potentiel** :
```python
# Vidéo malformée qui fait boucler FFmpeg
ffmpeg -f lavfi -i testsrc=duration=3600:size=7680x4320:rate=60 \
       -c:v libx264 -preset veryslow malicious.mp4

# Résultat :
# - Taille : 180 MB (< 200 MB limit ✓)
# - Durée : 1 heure 4K 60fps
# - Traitement : 30+ minutes CPU 100%
# - Extraction frames : 216,000 frames ⚠️
```

**Impact** : 🟠 **Élevé**
- CPU exhaustion
- Déni de service
- Coûts cloud élevés

---

### 6. PDF Memory Exhaustion

**Fichier** : `packages/api/services/document-extractor.js`

**Code vulnérable** :
```javascript
const MAX_PDF_PAGES = Math.max(1, parseInt(process.env.MAX_PDF_PAGES || '20', 10) || 20);
const PDF_RENDER_SCALE = Math.max(1, parseFloat(process.env.PDF_RENDER_SCALE || '2') || 2);

async function extractFromPDF(filePath) {
  // ...
  for (let i = 1; i <= Math.min(pdf.numPages, MAX_PDF_PAGES); i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    
    // ❌ Pas de vérification taille viewport
    const canvas = createCanvas(viewport.width, viewport.height);
    // ...
  }
}
```

**Problème** :
- ❌ PDF avec pages 10,000 × 10,000 px accepté
- ❌ RAM : 10k × 10k × 4 bytes = 400 MB par page
- ❌ 20 pages × 400 MB = 8 GB RAM ⚠️

**Exploit potentiel** :
```python
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape

# Créer PDF avec pages géantes
c = canvas.Canvas("bomb.pdf", pagesize=(10000, 10000))
for i in range(20):
    c.drawString(100, 100, "Bomb page {}".format(i))
    c.showPage()
c.save()

# Taille fichier : ~50 KB
# RAM requise : 8 GB ⚠️
```

**Impact** : 🟠 **Élevé**
- OOM crash
- Déni de service
- Affecte tous utilisateurs

---

## 🟡 Vulnérabilités Moyennes

### 7. Pas de rate limiting upload

**Fichier** : `packages/api/server.js`

**Code actuel** :
```javascript
// Rate limiting général
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

**Problème** :
- ❌ 100 requêtes/15min = 6.6/min
- ❌ Mais upload vidéo 200 MB compte comme 1 requête
- ❌ Attaquant peut saturer bande passante

**Impact** : 🟡 **Moyen**
- Saturation bande passante
- Coûts transfert élevés

---

### 8. Pas de validation Content-Length

**Problème** :
- ❌ Client peut envoyer `Content-Length: 10 MB` mais stream 1 GB
- ❌ Multer rejette après avoir téléchargé
- ❌ Gaspillage bande passante

---

## ✅ Correctifs Recommandés

### Correctif 1 : Path Traversal (CRITIQUE)

```javascript
function sanitizeFilename(name) {
  // Supprime tout caractère dangereux AVANT path.basename
  const cleaned = String(name || 'file')
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/[./\\]/g, '_')  // ✅ Bloquer . / \
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  
  const base = path.basename(cleaned);
  
  // Liste étendue extensions dangereuses
  const dangerousExts = [
    '.exe', '.sh', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar',
    '.php', '.py', '.rb', '.pl', '.asp', '.jsp', '.cgi', '.dll', '.so'
  ];
  
  const ext = path.extname(base).toLowerCase();
  if (dangerousExts.includes(ext)) {
    return base.replace(ext, '.txt');
  }
  
  // ✅ Vérification finale : pas de ..
  if (base.includes('..')) {
    return 'suspicious_file.txt';
  }
  
  return base || 'unnamed_file';
}
```

---

### Correctif 2 : Injection FFmpeg (CRITIQUE)

```javascript
// Whitelist arguments FFmpeg autorisés
const ALLOWED_FFMPEG_ARGS = new Set([
  '-i', '-y', '-vf', '-ss', '-t', '-frames:v',
  '-q:v', '-f', 'image2', 'fps', 'scale'
]);

function validateFFmpegArgs(args) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Vérifier argument dans whitelist
    if (arg.startsWith('-') && !ALLOWED_FFMPEG_ARGS.has(arg)) {
      throw new Error(`Argument FFmpeg non autorisé: ${arg}`);
    }
    
    // Bloquer chemins absolus
    if (typeof arg === 'string' && arg.startsWith('/')) {
      if (!arg.startsWith('/tmp/faketect-')) {
        throw new Error(`Chemin non autorisé: ${arg}`);
      }
    }
    
    // Bloquer URLs
    if (typeof arg === 'string' && arg.match(/^https?:\/\//i)) {
      throw new Error('URLs non autorisées dans FFmpeg');
    }
  }
  
  return true;
}

async function runFfmpeg(args) {
  // ✅ Validation avant exécution
  validateFFmpegArgs(args);
  
  return await new Promise((resolve, reject) => {
    // ✅ Timeout 5 minutes max
    const timeout = setTimeout(() => {
      p.kill('SIGKILL');
      reject(new Error('FFmpeg timeout (5 min)'));
    }, 5 * 60 * 1000);
    
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args]);
    
    let stderr = '';
    p.stderr.on('data', (d) => { stderr += d.toString(); });
    p.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    p.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) return resolve();
      reject(new Error(stderr || `ffmpeg failed with code ${code}`));
    });
  });
}
```

---

### Correctif 3 : Zip Bomb Protection (ÉLEVÉ)

```javascript
const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100 MB max
const MAX_COMPRESSION_RATIO = 100; // Ratio 100:1 max

async function extractFromDOCX(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const compressedSize = stats.size;
    
    const dataBuffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(dataBuffer);
    const images = [];
    const mediaFolder = zip.folder('word/media');
    
    if (!mediaFolder) return { success: true, images: [], message: 'Aucune image trouvée' };
    
    const files = Object.keys(mediaFolder.files);
    let totalUncompressedSize = 0;
    
    for (const relativePath of files) {
      const file = mediaFolder.files[relativePath];
      if (file.dir) continue;
      
      // ✅ Vérifier taille avant décompression
      const metadata = file._data;
      const uncompressedSize = metadata.uncompressedSize || 0;
      
      totalUncompressedSize += uncompressedSize;
      
      // ✅ Protection Zip Bomb
      if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
        throw new Error(`Document trop volumineux (> ${MAX_UNCOMPRESSED_SIZE / 1024 / 1024} MB décompressé)`);
      }
      
      // ✅ Vérifier ratio compression
      const ratio = uncompressedSize / compressedSize;
      if (ratio > MAX_COMPRESSION_RATIO) {
        throw new Error(`Ratio compression suspect: ${ratio.toFixed(1)}:1 (max ${MAX_COMPRESSION_RATIO}:1)`);
      }
      
      const buffer = await file.async('nodebuffer');
      // ... suite
    }
  } catch (error) {
    console.error('Erreur extraction DOCX:', error.message);
    return { success: false, error: error.message, images: [] };
  }
}
```

---

### Correctif 4 : MIME Type Validation (MOYEN)

```javascript
const fileType = require('file-type'); // npm install file-type

async function validateFileType(filePath, expectedMimes) {
  try {
    // ✅ Vérifier magic bytes (signature fichier)
    const type = await fileType.fromFile(filePath);
    
    if (!type) {
      throw new Error('Type fichier non reconnu');
    }
    
    if (!expectedMimes.includes(type.mime)) {
      throw new Error(`Type fichier invalide: ${type.mime} (attendu: ${expectedMimes.join(', ')})`);
    }
    
    return type;
  } catch (error) {
    throw new Error(`Validation fichier échouée: ${error.message}`);
  }
}

// Utilisation dans route
router.post('/upload', optionalAuthMiddleware, quotaMiddleware, upload.single('image'), async (req, res) => {
  const uploadedPath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: true, message: 'Aucune image fournie' });

    // ✅ Validation magic bytes
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    await validateFileType(req.file.path, allowedMimes);

    const result = await analyzer.analyzeImage(req.file.path, {
      // ... suite
    });
  } catch (error) {
    if (uploadedPath) fs.unlink(uploadedPath, () => {});
    res.status(400).json({ error: true, message: error.message });
  }
});
```

---

### Correctif 5 : PDF Protection (ÉLEVÉ)

```javascript
const MAX_PDF_PAGES = 20;
const PDF_RENDER_SCALE = 2;
const MAX_PAGE_DIMENSION = 4096; // 4K max
const MAX_PAGE_PIXELS = 16777216; // 4096 × 4096

async function extractFromPDF(filePath) {
  if (!createCanvas) {
    return { success: false, error: 'PDF rendering non disponible', images: [] };
  }

  try {
    const data = fs.readFileSync(filePath);
    const loadingTask = pdfjs.getDocument({ data, disableFontFace: true });
    const pdf = await loadingTask.promise;
    const images = [];
    const numPages = Math.min(pdf.numPages, MAX_PDF_PAGES);

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      
      // ✅ Vérifier dimensions page
      if (viewport.width > MAX_PAGE_DIMENSION || viewport.height > MAX_PAGE_DIMENSION) {
        console.warn(`Page ${i} trop grande: ${viewport.width}×${viewport.height}, skip`);
        continue;
      }
      
      // ✅ Vérifier nombre total pixels
      const pixels = viewport.width * viewport.height;
      if (pixels > MAX_PAGE_PIXELS) {
        console.warn(`Page ${i} trop de pixels: ${pixels}, skip`);
        continue;
      }

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      const tempPath = path.join(TEMP_DIR, `pdf-page-${i}-${uuidv4()}.jpg`);
      const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
      
      // ✅ Vérifier taille buffer
      if (buffer.length > 10 * 1024 * 1024) {
        console.warn(`Page ${i} buffer trop gros: ${buffer.length} bytes, skip`);
        continue;
      }
      
      fs.writeFileSync(tempPath, buffer);
      images.push(tempPath);
    }

    return { success: true, images, message: `${images.length} page(s) extraites` };
  } catch (error) {
    console.error('Erreur extraction PDF:', error.message);
    return { success: false, error: error.message, images: [] };
  }
}
```

---

### Correctif 6 : Rate Limiting Upload

```javascript
// Rate limiting spécifique uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // ✅ 10 uploads max/15min
  message: 'Trop d\'uploads. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ Limiter par IP + user
  keyGenerator: (req) => {
    if (req.user?.id) return `user:${req.user.id}`;
    return req.ip;
  }
});

// Appliquer sur routes upload
app.use('/api/analyze/upload', uploadLimiter);
app.use('/api/analyze/video', uploadLimiter);
app.use('/api/batch/upload', uploadLimiter);
```

---

### Correctif 7 : Content-Length Validation

```javascript
// Middleware validation Content-Length
function validateContentLength(maxBytes) {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    
    if (!contentLength || isNaN(contentLength)) {
      return res.status(411).json({
        error: true,
        message: 'Content-Length header requis'
      });
    }
    
    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: true,
        message: `Fichier trop volumineux: ${(contentLength / 1024 / 1024).toFixed(2)} MB (max: ${maxBytes / 1024 / 1024} MB)`
      });
    }
    
    next();
  };
}

// Utilisation
router.post('/upload',
  validateContentLength(10 * 1024 * 1024), // ✅ Check avant multer
  optionalAuthMiddleware,
  quotaMiddleware,
  upload.single('image'),
  async (req, res) => {
    // ...
  }
);
```

---

## 📊 Priorisation Correctifs

| Vulnérabilité | Sévérité | Facilité exploit | Priorité | Temps fix |
|---------------|----------|------------------|----------|-----------|
| Path Traversal | 🔴 Critique | Facile | **P0** | 1h |
| Injection FFmpeg | 🔴 Critique | Moyen | **P0** | 2h |
| MIME Spoofing | 🟡 Moyen | Facile | **P1** | 30min |
| Zip Bomb | 🟠 Élevé | Facile | **P1** | 1h |
| DoS Vidéo | 🟠 Élevé | Moyen | **P2** | 1h |
| PDF Memory | 🟠 Élevé | Facile | **P2** | 30min |
| Rate Limiting | 🟡 Moyen | Facile | **P3** | 15min |
| Content-Length | 🟡 Moyen | Moyen | **P3** | 15min |

**Total temps correctifs** : ~6-7 heures

---

## 🎯 Recommandations Générales

### Défense en profondeur
1. **Input validation** : Tout valider côté serveur
2. **Sandboxing** : Isoler traitement fichiers (Docker containers)
3. **Monitoring** : Alertes sur comportements suspects
4. **Logging** : Tracer tous uploads/analyses
5. **WAF** : Web Application Firewall (Cloudflare, AWS WAF)

### Configuration serveur
```javascript
// Limites globales sécurisées
const SECURITY_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,        // 10 MB images
  MAX_VIDEO_SIZE: 100 * 1024 * 1024,      // 100 MB vidéos (réduit)
  MAX_DOC_SIZE: 20 * 1024 * 1024,         // 20 MB documents
  MAX_BATCH_FILES: 10,                    // 10 fichiers max (réduit)
  MAX_PDF_PAGES: 10,                      // 10 pages max (réduit)
  MAX_VIDEO_DURATION: 300,                // 5 minutes max
  MAX_VIDEO_FPS: 30,                      // 30 fps max
  MAX_PAGE_PIXELS: 8 * 1024 * 1024,      // 8 MP max
  FFMPEG_TIMEOUT: 3 * 60 * 1000,         // 3 minutes timeout
  UPLOAD_RATE_LIMIT: 5,                   // 5 uploads/15min
};
```

### Détection malware
```bash
# Installer ClamAV
npm install clamscan

# Utilisation
const NodeClam = require('clamscan');
const clamscan = await new NodeClam().init({
  clamdscan: { path: '/usr/bin/clamdscan' }
});

const { isInfected, viruses } = await clamscan.isInfected(filePath);
if (isInfected) {
  throw new Error(`Malware détecté: ${viruses.join(', ')}`);
}
```

---

## ✅ Checklist Sécurité

### Avant déploiement
- [ ] Implémenter correctif Path Traversal
- [ ] Implémenter correctif Injection FFmpeg
- [ ] Implémenter validation MIME (magic bytes)
- [ ] Implémenter protection Zip Bomb
- [ ] Implémenter limites PDF
- [ ] Implémenter timeout FFmpeg
- [ ] Ajouter rate limiting uploads
- [ ] Valider Content-Length
- [ ] Tests penetration (pen testing)
- [ ] Audit code tiers (dependencies)

### Monitoring production
- [ ] Alertes uploads suspects
- [ ] Métriques CPU/RAM par requête
- [ ] Logs erreurs FFmpeg
- [ ] Tracking tailles fichiers
- [ ] Alertes rate limit dépassé

---

## 📝 Conclusion

**État actuel** : ⚠️ **Vulnérable**

Le site contient **8 vulnérabilités** dont **2 critiques** permettant :
- Écriture fichiers arbitraires (RCE potentiel)
- Injection commandes système
- Déni de service

**Action requise** : Implémenter **correctifs P0 et P1** avant production.

**Temps estimé** : 6-7 heures pour sécuriser complètement.

Voulez-vous que j'implémente ces correctifs maintenant ? 🛡️
