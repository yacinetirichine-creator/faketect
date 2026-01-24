require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node src/scripts/make-admin.js <email>');
  process.exit(1);
}

async function makeAdmin() {
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      console.error(`❌ Utilisateur ${email} non trouvé`);
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ ${email} est déjà ADMIN`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ ${email} est maintenant ADMIN`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

makeAdmin();
