import * as Sentry from '@sentry/react';

/**
 * Initialise Sentry pour le monitoring des erreurs frontend
 * Optionnel - si VITE_SENTRY_DSN n'est pas défini, le monitoring est désactivé
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.log('⚠️ Sentry non configuré - monitoring désactivé (mode dégradé)');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE || 'development',
      
      // Performance Monitoring
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      
      // Session Replay (optionnel)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      
      // Ne pas capturer les erreurs réseau temporaires
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Ignorer les erreurs réseau temporaires
        if (error?.message?.includes('NetworkError')) return null;
        if (error?.message?.includes('Failed to fetch')) return null;
        
        return event;
      },
    });

    console.log('✅ Sentry configuré - monitoring actif');
  } catch (error) {
    console.error('❌ Erreur initialisation Sentry:', error.message);
  }
}

export { Sentry };
