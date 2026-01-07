# 🔍 Analyse de Scalabilité et Robustesse - FakeTect

**Date d'analyse** : 7 janvier 2026  
**Objectif** : Évaluer la capacité du système à gérer plusieurs clients et analyses simultanées

---

## 📊 RÉSUMÉ EXÉCUTIF

### ✅ Points forts actuels
- Rate limiting multi-niveaux implémenté
- Cache Redis pour optimiser les analyses identiques
- Gestion d'erreurs robuste avec fallback gracieux
- Prisma ORM avec connection pooling natif
- Health checks pour monitoring
- Logging structuré (Winston)

### ⚠️ Points faibles critiques
- **Pas de clustering Node.js** → 1 seul CPU utilisé
- **Uploads synchrones** → Bloquage lors de gros fichiers
- **Analyses séquentielles** → Pas de queue pour gérer la charge
- **Connection pool non configuré** → Risque d'épuisement
- **Pas de scaling horizontal** → Limité à 1 instance
- **Uploads stockés en local** → Problème en multi-instance

---

## 🔴 PROBLÈMES CRITIQUES

### 1. **Mono-processus (1 seul CPU utilisé)**

**Problème** :
```javascript
// backend/src/index.js
app.listen(PORT, async () => {
  // 1 seul worker = 1 seul CPU
});
```

**Impact** :
- Sur un serveur 8 cores, seulement 12.5% de CPU utilisé
- Si une requête bloque (analyse longue), toutes les autres attendent
- Pas de haute disponibilité : si le process crash, tout s'arrête

**Solution recommandée** :
```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numWorkers = os.cpus().length; // Utiliser tous les CPUs
  
  console.log(`🚀 Master process ${process.pid} - Starting ${numWorkers} workers`);
  
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Starting a new one...`);
    cluster.fork(); // Auto-restart
  });
} else {
  // Code actuel de l'app
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on port ${PORT}`);
  });
}
```

---

### 2. **Analyses synchrones bloquantes**

**Problème actuel** :
```javascript
// backend/src/routes/analysis.js ligne 76
const fileStream = fs.createReadStream(req.file.path);
result = await detection.analyze(fileStream, req.file.mimetype, req.file.originalname);
// ⚠️ Si l'analyse prend 30 secondes, le worker est bloqué
```

**Impact** :
- Pendant qu'un utilisateur attend son analyse (15-30s pour vidéo), personne d'autre ne peut être servi par ce worker
- Avec 100 utilisateurs simultanés → file d'attente massive

**Solution recommandée** : **Queue système (Bull/BullMQ)**

```javascript
// backend/src/services/analysisQueue.js
const Queue = require('bull');

const analysisQueue = new Queue('video-analysis', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }
});

// Worker de traitement (peut être séparé)
analysisQueue.process(10, async (job) => { // 10 jobs parallèles max
  const { filePath, mimeType, userId } = job.data;
  
  const result = await detection.analyze(filePath, mimeType);
  
  // Sauvegarder en BDD
  await prisma.analysis.update({
    where: { id: job.data.analysisId },
    data: { result: JSON.stringify(result), status: 'COMPLETED' }
  });
  
  return result;
});

// Route API
router.post('/file', auth, checkLimit, upload.single('file'), async (req, res) => {
  // Créer l'analyse en BDD avec status PENDING
  const analysis = await prisma.analysis.create({
    data: { 
      userId: req.user.id, 
      status: 'PENDING',
      fileName: req.file.originalname 
    }
  });
  
  // Ajouter à la queue (non-bloquant)
  await analysisQueue.add({
    analysisId: analysis.id,
    filePath: req.file.path,
    mimeType: req.file.mimetype,
    userId: req.user.id
  }, {
    attempts: 3, // 3 tentatives
    backoff: { type: 'exponential', delay: 5000 }
  });
  
  // Réponse immédiate (WebSocket pour notifier quand fini)
  res.json({ 
    analysisId: analysis.id, 
    status: 'PENDING',
    message: 'Analyse en cours, vous serez notifié' 
  });
});
```

---

### 3. **Connection Pool Prisma non configuré**

**Problème actuel** :
```javascript
// backend/src/config/db.js
const prisma = new PrismaClient(); // Pas de config de pool !
```

**Impact** :
- Neon PostgreSQL limite à **~100 connexions simultanées**
- Sans pool configuré, risque d'épuisement lors de pics de trafic
- Erreur : "too many connections" → app crash

**Solution** :
```javascript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Configuration du pool
  connection_limit: 20, // Max 20 connexions par worker
  pool_timeout: 10, // Timeout après 10s
});

// Alternative avec pooling Neon
// DATABASE_URL="postgresql://user:pass@host/db?connection_limit=20&pool_timeout=10"
```

**Calcul recommandé** :
- Si 4 workers Node.js × 20 connexions = 80 connexions max
- Laisse 20 connexions pour admin/maintenance
- Total < 100 (limite Neon Free)

---

### 4. **Uploads en local (non scalable)**

**Problème** :
```javascript
// backend/src/routes/analysis.js ligne 17-23
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads'); // ⚠️ Stockage LOCAL
    cb(null, dir);
  }
});
```

**Impact** :
- Si vous déployez 3 instances sur Render → chaque instance a ses propres fichiers
- Utilisateur upload sur instance A, mais demande le fichier depuis instance B → 404 NOT FOUND
- Pas de persistence : Render redémarre = fichiers perdus

**Solution** : **S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2)**

```javascript
// backend/src/config/s3.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT, // Cloudflare R2
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

async function uploadToS3(file) {
  const key = `uploads/${Date.now()}-${file.originalname}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype,
  }));
  
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
}

// Route
router.post('/file', upload.single('file'), async (req, res) => {
  const fileUrl = await uploadToS3(req.file);
  // Supprimer le fichier local
  fs.unlinkSync(req.file.path);
  
  await prisma.analysis.create({
    data: { fileUrl } // URL S3 accessible partout
  });
});
```

**Alternatives économiques** :
- **Cloudflare R2** : 10GB gratuit/mois, 0$ egress
- **Backblaze B2** : 10GB gratuit/mois
- **Supabase Storage** : 1GB gratuit

---

### 5. **Rate limiting basé sur IP (contournable)**

**Problème actuel** :
```javascript
// backend/src/middleware/rateLimiter.js ligne 11-24
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Par IP
});
```

**Vulnérabilité** :
- Utilisateur malveillant peut changer d'IP (VPN, proxy, mobile data)
- Derrière un proxy/CDN, toutes les requêtes ont la même IP

**Solution** : **Rate limiting par userId + IP**

```javascript
const createSmartLimiter = (options) => {
  return rateLimit({
    ...options,
    keyGenerator: (req) => {
      // Si authentifié : limit par userId
      if (req.user?.id) {
        return `user:${req.user.id}`;
      }
      // Sinon : IP + User-Agent (plus difficile à contourner)
      return `ip:${req.ip}:${req.get('user-agent')}`;
    }
  });
};

const analysisLimiter = createSmartLimiter({
  windowMs: 60 * 1000,
  max: async (req) => {
    // Limite dynamique selon le plan
    if (req.user?.plan === 'PRO') return 100;
    if (req.user?.plan === 'PREMIUM') return 500;
    return 10; // FREE
  }
});
```

---

### 6. **Pas de timeout sur les analyses API**

**Problème** :
```javascript
// backend/src/services/detection.js ligne 10
return await this.analyzeVideoWithSightengine(input, mimeType, filename);
// ⚠️ Pas de timeout ! Peut bloquer indéfiniment
```

**Impact** :
- Si Sightengine ne répond jamais → le worker reste bloqué à vie
- Accumulation de workers morts → serveur inutilisable

**Solution** :
```javascript
async analyzeWithTimeout(input, mimeType, filename, timeoutMs = 60000) {
  return Promise.race([
    this.analyzeVideoWithSightengine(input, mimeType, filename),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs)
    )
  ]);
}
```

---

## 🟡 PROBLÈMES MOYENS

### 7. **Multer limite taille mais pas nombre de requêtes**

**Problème** :
```javascript
limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
```

- Utilisateur malveillant peut upload 100 fichiers de 100MB en 1 minute
- 10GB de uploads = serveur saturé

**Solution** :
```javascript
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // Max 5 uploads/minute
  skipSuccessfulRequests: false
});

router.post('/file', uploadLimiter, auth, upload.single('file'), ...);
```

---

### 8. **Logs non structurés pour monitoring**

**Amélioration** :
```javascript
// Ajouter des métriques Prometheus
const promClient = require('prom-client');

const analysisCounter = new promClient.Counter({
  name: 'faketect_analyses_total',
  help: 'Total analyses performed',
  labelNames: ['type', 'status', 'plan']
});

const analysisDuration = new promClient.Histogram({
  name: 'faketect_analysis_duration_seconds',
  help: 'Analysis duration',
  labelNames: ['type', 'provider']
});

// Dans la route
const timer = analysisDuration.startTimer({ type, provider });
// ... analyse ...
timer();
analysisCounter.inc({ type, status: 'success', plan: req.user.plan });
```

---

## 📈 ARCHITECTURE RECOMMANDÉE POUR SCALABILITÉ

```
┌─────────────────┐
│   Cloudflare    │ ← CDN + DDoS protection
│   (ou Vercel)   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Load Balancer │ ← Nginx / Render Load Balancer
│   (Round Robin) │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    │         │         │         │
┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐
│ API 1 │ │ API 2│ │ API 3 │ │ API 4 │ ← 4 instances Node.js
│4 CPUs │ │4 CPUs│ │4 CPUs │ │4 CPUs │   (cluster interne)
└───┬───┘ └──┬───┘ └───┬───┘ └───┬───┘
    │        │         │         │
    └────────┴─────────┴─────────┘
             │
    ┌────────▼────────┐
    │  Redis Cluster  │ ← Cache + Queue (Bull)
    │   (Upstash)     │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ PostgreSQL Pool │ ← Neon (connection pooling)
    │  (Neon/Supabase)│
    └─────────────────┘
             │
    ┌────────▼────────┐
    │  S3 Storage     │ ← Cloudflare R2 / AWS S3
    │ (uploads/media) │
    └─────────────────┘
```

---

## 🚀 PLAN D'ACTION PRIORITAIRE

### Phase 1 : Stabilité (1-2 jours) ⚡ CRITIQUE

1. **Ajouter clustering Node.js**
   - Fichier : `backend/src/cluster.js`
   - Utiliser tous les CPUs disponibles
   - Auto-restart sur crash

2. **Configurer Prisma connection pool**
   - Limiter à 20 connexions/worker
   - Éviter épuisement DB

3. **Ajouter timeouts sur analyses API**
   - Max 60s pour vidéos, 30s pour images
   - Éviter workers bloqués indéfiniment

### Phase 2 : Scalabilité (3-5 jours) 🔥 IMPORTANT

4. **Implémenter queue système (Bull)**
   - Analyses asynchrones
   - Gestion de la charge
   - Retry automatique

5. **Migrer uploads vers S3**
   - Cloudflare R2 ou AWS S3
   - Persistence garantie
   - Multi-instance compatible

6. **Rate limiting intelligent**
   - Par userId + IP
   - Limites dynamiques selon plan
   - Métriques détaillées

### Phase 3 : Monitoring (2-3 jours) 📊 RECOMMANDÉ

7. **Ajouter Prometheus + Grafana**
   - Métriques temps réel
   - Alertes automatiques
   - Dashboards de performance

8. **APM (Application Performance Monitoring)**
   - Sentry pour erreurs
   - New Relic / Datadog pour performance
   - Alertes sur métriques critiques

### Phase 4 : Optimisation (optionnel) ✨

9. **CDN pour assets statiques**
10. **Database read replicas** (Neon Pro)
11. **Edge caching** (Cloudflare Workers)

---

## 📊 CAPACITÉ ACTUELLE vs RECOMMANDÉE

### Configuration actuelle
- **Instances** : 1
- **CPUs utilisés** : 1/4 (25%)
- **Analyses simultanées** : 1-2
- **Utilisateurs simultanés** : ~10-20
- **Uploads** : Stockage local (volatil)
- **Rate limits** : Par IP (contournable)

### Après améliorations
- **Instances** : 4+ (horizontal scaling)
- **CPUs utilisés** : 100% (cluster mode)
- **Analyses simultanées** : 50-100 (queue)
- **Utilisateurs simultanés** : 500-1000
- **Uploads** : S3 (persistant + CDN)
- **Rate limits** : Par userId (strict)

---

## 💰 ESTIMATION COÛTS

### Gratuit / Low-cost
- **Redis** : Upstash (10K requêtes/jour gratuit)
- **S3** : Cloudflare R2 (10GB gratuit)
- **DB** : Neon Free (0.5GB, suffisant pour démarrer)
- **Hosting** : Render Free (limité mais fonctionne)

### Production recommandée (~50-100$/mois)
- **Redis** : Upstash Pro (~10$/mois)
- **S3** : Cloudflare R2 (~5$/mois pour 50GB)
- **DB** : Neon Scale (~25$/mois, connection pooling)
- **Hosting** : Render Pro (~25$/mois, 2GB RAM)
- **Monitoring** : Sentry Free + Prometheus self-hosted

---

## 🎯 RECOMMANDATION FINALE

**Votre code est fonctionnel pour 10-20 utilisateurs simultanés, mais PAS SCALABLE pour une vraie charge.**

### Actions immédiates (ce week-end) :
1. ✅ **Clustering Node.js** (2h de dev)
2. ✅ **Prisma connection pool** (30 min)
3. ✅ **Timeouts API** (1h)

### Actions court-terme (semaine prochaine) :
4. 🔄 **Bull Queue** (1 jour de dev)
5. 📦 **Migration S3** (1 jour de dev)

### Actions moyen-terme (ce mois) :
6. 📊 **Monitoring Prometheus** (2 jours)
7. 🔐 **Rate limiting avancé** (1 jour)

**Avec ces améliorations, vous pourrez gérer 500-1000 utilisateurs simultanés facilement.**

---

## 📝 CHECKLIST DÉPLOIEMENT PRODUCTION

- [ ] Clustering activé (4+ workers)
- [ ] Connection pool configuré (max 20/worker)
- [ ] Queue Bull/BullMQ opérationnelle
- [ ] Uploads sur S3/R2 (pas en local)
- [ ] Timeouts API (30-60s)
- [ ] Rate limiting par userId
- [ ] Monitoring Sentry activé
- [ ] Logs centralisés (Winston → Cloudwatch)
- [ ] Health checks configurés
- [ ] Auto-scaling activé (Render/AWS)
- [ ] Backups DB quotidiens
- [ ] CDN configuré (Cloudflare)

