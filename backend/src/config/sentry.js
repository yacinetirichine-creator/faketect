const Sentry = require('@sentry/node');

/**
 * Initialise Sentry pour le monitoring des erreurs backend
 * Optionnel - si SENTRY_DSN n'est pas défini, le monitoring est désactivé
 */
function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.log('⚠️  Sentry non configuré - monitoring désactivé (mode dégradé)');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',

      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Ne pas capturer les erreurs de validation ou 404
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Ignorer les erreurs 404
        if (error?.status === 404) {return null;}

        // Ignorer les erreurs de validation
        if (error?.name === 'ValidationError') {return null;}

        return event;
      },

      // Contexte supplémentaire
      initialScope: {
        tags: {
          app: 'faketect-backend',
        },
      },
    });

    console.log('✅ Sentry configuré - monitoring actif');
  } catch (error) {
    console.error('❌ Erreur initialisation Sentry:', error.message);
  }
}

module.exports = { initSentry, Sentry };
