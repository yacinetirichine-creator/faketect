const { PrismaClient } = require('@prisma/client');

// Configuration avec connection pooling pour scalabilité
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Connection pooling (crucial pour multi-instances)
  // Neon limite à ~100 connexions : 4 workers × 20 = 80 connexions max
  __internal: {
    engine: {
      connection_limit: 20, // Max connexions par worker
      pool_timeout: 10,     // Timeout après 10s si pool saturé
    },
  },
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
