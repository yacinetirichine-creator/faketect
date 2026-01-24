# FakeTect - AI-Powered Deepfake Detection Platform

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0-blue?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License"/>
  <img src="https://img.shields.io/badge/RGPD-100%25%20Compliant-green?style=for-the-badge" alt="RGPD"/>
  <img src="https://img.shields.io/badge/Uptime-99.9%25-brightgreen?style=for-the-badge" alt="Uptime"/>
</p>

<p align="center">
  <strong>Detect AI-generated images, videos, and deepfakes in seconds with enterprise-grade accuracy.</strong>
</p>

---

## Executive Summary

**FakeTect** is a B2B/B2C SaaS platform that leverages multiple AI providers to detect synthetic media content with **99.9% accuracy**. Built for enterprises, media companies, and individuals who need to verify content authenticity.

### Key Metrics

| Metric | Value |
|--------|-------|
| Detection Accuracy | 99.9% |
| Average Processing Time | < 2 seconds |
| RGPD Compliance | 100% |
| Supported Languages | 6 (FR, EN, DE, ES, IT, PT) |
| API Uptime SLA | 99.9% |

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Business Model](#business-model)
- [Documentation](#documentation)
- [Support](#support)

---

## Features

### Core Detection Capabilities

| Feature | Description |
|---------|-------------|
| **Image Analysis** | Pixel-level AI artifact detection using multiple models |
| **Video Analysis** | Frame-by-frame deepfake detection with temporal consistency |
| **Batch Processing** | Analyze up to 50 files simultaneously |
| **PDF Analysis** | Extract and analyze images from documents |
| **URL Analysis** | Analyze images directly from web URLs |

### AI Providers (Multi-Source Consensus)

| Provider | Specialty | Weight |
|----------|-----------|--------|
| **OpenAI GPT-4 Vision** | General AI detection | 40% |
| **Sightengine** | Image manipulation detection | 35% |
| **Illuminarty** | Deepfake specialization | 25% |

### Enterprise Features

- **RESTful API** with rate limiting and authentication
- **PDF Certificates** with SHA-256 hash verification
- **Webhook Integration** for automated workflows
- **White-label Solution** (Enterprise plan)
- **Custom SLA** with 24/7 support

### Security & Compliance

- RGPD/GDPR 100% compliant
- Cookie consent management (server-side)
- Data encryption at rest and in transit
- Admin audit logging
- Automatic data retention policies

---

## Technology Stack

### Frontend
```
React 18 + Vite
├── TailwindCSS 3.4 (styling)
├── Framer Motion (animations)
├── React Router 6 (navigation)
├── Zustand (state management)
├── i18next (internationalization)
└── React Hot Toast (notifications)
```

### Backend
```
Node.js 20 + Express 4
├── Prisma ORM (PostgreSQL)
├── Stripe (payments)
├── JWT Authentication
├── Helmet (security headers)
├── Rate Limiting (multi-tier)
└── Winston (logging)
```

### Infrastructure
```
Render.com (Hosting)
├── PostgreSQL (Neon.tech)
├── Redis (caching - optional)
├── Cloudflare (CDN/DNS)
└── Stripe (payment processing)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FAKETECT PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Frontend   │────▶│   Backend    │────▶│   Database   │    │
│  │   (React)    │     │  (Node.js)   │     │ (PostgreSQL) │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                                   │
│         │                    ▼                                   │
│         │           ┌──────────────────┐                        │
│         │           │   AI Providers   │                        │
│         │           ├──────────────────┤                        │
│         │           │ • OpenAI Vision  │                        │
│         │           │ • Sightengine    │                        │
│         │           │ • Illuminarty    │                        │
│         │           └──────────────────┘                        │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │    Stripe    │     │   Webhooks   │                         │
│  │  (Payments)  │     │   (Events)   │                         │
│  └──────────────┘     └──────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture.

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Stripe Account
- AI Provider API Keys (OpenAI, Sightengine, Illuminarty)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/faketect.git
cd faketect

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit .env with your credentials

# Run database migrations
cd backend && npx prisma migrate deploy

# Start development servers
npm run dev  # Frontend (port 5173)
npm run dev  # Backend (port 3000)
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/faketect"

# Authentication
JWT_SECRET="your-256-bit-secret"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI Providers
OPENAI_API_KEY="sk-..."
SIGHTENGINE_API_USER="..."
SIGHTENGINE_API_SECRET="..."
ILLUMINARTY_API_KEY="..."

# Frontend URL
FRONTEND_URL="https://faketect.com"
```

---

## API Documentation

### Authentication

```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com", "plan": "PRO" }
}
```

### Analysis

```bash
# Analyze Image
POST /api/analysis
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>

# Response
{
  "success": true,
  "analysis": {
    "id": "uuid",
    "score": 0.15,
    "verdict": "likely_real",
    "confidence": 0.92,
    "provider": "consensus",
    "sources": ["openai", "sightengine", "illuminarty"]
  }
}
```

See [docs/API.md](docs/API.md) for complete API documentation.

---

## Security

### Security Features

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT with refresh tokens |
| Password Hashing | bcrypt (12 rounds) |
| Rate Limiting | Multi-tier (global, auth, API) |
| HTTPS | Enforced in production |
| CORS | Whitelist-based |
| XSS Protection | Helmet middleware |
| SQL Injection | Prisma ORM (parameterized) |
| File Upload | Type validation, size limits |

### RGPD Compliance

- Explicit consent for AI processing
- Server-side cookie consent storage
- Data export functionality (Art. 20)
- Right to deletion (Art. 17)
- Admin audit logging (accountability)
- 13-month consent validity (CNIL)

See [docs/SECURITY.md](docs/SECURITY.md) for security documentation.

---

## Business Model

### Pricing Plans

| Plan | Price | Analyses | Features |
|------|-------|----------|----------|
| **FREE** | 0€ | 10 total | Images only, 7-day history |
| **STARTER** | 12€/mo | 100/month | + Documents, URLs |
| **PRO** | 34€/mo | 500/month | + API access, batch (20) |
| **BUSINESS** | 89€/mo | 2,000/month | + Certificates, unlimited history |
| **ENTERPRISE** | 249€/mo | Unlimited | + White-label, SLA 99.9%, 24/7 support |

### Revenue Model

- Recurring SaaS subscriptions
- Annual discounts (30% off)
- Enterprise custom pricing
- API usage-based billing (future)

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [API.md](docs/API.md) | API reference |
| [SECURITY.md](docs/SECURITY.md) | Security practices |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide |
| [INVESTOR_PITCH.md](docs/INVESTOR_PITCH.md) | Investor presentation |
| [ROADMAP.md](docs/ROADMAP.md) | Product roadmap |

---

## Support

| Channel | Contact |
|---------|---------|
| Email | contact@faketect.com |
| DPO | dpo@faketect.com |
| Security | security@faketect.com |
| Enterprise Sales | enterprise@faketect.com |

---

## Legal

**JARVIS SAS**
Capital: 1,000 EUR
SIREN: 928 499 166
RCS Créteil
64 Avenue Marinville, 94100 Saint-Maur-des-Fossés, France

---

<p align="center">
  <strong>© 2025 JARVIS SAS - All Rights Reserved</strong>
</p>
