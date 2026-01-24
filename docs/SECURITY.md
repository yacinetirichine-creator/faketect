# FakeTect Security Documentation

## Overview

FakeTect is designed with security as a core principle. This document outlines our security measures, compliance certifications, and best practices.

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 1: NETWORK                                         │   │
│  │ • Cloudflare DDoS protection                            │   │
│  │ • SSL/TLS 1.3 encryption                                │   │
│  │ • HSTS enforced                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 2: APPLICATION                                     │   │
│  │ • Helmet security headers                               │   │
│  │ • CORS whitelist                                        │   │
│  │ • Multi-tier rate limiting                              │   │
│  │ • Request validation (Joi)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 3: AUTHENTICATION                                  │   │
│  │ • JWT with RS256 signing                                │   │
│  │ • bcrypt (12 rounds)                                    │   │
│  │ • Session management                                    │   │
│  │ • Role-based access control                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 4: DATA                                            │   │
│  │ • Prisma ORM (parameterized queries)                    │   │
│  │ • Encrypted connections (SSL)                           │   │
│  │ • Input sanitization                                    │   │
│  │ • File type validation                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### JWT Implementation

```javascript
// Token structure
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": 123,
    "email": "user@example.com",
    "role": "USER",
    "iat": 1706097600,
    "exp": 1706184000
  }
}
```

### Security Measures

| Measure | Implementation |
|---------|----------------|
| Token Expiry | 24 hours |
| Refresh Token | 7 days (HTTP-only cookie) |
| Secret Length | 256 bits minimum |
| Algorithm | HS256 |

### Password Security

| Measure | Value |
|---------|-------|
| Hashing Algorithm | bcrypt |
| Salt Rounds | 12 |
| Minimum Length | 8 characters |
| Complexity | Required (letter + number) |

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `USER` | Own analyses, profile |
| `ADMIN` | All users, all analyses, audit logs |

---

## Rate Limiting

### Multi-Tier Strategy

```javascript
// Tier 1: Global (DDoS protection)
globalLimiter: {
  windowMs: 60 * 1000,     // 1 minute
  max: 200,                 // 200 requests
  message: 'Too many requests'
}

// Tier 2: Authentication
authLimiter: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts
  message: 'Too many login attempts'
}

// Tier 3: API (per user)
apiLimiter: {
  windowMs: 60 * 1000,      // 1 minute
  max: 60,                   // Based on plan
  keyGenerator: (req) => req.user.id
}

// Tier 4: Payment
paymentLimiter: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts
  message: 'Payment rate limit exceeded'
}
```

### Slow-Down (Progressive Delay)

```javascript
apiSlowDown: {
  windowMs: 60 * 1000,
  delayAfter: 30,           // Start slowing after 30 requests
  delayMs: 100,             // Add 100ms per request
  maxDelayMs: 2000          // Max 2 second delay
}
```

---

## RGPD/GDPR Compliance

### Data Protection Measures

| Requirement | Implementation |
|-------------|----------------|
| **Lawful Basis** | Explicit consent at registration |
| **Purpose Limitation** | AI analysis only |
| **Data Minimization** | Only necessary data collected |
| **Accuracy** | User can update profile |
| **Storage Limitation** | Analysis data: 90 days (free), unlimited (paid) |
| **Integrity & Confidentiality** | Encryption at rest and in transit |

### Consent Management

```javascript
// Cookie consent (server-side)
model CookieConsent {
  id          String   @id
  userId      Int?     @unique
  sessionId   String?
  necessary   Boolean  @default(true)  // Always required
  preferences Boolean  @default(false)
  analytics   Boolean  @default(false)
  functional  Boolean  @default(false)
  ipAddress   String?  // For audit
  userAgent   String?  // For audit
  createdAt   DateTime
  updatedAt   DateTime
}

// AI processing consent (user model)
model User {
  aiProcessingConsent Boolean @default(false)  // Required for service
}
```

### User Rights Implementation

| Right | Endpoint | Description |
|-------|----------|-------------|
| **Access (Art. 15)** | `GET /user/data-export` | Export all user data |
| **Rectification (Art. 16)** | `PUT /auth/profile` | Update personal data |
| **Erasure (Art. 17)** | `DELETE /user/account` | Delete account and data |
| **Portability (Art. 20)** | `GET /user/data-export` | JSON export |
| **Objection (Art. 21)** | `DELETE /user/consent` | Withdraw consent |

### Cookie Categories

| Category | Purpose | Required |
|----------|---------|----------|
| **Necessary** | Authentication, security | Yes |
| **Preferences** | Language, theme | No |
| **Analytics** | Usage tracking (anonymized) | No |
| **Functional** | History, preferences | No |

---

## Admin Audit Logging

### Logged Events

```javascript
model AdminAuditLog {
  id          String   @id
  adminId     Int                    // Who performed action
  action      String                 // What action
  targetType  String                 // users, analyses, settings
  targetId    String?                // Target ID
  details     String?                // JSON details
  ipAddress   String?                // IP address
  userAgent   String?                // Browser/client
  createdAt   DateTime
}
```

### Actions Tracked

| Action | Description |
|--------|-------------|
| `VIEW_USERS` | Admin viewed user list |
| `VIEW_USER` | Admin viewed specific user |
| `UPDATE_USER` | Admin modified user data |
| `DELETE_USER` | Admin deleted user |
| `VIEW_ANALYSES` | Admin viewed analyses |
| `VIEW_AUDIT_LOGS` | Admin accessed audit logs |
| `EXPORT_DATA` | Admin exported data |

---

## Input Validation

### File Upload Validation

```javascript
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  document: ['application/pdf']
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Magic number verification (not just MIME type)
const fileTypeFromBuffer = require('file-type');
```

### Request Validation (Joi)

```javascript
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required(),
  aiProcessingConsent: Joi.boolean().valid(true).required()
});
```

---

## Security Headers (Helmet)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["https://js.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

---

## Stripe Payment Security

### Webhook Verification

```javascript
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Process event...
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

### PCI Compliance

| Measure | Implementation |
|---------|----------------|
| Card Data | Never touches our servers (Stripe.js) |
| Checkout | Stripe Checkout (hosted) |
| Customer Portal | Stripe Customer Portal (hosted) |
| Webhook Security | Signature verification |

---

## Vulnerability Management

### OWASP Top 10 Coverage

| Vulnerability | Mitigation |
|---------------|------------|
| **A01: Broken Access Control** | JWT + RBAC + middleware |
| **A02: Cryptographic Failures** | bcrypt, SSL/TLS, env secrets |
| **A03: Injection** | Prisma ORM, parameterized queries |
| **A04: Insecure Design** | Security-first architecture |
| **A05: Security Misconfiguration** | Helmet, env validation |
| **A06: Vulnerable Components** | npm audit, Dependabot |
| **A07: Auth Failures** | Rate limiting, strong passwords |
| **A08: Data Integrity Failures** | Input validation, CSRF tokens |
| **A09: Logging Failures** | Winston logging, audit logs |
| **A10: SSRF** | URL validation, whitelist |

### Security Testing

| Test Type | Frequency | Tool |
|-----------|-----------|------|
| Dependency Audit | Daily | npm audit, Snyk |
| Static Analysis | Per commit | ESLint security rules |
| Dynamic Testing | Weekly | OWASP ZAP |
| Penetration Testing | Quarterly | External vendor |

---

## Incident Response

### Response Plan

1. **Detection** - Logging, monitoring alerts
2. **Containment** - Isolate affected systems
3. **Investigation** - Root cause analysis
4. **Remediation** - Fix vulnerability
5. **Recovery** - Restore services
6. **Post-mortem** - Document and improve

### Security Contacts

| Role | Contact |
|------|---------|
| Security Team | security@faketect.com |
| DPO | dpo@faketect.com |
| Emergency | +33 X XX XX XX XX |

---

## Compliance Certifications

| Certification | Status | Date |
|---------------|--------|------|
| RGPD/GDPR | ✅ Compliant | 2025 |
| CNIL Guidelines | ✅ Compliant | 2025 |
| ISO 27001 | 🔄 Planned | 2025 |
| SOC 2 Type II | 🔄 Planned | 2026 |

---

## Reporting Security Issues

If you discover a security vulnerability, please report it to:

**Email:** security@faketect.com

**Response Time:** 24 hours

**Bug Bounty:** Contact us for responsible disclosure rewards.
