# FakeTect Deployment Guide

## Overview

FakeTect is deployed on Render.com with a PostgreSQL database on Neon.tech. This guide covers deployment, configuration, and maintenance.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────┐              ┌───────────────┐             │
│   │   CLOUDFLARE  │              │   NEON.TECH   │             │
│   │  DNS + CDN    │              │  PostgreSQL   │             │
│   └───────┬───────┘              └───────┬───────┘             │
│           │                              │                      │
│           ▼                              │                      │
│   ┌───────────────────────────────┐     │                      │
│   │        RENDER.COM             │     │                      │
│   │  ┌─────────┐  ┌─────────┐    │     │                      │
│   │  │Frontend │  │ Backend │◄───┼─────┘                      │
│   │  │ Static  │  │ Node.js │    │                            │
│   │  └─────────┘  └─────────┘    │                            │
│   └───────────────────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- GitHub account
- Render.com account
- Neon.tech account
- Stripe account
- Cloudflare account (optional, for DNS)
- AI provider accounts (OpenAI, Sightengine, Illuminarty)

---

## Database Setup (Neon.tech)

### 1. Create Database

1. Go to https://neon.tech
2. Create new project: "faketect-production"
3. Copy connection string

### 2. Connection String Format

```
postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 3. Run Migrations

```bash
cd backend
DATABASE_URL="your_connection_string" npx prisma migrate deploy
```

---

## Backend Deployment (Render.com)

### 1. Create Web Service

1. Go to https://render.com
2. New > Web Service
3. Connect GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| Name | faketect-api |
| Region | Frankfurt (EU) |
| Branch | main |
| Root Directory | backend |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npx prisma migrate deploy` |
| Start Command | `node src/index.js` |

### 2. Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=your-256-bit-secret-min-32-chars
FRONTEND_URL=https://faketect.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Providers
OPENAI_API_KEY=sk-...
SIGHTENGINE_API_USER=...
SIGHTENGINE_API_SECRET=...
ILLUMINARTY_API_KEY=...

# Optional
NODE_ENV=production
PORT=3000
```

### 3. Health Check

Configure health check path: `/health`

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

---

## Frontend Deployment (Render.com)

### 1. Create Static Site

1. New > Static Site
2. Connect GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| Name | faketect-web |
| Branch | main |
| Root Directory | frontend |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

### 2. Environment Variables

```env
VITE_API_URL=https://faketect-api.onrender.com
```

### 3. Redirects (SPA)

Create `frontend/public/_redirects`:

```
/*    /index.html   200
```

---

## render.yaml (Infrastructure as Code)

```yaml
services:
  # Backend API
  - type: web
    name: faketect-api
    runtime: node
    region: frankfurt
    plan: starter
    rootDir: backend
    buildCommand: npm install && npx prisma generate && npx prisma migrate deploy
    startCommand: node src/index.js
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: SIGHTENGINE_API_USER
        sync: false
      - key: SIGHTENGINE_API_SECRET
        sync: false
      - key: ILLUMINARTY_API_KEY
        sync: false
      - key: NODE_ENV
        value: production

  # Frontend Static Site
  - type: web
    name: faketect-web
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        value: https://faketect-api.onrender.com
```

---

## Domain Configuration

### 1. Cloudflare DNS

Add DNS records:

| Type | Name | Value |
|------|------|-------|
| CNAME | @ | faketect-web.onrender.com |
| CNAME | api | faketect-api.onrender.com |

### 2. SSL Certificates

Render automatically provisions SSL certificates via Let's Encrypt.

### 3. Custom Domain on Render

1. Go to your Render service
2. Settings > Custom Domains
3. Add domain: faketect.com
4. Verify DNS configuration

---

## Stripe Webhook Configuration

### 1. Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://api.faketect.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 2. Get Webhook Secret

Copy the webhook signing secret and add to environment variables:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Monitoring

### 1. Render Dashboard

- View logs in real-time
- Monitor CPU/Memory usage
- Set up alerts

### 2. Application Logging

Logs are written to stdout in JSON format:

```json
{
  "level": "info",
  "message": "Analysis completed",
  "timestamp": "2025-01-24T12:00:00.000Z",
  "analysisId": "uuid",
  "duration": 1234
}
```

### 3. External Monitoring (Recommended)

- **Uptime:** UptimeRobot, Pingdom
- **APM:** Datadog, New Relic
- **Error Tracking:** Sentry
- **Analytics:** Plausible, Posthog

---

## Scaling

### Horizontal Scaling

Render automatically scales based on traffic. Upgrade plan for more instances:

| Plan | Instances | RAM | CPU |
|------|-----------|-----|-----|
| Starter | 1 | 512MB | 0.5 |
| Standard | 1-3 | 2GB | 1 |
| Pro | 1-10 | 4GB | 2 |

### Database Scaling (Neon)

| Plan | Storage | Compute |
|------|---------|---------|
| Free | 3GB | 0.25 CU |
| Launch | 10GB | 1 CU |
| Scale | 50GB | 4 CU |
| Enterprise | Unlimited | Custom |

---

## Backup & Recovery

### Database Backups

Neon provides automatic backups:
- Point-in-time recovery (7 days)
- Branch snapshots

### Manual Backup

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
psql $DATABASE_URL < backup_20250124.sql
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Stripe webhook configured
- [ ] DNS records set up

### Deployment

- [ ] Push to main branch
- [ ] Monitor build logs
- [ ] Verify health check
- [ ] Test critical flows

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify Stripe webhooks
- [ ] Test user registration/login
- [ ] Test analysis functionality

---

## Rollback

### Quick Rollback

1. Go to Render Dashboard
2. Select service
3. Deploys > Select previous deploy
4. Click "Rollback"

### Database Rollback

```bash
cd backend
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Security Checklist

- [ ] HTTPS enforced
- [ ] Environment variables not exposed
- [ ] Database connection encrypted (SSL)
- [ ] JWT secret is strong (32+ chars)
- [ ] Stripe webhook secret configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info

---

## Support

- **Render Status:** https://status.render.com
- **Neon Status:** https://status.neon.tech
- **Stripe Status:** https://status.stripe.com

**Team Contact:** ops@faketect.com
