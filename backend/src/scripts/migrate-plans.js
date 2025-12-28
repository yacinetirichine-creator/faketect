/**
 * Migration des anciens noms de plans vers les nouveaux
 * STARTER → STANDARD
 * PRO → PROFESSIONAL
 * 
 * À exécuter UNE SEULE FOIS après le déploiement
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migratePlans() {
  console.log('🔄 Migration des noms de plans...\n');

  try {
    // 1. Compter les utilisateurs avec anciens plans
    const starterCount = await prisma.user.count({ where: { plan: 'STARTER' } });
    const proCount = await prisma.user.count({ where: { plan: 'PRO' } });

    console.log(`📊 Utilisateurs à migrer :`);
    console.log(`   - STARTER → STANDARD : ${starterCount} utilisateurs`);
    console.log(`   - PRO → PROFESSIONAL : ${proCount} utilisateurs\n`);

    if (starterCount === 0 && proCount === 0) {
      console.log('✅ Aucune migration nécessaire. Tous les plans sont déjà à jour.\n');
      return;
    }

    // 2. Migrer STARTER → STANDARD
    if (starterCount > 0) {
      const result1 = await prisma.user.updateMany({
        where: { plan: 'STARTER' },
        data: { plan: 'STANDARD' }
      });
      console.log(`✅ STARTER → STANDARD : ${result1.count} utilisateurs migrés`);
    }

    // 3. Migrer PRO → PROFESSIONAL
    if (proCount > 0) {
      const result2 = await prisma.user.updateMany({
        where: { plan: 'PRO' },
        data: { plan: 'PROFESSIONAL' }
      });
      console.log(`✅ PRO → PROFESSIONAL : ${result2.count} utilisateurs migrés`);
    }

    // 4. Vérification finale
    const remainingStarter = await prisma.user.count({ where: { plan: 'STARTER' } });
    const remainingPro = await prisma.user.count({ where: { plan: 'PRO' } });

    console.log(`\n📊 Vérification post-migration :`);
    console.log(`   - STARTER restants : ${remainingStarter}`);
    console.log(`   - PRO restants : ${remainingPro}`);

    if (remainingStarter === 0 && remainingPro === 0) {
      console.log(`\n✅ Migration terminée avec succès !`);
    } else {
      console.log(`\n⚠️ Attention : ${remainingStarter + remainingPro} utilisateurs n'ont pas été migrés`);
    }

    // 5. Afficher la répartition actuelle
    const distribution = await prisma.user.groupBy({
      by: ['plan'],
      _count: true
    });

    console.log(`\n📊 Distribution actuelle des plans :`);
    distribution.forEach(d => {
      console.log(`   - ${d.plan} : ${d._count} utilisateurs`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
migratePlans()
  .then(() => {
    console.log('\n✅ Script de migration terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec de la migration :', error);
    process.exit(1);
  });
