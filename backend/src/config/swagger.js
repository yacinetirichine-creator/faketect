import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FakeTect API',
      version: '1.0.0',
      description: `
# FakeTect API Documentation

API for AI-generated content detection including images, videos, and deepfakes.

## Authentication

Most endpoints require a JWT token. Include it in the Authorization header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

## Rate Limiting

- **Global**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Analysis**: 10 requests per 15 minutes (depends on plan)

## Error Codes

All errors return a standardized format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid email or password"
  }
}
\`\`\`

See the Error Codes section for all possible codes.
      `,
      contact: {
        name: 'FakeTect Support',
        email: 'support@faketect.com',
        url: 'https://faketect.com',
      },
      license: {
        name: 'Proprietary',
        url: 'https://faketect.com/legal/terms',
      },
    },
    servers: [
      {
        url: 'https://api.faketect.app',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and registration' },
      { name: 'Analysis', description: 'Image and video analysis endpoints' },
      { name: 'User', description: 'User profile and settings' },
      { name: 'Subscription', description: 'Stripe payments and subscriptions' },
      { name: 'Admin', description: 'Admin-only endpoints (requires ADMIN role)' },
      { name: 'Health', description: 'API health and status' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'AUTH_001' },
                message: { type: 'string', example: 'Invalid email or password' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            plan: { type: 'string', enum: ['FREE', 'PRO', 'BUSINESS'] },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            language: { type: 'string', enum: ['fr', 'en', 'es', 'de', 'it', 'pt'] },
            usedToday: { type: 'integer' },
            usedMonth: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Analysis: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
            fileName: { type: 'string' },
            aiScore: { type: 'number', minimum: 0, maximum: 100 },
            isAi: { type: 'boolean' },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            details: { type: 'string', description: 'JSON string with provider details' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AnalysisResult: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            analysis: { $ref: '#/components/schemas/Analysis' },
            explainability: {
              type: 'object',
              properties: {
                provider: { type: 'string' },
                consensus: { type: 'string' },
                sources: { type: 'array', items: { type: 'string' } },
                topSignals: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'aiProcessingConsent'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
            phone: { type: 'string' },
            aiProcessingConsent: { type: 'boolean', description: 'GDPR: Required consent for AI processing' },
            acceptMarketing: { type: 'boolean', default: false },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Plan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            dailyLimit: { type: 'integer' },
            monthlyLimit: { type: 'integer' },
            features: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: { code: 'AUTH_003', message: 'Invalid token' },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: { code: 'RATE_001', message: 'Too many requests' },
              },
            },
          },
        },
        QuotaExceededError: {
          description: 'Analysis quota exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: { code: 'QUOTA_001', message: 'Daily quota reached' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
