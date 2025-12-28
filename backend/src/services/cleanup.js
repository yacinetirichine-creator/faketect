const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

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

    let orphansDeleted = 0;

    for (const file of files) {
      // Chercher si le fichier existe en base
      const fileUrl = `/uploads/${file}`;
      const analysis = await prisma.analysis.findFirst({
        where: { fileUrl }
      });

      if (!analysis) {
        // Fichier orphelin
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
      await cleanupOldAnalyses();
      await cleanupOrphanFiles();
    } catch (error) {
      console.error('❌ Erreur dans le cron de nettoyage:', error);
    }
  });

  console.log('✅ Cron de nettoyage initialisé (tous les jours à 3h)');
}

module.exports = {
  cleanupOldAnalyses,
  cleanupOrphanFiles,
  initCleanupJobs
};
