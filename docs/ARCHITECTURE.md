# FakeTect - Architecture Technique

## Vue d'ensemble

FakeTect est une plateforme SaaS de détection de deepfakes et contenus générés par IA, construite sur une architecture moderne, scalable et sécurisée.

---

## Diagramme d'Architecture

```
                                    ┌─────────────────────────────────────────┐
                                    │              CLOUDFLARE                 │
                                    │         (CDN, DDoS Protection)          │
                                    └─────────────────┬───────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   RENDER.COM                                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                              LOAD BALANCER                                 │  │
│  │                         (Auto-scaling, SSL/TLS)                           │  │
│  └───────────────────────────────────┬───────────────────────────────────────┘  │
│                                      │                                          │
│         ┌────────────────────────────┼────────────────────────────┐            │
│         │                            │                            │            │
│         ▼                            ▼                            ▼            │
│  ┌─────────────┐            ┌─────────────┐            ┌─────────────┐        │
│  │  FRONTEND   │            │  BACKEND    │            │  BACKEND    │        │
│  │   (React)   │            │  Instance 1 │            │  Instance N │        │
│  │   Static    │            │  (Node.js)  │            │  (Node.js)  │        │
│  └─────────────┘            └──────┬──────┘            └──────┬──────┘        │
│                                    │                          │               │
│                                    └──────────┬───────────────┘               │
│                                               │                               │
└───────────────────────────────────────────────┼───────────────────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
           ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
           │   NEON.TECH   │          │    STRIPE     │          │ AI PROVIDERS  │
           │  PostgreSQL   │          │   Payments    │          │               │
           │   Database    │          │   Webhooks    │          │ • OpenAI      │
           └───────────────┘          └───────────────┘          │ • Sightengine │
                                                                 │ • Illuminarty │
                                                                 └───────────────┘
```

---

## Composants

### 1. Frontend (React + Vite)

**Responsabilités :**
- Interface utilisateur responsive
- Gestion de l'état avec Zustand
- Internationalisation (6 langues)
- Animations fluides (Framer Motion)

**Structure :**
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # MainLayout, DashboardLayout
│   │   ├── pages/           # Landing, Dashboard, Admin, Auth
│   │   └── shared/          # Logo, CookieConsent, etc.
│   ├── stores/              # Zustand stores
│   ├── services/            # API client (axios)
│   ├── i18n/                # Traductions
│   └── styles/              # TailwindCSS
├── public/
└── vite.config.js
```

**Technologies :**
| Package | Version | Usage |
|---------|---------|-------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.4 | Styling |
| Framer Motion | 11.x | Animations |
| React Router | 6.x | Routing |
| Zustand | 4.x | State management |
| i18next | 23.x | i18n |
| Axios | 1.x | HTTP client |

---

### 2. Backend (Node.js + Express)

**Responsabilités :**
- API RESTful
- Authentification JWT
- Intégration AI providers
- Gestion des paiements Stripe
- Rate limiting et sécurité

**Structure :**
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js          # Authentification
│   │   ├── analysis.js      # Analyse IA
│   │   ├── admin.js         # Administration
│   │   ├── stripe.js        # Paiements
│   │   ├── user.js          # Profil utilisateur
│   │   └── consent.js       # RGPD consent
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   ├── rateLimiter.js   # Multi-tier rate limiting
│   │   ├── adminAudit.js    # Audit logging
│   │   └── validators.js    # Input validation
│   ├── services/
│   │   ├── openai.js        # OpenAI Vision
│   │   ├── sightengine.js   # Sightengine API
│   │   └── illuminarty.js   # Illuminarty API
│   ├── config/
│   │   ├── plans.js         # Plan definitions
│   │   ├── stripe-products.js
│   │   └── logger.js        # Winston logger
│   └── index.js             # Entry point
├── prisma/
│   └── schema.prisma        # Database schema
└── package.json
```

**Technologies :**
| Package | Version | Usage |
|---------|---------|-------|
| Express | 4.x | Web framework |
| Prisma | 5.x | ORM |
| jsonwebtoken | 9.x | JWT |
| bcryptjs | 2.x | Password hashing |
| stripe | 14.x | Payments |
| multer | 1.x | File uploads |
| helmet | 7.x | Security headers |
| winston | 3.x | Logging |
| express-rate-limit | 7.x | Rate limiting |

---

### 3. Base de données (PostgreSQL)

**Hébergement :** Neon.tech (serverless PostgreSQL)

**Schéma principal :**

```prisma
model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique
  password            String
  name                String?
  phone               String?
  plan                String    @default("FREE")
  role                String    @default("USER")
  language            String    @default("fr")
  aiProcessingConsent Boolean   @default(false)
  usedToday           Int       @default(0)
  usedMonth           Int       @default(0)
  stripeCustomerId    String?
  stripeSubscriptionId String?
  createdAt           DateTime  @default(now())
  analyses            Analysis[]
  cookieConsent       CookieConsent?
  auditLogs           AdminAuditLog[]
}

model Analysis {
  id          String   @id @default(uuid())
  userId      Int
  filename    String
  fileType    String
  fileHash    String?
  score       Float
  confidence  Float?
  verdict     String
  isAi        Boolean
  metadata    Json?
  provider    String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}

model CookieConsent {
  id          String   @id @default(uuid())
  userId      Int?     @unique
  sessionId   String?
  necessary   Boolean  @default(true)
  preferences Boolean  @default(false)
  analytics   Boolean  @default(false)
  functional  Boolean  @default(false)
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User?    @relation(fields: [userId], references: [id])
}

model AdminAuditLog {
  id          String   @id @default(uuid())
  adminId     Int
  action      String
  targetType  String
  targetId    String?
  details     String?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  admin       User     @relation(fields: [adminId], references: [id])
}
```

**Index optimisés :**
- `Analysis(userId, createdAt)` - Historique utilisateur
- `AdminAuditLog(createdAt DESC)` - Logs récents
- `CookieConsent(sessionId)` - Lookup session

---

### 4. AI Providers Integration

**Architecture multi-source :**

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYSIS ENGINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   OpenAI    │  │ Sightengine │  │ Illuminarty │             │
│  │  GPT-4V     │  │    API      │  │    API      │             │
│  │  Weight:40% │  │  Weight:35% │  │  Weight:25% │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                          ▼                                      │
│               ┌──────────────────┐                             │
│               │ CONSENSUS ENGINE │                             │
│               │                  │                             │
│               │ • Weighted avg   │                             │
│               │ • Confidence calc│                             │
│               │ • Verdict logic  │                             │
│               └──────────────────┘                             │
│                          │                                      │
│                          ▼                                      │
│               ┌──────────────────┐                             │
│               │  FINAL RESULT    │                             │
│               │  score, verdict  │                             │
│               │  confidence      │                             │
│               └──────────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Consensus Algorithm :**
```javascript
function calculateConsensus(results) {
  const weights = { openai: 0.40, sightengine: 0.35, illuminarty: 0.25 };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const [provider, result] of Object.entries(results)) {
    if (result.success) {
      weightedScore += result.score * weights[provider];
      totalWeight += weights[provider];
    }
  }

  const finalScore = weightedScore / totalWeight;
  const confidence = calculateConfidence(results);
  const verdict = getVerdict(finalScore, confidence);

  return { score: finalScore, confidence, verdict };
}
```

---

### 5. Système de Paiement (Stripe)

**Flux de paiement :**

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Frontend │────▶│ Backend  │────▶│  Stripe  │
│          │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                   │
     │                                                   │
     │◀──────────────── Checkout URL ───────────────────│
     │                                                   │
     │────────────────▶ Redirect ──────────────────────▶│
     │                                                   │
     │                                                   │
     │◀──────────────── Payment Success ────────────────│
     │                                                   │
                              │
                              ▼
                    ┌──────────────────┐
                    │     WEBHOOK      │
                    │  checkout.done   │
                    │  subscription.*  │
                    │  invoice.*       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  UPDATE USER     │
                    │  plan, quotas    │
                    └──────────────────┘
```

**Événements webhook gérés :**
- `checkout.session.completed` - Activation abonnement
- `customer.subscription.updated` - Changement plan
- `customer.subscription.deleted` - Annulation
- `invoice.payment_failed` - Échec paiement

---

## Scalabilité

### Horizontal Scaling

```
                    ┌─────────────────┐
                    │  LOAD BALANCER  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ Node 1  │          │ Node 2  │          │ Node N  │
   └─────────┘          └─────────┘          └─────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   PostgreSQL    │
                    │  (Connection    │
                    │   Pooling)      │
                    └─────────────────┘
```

### Caching Strategy (Future)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Redis   │────▶│ Backend  │
│          │     │  Cache   │     │          │
└──────────┘     └──────────┘     └──────────┘
                      │
                      │ Cache:
                      │ • User sessions
                      │ • Rate limit counters
                      │ • Analysis results (hash-based)
                      │ • API responses
```

---

## Monitoring & Logging

### Logging Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     LOGGING PIPELINE                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │
│  │   Winston   │────▶│   stdout    │────▶│   Render    │    │
│  │   Logger    │     │   (JSON)    │     │    Logs     │    │
│  └─────────────┘     └─────────────┘     └─────────────┘    │
│         │                                                     │
│         │            ┌─────────────┐                         │
│         └───────────▶│   Files     │ (dev only)              │
│                      │  logs/*.log │                         │
│                      └─────────────┘                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Metrics Tracked

| Metric | Description |
|--------|-------------|
| `api.requests.total` | Total API requests |
| `api.requests.errors` | Error rate |
| `api.latency.p95` | 95th percentile latency |
| `analysis.duration` | AI analysis time |
| `stripe.webhooks.processed` | Payment events |
| `auth.logins.success` | Successful logins |
| `auth.logins.failed` | Failed login attempts |

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Network                                           │
│  ├── Cloudflare DDoS protection                            │
│  ├── SSL/TLS encryption (HTTPS only)                       │
│  └── IP-based rate limiting                                │
│                                                              │
│  Layer 2: Application                                       │
│  ├── Helmet security headers                               │
│  ├── CORS whitelist                                        │
│  ├── Multi-tier rate limiting                              │
│  └── Request validation                                    │
│                                                              │
│  Layer 3: Authentication                                    │
│  ├── JWT with secure secret                                │
│  ├── bcrypt password hashing                               │
│  ├── Session management                                    │
│  └── Role-based access control                             │
│                                                              │
│  Layer 4: Data                                              │
│  ├── Prisma ORM (SQL injection prevention)                 │
│  ├── Input sanitization                                    │
│  ├── File type validation                                  │
│  └── Encrypted connections to DB                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  GitHub  │────▶│   CI     │────▶│  Build   │────▶│  Deploy  │
│   Push   │     │  Tests   │     │  Bundle  │     │  Render  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      │ Checks:
                      │ • Lint
                      │ • Type check
                      │ • Unit tests
                      │ • Security scan
```

---

## Contact

Pour toute question technique : tech@faketect.com
