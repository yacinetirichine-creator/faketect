# FakeTect API Documentation

## Overview

The FakeTect API allows you to integrate AI-powered deepfake detection into your applications. All API endpoints require authentication via JWT token.

**Base URL:** `https://api.faketect.com/api`

---

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "PRO",
    "role": "USER"
  }
}
```

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "aiProcessingConsent": true
}
```

### Using the Token

Include the JWT token in all subsequent requests:

```http
Authorization: Bearer <your_token>
```

---

## Analysis Endpoints

### Analyze File

Upload and analyze an image or video for AI-generated content.

```http
POST /analysis
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary_file>
```

**Supported Formats:**
- Images: JPG, PNG, WebP, GIF
- Videos: MP4, MOV, AVI, WebM
- Documents: PDF

**Max File Size:** 100MB

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "score": 0.15,
    "confidence": 0.92,
    "verdict": "likely_real",
    "isAi": false,
    "provider": "consensus",
    "sources": ["openai", "sightengine", "illuminarty"],
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpeg"
    },
    "createdAt": "2025-01-24T12:00:00.000Z"
  }
}
```

### Analyze URL

Analyze an image from a URL.

```http
POST /analysis/url
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/image.jpg"
}
```

### Get Analysis by ID

```http
GET /analysis/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "image.jpg",
  "fileType": "image/jpeg",
  "score": 0.15,
  "confidence": 0.92,
  "verdict": "likely_real",
  "isAi": false,
  "provider": "consensus",
  "createdAt": "2025-01-24T12:00:00.000Z"
}
```

### Get Analysis History

```http
GET /analysis/history?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `type` | string | all | Filter by type: `image`, `video`, `pdf` |
| `verdict` | string | all | Filter by verdict |

---

## User Endpoints

### Get Dashboard Data

```http
GET /user/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "PRO"
  },
  "plan": {
    "name": "Pro",
    "perMonth": 500
  },
  "limits": {
    "monthly": 500,
    "usedMonth": 45,
    "remainingMonth": 455
  },
  "stats": {
    "total": 150,
    "aiDetected": 23,
    "real": 127
  },
  "recentAnalyses": [...]
}
```

### Update Profile

```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "language": "fr"
}
```

### Export Data (RGPD)

```http
GET /user/data-export
Authorization: Bearer <token>
```

Returns all user data in JSON format for RGPD compliance.

---

## Certificate Endpoints

### Generate PDF Certificate

```http
GET /analysis/:id/certificate
Authorization: Bearer <token>
Accept: application/pdf
```

Returns a PDF certificate with:
- Analysis ID and timestamp
- File hash (SHA-256)
- Score, verdict, and confidence
- Provider information
- Verification QR code

---

## Webhook Events (Enterprise)

### Configure Webhook

```http
POST /webhooks/configure
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "secret": "your_webhook_secret",
  "events": ["analysis.completed", "analysis.failed"]
}
```

### Event Types

| Event | Description |
|-------|-------------|
| `analysis.completed` | Analysis finished successfully |
| `analysis.failed` | Analysis failed |
| `quota.warning` | 75% quota reached |
| `quota.exceeded` | Quota limit reached |

### Webhook Payload

```json
{
  "event": "analysis.completed",
  "timestamp": "2025-01-24T12:00:00.000Z",
  "data": {
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "score": 0.15,
    "verdict": "likely_real",
    "confidence": 0.92
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `QUOTA_EXCEEDED` | 429 | Plan quota exceeded |
| `RATE_LIMITED` | 429 | Too many requests |
| `INVALID_FILE` | 400 | Unsupported file format |
| `FILE_TOO_LARGE` | 400 | File exceeds size limit |
| `ANALYSIS_FAILED` | 500 | AI analysis error |

---

## Rate Limits

| Plan | Requests/min | Requests/day |
|------|--------------|--------------|
| FREE | 10 | 100 |
| STARTER | 30 | 500 |
| PRO | 60 | 2,000 |
| BUSINESS | 120 | 10,000 |
| ENTERPRISE | Custom | Custom |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1706097600
```

---

## Verdicts Reference

| Verdict | Score Range | Meaning |
|---------|-------------|---------|
| `likely_real` | 0.00 - 0.20 | Probably authentic content |
| `possibly_real` | 0.20 - 0.40 | Likely authentic, minor concerns |
| `uncertain` | 0.40 - 0.60 | Unable to determine |
| `possibly_ai` | 0.60 - 0.80 | Likely AI-generated |
| `ai_generated` | 0.80 - 1.00 | Almost certainly AI-generated |

---

## SDKs & Libraries

### JavaScript/Node.js

```javascript
const FakeTect = require('faketect-sdk');

const client = new FakeTect({ apiKey: 'your_token' });

const result = await client.analyze('./image.jpg');
console.log(result.verdict); // 'likely_real'
```

### Python

```python
from faketect import FakeTect

client = FakeTect(api_key='your_token')

result = client.analyze('image.jpg')
print(result.verdict)  # 'likely_real'
```

### cURL

```bash
curl -X POST https://api.faketect.com/api/analysis \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg"
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v2.0 | 2025-01 | Multi-source consensus, video support |
| v1.5 | 2024-11 | PDF certificates, batch processing |
| v1.0 | 2024-09 | Initial release |

---

## Support

- **Documentation:** https://docs.faketect.com
- **Email:** api-support@faketect.com
- **Status:** https://status.faketect.com
