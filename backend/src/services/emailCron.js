const cron = require('node-cron');
const prisma = require('../config/db');
const logger = require('../config/logger');
const {
  sendDay3EngagementEmail,
  sendDay7ConversionEmail,
  sendInactiveUserEmail,
  sendQuotaWarningEmail,
} = require('../services/emailAutomation');

/**
 * CRON : Tous les jours à 10h (heure serveur)
 * Envoie les emails automatiques selon les règles métier
 */
function startEmailAutomationCron() {
  // Exécute tous les jours à 10h00
  cron.schedule('0 10 * * *', async () => {
    logger.info('🤖 Email automation cron started');

    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // ========================================
      // 1. EMAIL J+3 : Utilisateurs sans analyses
      // ========================================
      const day3Users = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate()),
            lt: new Date(threeDaysAgo.getFullYear(), threeDaysAgo.getMonth(), threeDaysAgo.getDate() + 1),
          },
          analyses: {
            none: {}, // Aucune analyse faite
          },
        },
      });

      logger.info(`Found ${day3Users.length} users for Day 3 engagement email`);

      for (const user of day3Users) {
        await sendDay3EngagementEmail(user);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause 1s entre emails
      }

      // ========================================
      // 2. EMAIL J+7 : Conversion PRO (utilisateurs FREE uniquement)
      // ========================================
      const day7Users = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate()),
            lt: new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate() + 1),
          },
          plan: 'FREE', // Seulement les FREE
        },
      });

      logger.info(`Found ${day7Users.length} users for Day 7 conversion email`);

      for (const user of day7Users) {
        await sendDay7ConversionEmail(user);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // ========================================
      // 3. RE-ENGAGEMENT J+30 : Utilisateurs inactifs
      // ========================================
      const inactiveUsers = await prisma.user.findMany({
        where: {
          analyses: {
            none: {
              createdAt: {
                gte: thirtyDaysAgo, // Aucune analyse depuis 30 jours
              },
            },
          },
          createdAt: {
            lt: thirtyDaysAgo, // Compte créé il y a plus de 30 jours
          },
        },
      });

      logger.info(`Found ${inactiveUsers.length} inactive users for re-engagement email`);

      for (const user of inactiveUsers) {
        await sendInactiveUserEmail(user);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // ========================================
      // 4. RAPPEL QUOTA : Utilisateurs à 75%+ de leur quota
      // ========================================
      const planLimits = {
        FREE: 10,
        PRO: 100,
        BUSINESS: 500,
      };

      const quotaUsers = await prisma.user.findMany({
        where: {
          OR: [
            { plan: 'FREE', usedMonth: { gte: 8 } }, // 8/10 = 80%
            { plan: 'PRO', usedMonth: { gte: 75 } }, // 75/100 = 75%
            { plan: 'BUSINESS', usedMonth: { gte: 375 } }, // 375/500 = 75%
          ],
        },
      });

      logger.info(`Found ${quotaUsers.length} users for quota warning email`);

      for (const user of quotaUsers) {
        const limit = planLimits[user.plan];
        const percentUsed = (user.usedMonth / limit) * 100;

        // Envoyer email seulement si >= 75% et pas déjà envoyé ce mois
        if (percentUsed >= 75) {
          await sendQuotaWarningEmail(user);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('✅ Email automation cron completed successfully');

    } catch (error) {
      logger.error('❌ Email automation cron error:', error);
    }
  });

  logger.info('📧 Email automation cron scheduled (every day at 10:00 AM)');
}

module.exports = { startEmailAutomationCron };
