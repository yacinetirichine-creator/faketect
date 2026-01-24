const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { sendDeletionWarningEmail } = require('./email');

/**
 * Envoie un email de rappel 7 jours avant suppression (23 jours après création)
 */
async function sendDeletionWarnings() {
  try {
    const twentyThreeDaysAgo = new Date();
    twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23);
    
    const twentyFourDaysAgo = new Date();
    twentyFourDaysAgo.setDate(twentyFourDaysAgo.getDate() - 24);

    console.log(`📧 Envoi d'alertes de suppression (23 jours)...`);

    // Comptes FREE créés il y a exactement 23 jours (7 jours avant suppression)
    const usersToWarn = await prisma.user.findMany({
      where: {
        plan: 'FREE',
        role: { not: 'ADMIN' },
        createdAt: {
          lte: twentyThreeDaysAgo,
          gte: twentyFourDaysAgo
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        language: true
      }
    });

    console.log(`📬 ${usersToWarn.length} utilisateurs à alerter`);

    let sent = 0;
    for (const user of usersToWarn) {
      const success = await sendDeletionWarningEmail(user, 7);
      if (success) sent++;
    }

    console.log(`✅ ${sent}/${usersToWarn.length} emails de rappel envoyés`);
    return { warned: sent };
  } catch (error) {
    console.error('❌ Erreur envoi warnings:', error);
    return { warned: 0 };
  }
}

/**
 * Supprime les comptes FREE inactifs de plus de 30 jours
 * Optimisé avec deleteMany pour éviter les N+1 queries
 */
async function cleanupInactiveFreeAccounts() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`🧹 Nettoyage des comptes FREE inactifs créés avant le ${thirtyDaysAgo.toISOString()}`);

    // Compter d'abord pour logging
    const count = await prisma.user.count({
      where: {
        plan: 'FREE',
        createdAt: { lt: thirtyDaysAgo },
        role: 'USER'
      }
    });

    console.log(`👥 ${count} comptes FREE inactifs à supprimer`);

    if (count === 0) {
      return { usersDeleted: 0 };
    }

    // Suppression batch avec deleteMany (plus performant que la boucle)
    // Les analyses seront supprimées automatiquement grâce au onDelete: Cascade
    const result = await prisma.user.deleteMany({
      where: {
        plan: 'FREE',
        createdAt: { lt: thirtyDaysAgo },
        role: 'USER'
      }
    });

    console.log(`✅ Nettoyage comptes FREE terminé : ${result.count} comptes supprimés`);

    return { usersDeleted: result.count };
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des comptes FREE:', error);
    throw error;
  }
}

/**
 * Supprime les analyses et fichiers de plus de 90 jours (conformément aux CGV)
 */
async function cleanupOldAnalyses() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    console.log(`🧹 Nettoyage des analyses avant le ${ninetyDaysAgo.toISOString()}`);

    // Récupérer les analyses à supprimer
    const oldAnalyses = await prisma.analysis.findMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    });

    console.log(`📦 ${oldAnalyses.length} analyses à supprimer`);

    let deletedFiles = 0;
    let errors = 0;

    // Supprimer les fichiers physiques
    for (const analysis of oldAnalyses) {
      if (analysis.fileUrl) {
        try {
          // Le fileUrl est de la forme /uploads/filename.ext
          const filename = analysis.fileUrl.replace('/uploads/', '');
          const filePath = path.join(__dirname, '../../uploads', filename);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedFiles++;
            console.log(`✅ Fichier supprimé : ${filename}`);
          }
        } catch (error) {
          console.error(`❌ Erreur suppression fichier ${analysis.fileUrl}:`, error.message);
          errors++;
        }
      }
    }

    // Supprimer les analyses de la base de données
    const result = await prisma.analysis.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    });

    console.log(`✅ Nettoyage terminé : ${result.count} analyses supprimées, ${deletedFiles} fichiers supprimés`);
    if (errors > 0) {
      console.log(`⚠️ ${errors} erreurs lors de la suppression de fichiers`);
    }

    return {
      analysesDeleted: result.count,
      filesDeleted: deletedFiles,
      errors: errors
    };
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

/**
 * Nettoie les fichiers orphelins (dans uploads/ mais pas en base)
 * Optimisé pour éviter les N+1 queries: charge tous les fileUrls en une seule requête
 */
async function cleanupOrphanFiles() {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');

    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Dossier uploads/ inexistant');
      return { orphansDeleted: 0 };
    }

    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 ${files.length} fichiers dans uploads/`);

    if (files.length === 0) {
      return { orphansDeleted: 0 };
    }

    // Récupérer tous les fileUrls en une seule requête (évite N+1)
    const existingAnalyses = await prisma.analysis.findMany({
      where: {
        fileUrl: { not: null }
      },
      select: { fileUrl: true }
    });

    // Créer un Set pour recherche O(1)
    const existingFileUrls = new Set(existingAnalyses.map(a => a.fileUrl));

    let orphansDeleted = 0;

    for (const file of files) {
      const fileUrl = `/uploads/${file}`;

      // Vérification en mémoire au lieu d'une requête DB
      if (!existingFileUrls.has(fileUrl)) {
        const filePath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
          orphansDeleted++;
          console.log(`🗑️ Fichier orphelin supprimé : ${file}`);
        } catch (error) {
          console.error(`❌ Erreur suppression orphelin ${file}:`, error.message);
        }
      }
    }

    console.log(`✅ Nettoyage orphelins terminé : ${orphansDeleted} fichiers supprimés`);
    return { orphansDeleted };
  } catch (error) {
    console.error('❌ Erreur nettoyage orphelins:', error);
    throw error;
  }
}

/**
 * Initialise les tâches cron de nettoyage
 */
function initCleanupJobs() {
  // Tous les jours à 3h du matin
  cron.schedule('0 3 * * *', async () => {
    console.log('🕒 Exécution du nettoyage automatique quotidien');
    try {
      await sendDeletionWarnings(); // Envoyer emails 7 jours avant suppression
      await cleanupOldAnalyses();
      await cleanupOrphanFiles();
      await cleanupInactiveFreeAccounts(); // Suppression des comptes FREE > 30 jours
    } catch (error) {
      console.error('❌ Erreur dans le cron de nettoyage:', error);
    }
  });

  console.log('✅ Cron de nettoyage initialisé (tous les jours à 3h)');
}

module.exports = {
  cleanupOldAnalyses,
  cleanupOrphanFiles,
  cleanupInactiveFreeAccounts,
  sendDeletionWarnings,
  initCleanupJobs
};
