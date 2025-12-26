import { analyticsConfig } from '../config/analytics';

class AnalyticsService {
  constructor() {
    this.initialized = false;
    this.consentGiven = false;
    this.queue = [];
  }

  // Initialisation de GA4
  initGA4() {
    if (!analyticsConfig.ga4.enabled || !analyticsConfig.ga4.measurementId) {
      console.log('[Analytics] GA4 disabled or missing measurement ID');
      return;
    }

    // Charger le script GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.ga4.measurementId}`;
    document.head.appendChild(script);

    // Initialiser gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', analyticsConfig.ga4.measurementId, analyticsConfig.ga4.config);

    if (analyticsConfig.debug) {
      console.log('[Analytics] GA4 initialized:', analyticsConfig.ga4.measurementId);
    }
  }

  // Initialisation de Hotjar
  initHotjar() {
    if (!analyticsConfig.hotjar.enabled || !analyticsConfig.hotjar.siteId) {
      console.log('[Analytics] Hotjar disabled or missing site ID');
      return;
    }

    (function(h, o, t, j, a, r) {
      h.hj = h.hj || function() {
        (h.hj.q = h.hj.q || []).push(arguments);
      };
      h._hjSettings = {
        hjid: analyticsConfig.hotjar.siteId,
        hjsv: analyticsConfig.hotjar.version
      };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

    if (analyticsConfig.debug) {
      console.log('[Analytics] Hotjar initialized:', analyticsConfig.hotjar.siteId);
    }
  }

  // Initialiser tous les services
  init() {
    if (this.initialized) return;

    if (analyticsConfig.cookieConsent && !this.consentGiven) {
      console.log('[Analytics] Waiting for cookie consent');
      return;
    }

    this.initGA4();
    this.initHotjar();
    this.initialized = true;

    // Traiter la queue
    this.processQueue();
  }

  // Donner le consentement
  giveConsent() {
    this.consentGiven = true;
    this.init();
  }

  // Révoquer le consentement
  revokeConsent() {
    this.consentGiven = false;
    this.initialized = false;
    
    // Désactiver GA4
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  }

  // Traiter la queue d'événements
  processQueue() {
    while (this.queue.length > 0) {
      const { method, args } = this.queue.shift();
      this[method](...args);
    }
  }

  // Ajouter à la queue si pas encore initialisé
  addToQueue(method, args) {
    this.queue.push({ method, args });
  }

  // Tracker une page vue
  trackPageView(path, title) {
    if (!this.initialized) {
      this.addToQueue('trackPageView', [path, title]);
      return;
    }

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      });
    }

    if (analyticsConfig.debug) {
      console.log('[Analytics] Page view:', path, title);
    }
  }

  // Tracker un événement
  trackEvent(eventName, parameters = {}) {
    if (!this.initialized) {
      this.addToQueue('trackEvent', [eventName, parameters]);
      return;
    }

    if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }

    if (analyticsConfig.debug) {
      console.log('[Analytics] Event:', eventName, parameters);
    }
  }

  // Tracker un événement Hotjar
  trackHotjarEvent(eventName) {
    if (!this.initialized || !window.hj) return;

    window.hj('event', eventName);

    if (analyticsConfig.debug) {
      console.log('[Analytics] Hotjar event:', eventName);
    }
  }

  // Identifier un utilisateur
  identifyUser(userId, traits = {}) {
    if (!this.initialized) {
      this.addToQueue('identifyUser', [userId, traits]);
      return;
    }

    if (window.gtag) {
      window.gtag('config', analyticsConfig.ga4.measurementId, {
        user_id: userId,
        ...traits,
      });
    }

    if (window.hj) {
      window.hj('identify', userId, traits);
    }

    if (analyticsConfig.debug) {
      console.log('[Analytics] User identified:', userId, traits);
    }
  }

  // Tracker une conversion
  trackConversion(value, currency = 'EUR', transactionId) {
    this.trackEvent('purchase', {
      value,
      currency,
      transaction_id: transactionId,
    });

    this.trackHotjarEvent('conversion');
  }

  // Tracker une erreur
  trackError(error, fatal = false) {
    this.trackEvent('exception', {
      description: error.message || error,
      fatal,
    });
  }

  // Tracker le timing
  trackTiming(category, variable, value) {
    this.trackEvent('timing_complete', {
      name: variable,
      value,
      event_category: category,
    });
  }
}

// Instance singleton
export const analytics = new AnalyticsService();

// Fonctions utilitaires
export const trackImageAnalysis = (fileSize, fileType, duration, result) => {
  analytics.trackEvent('image_analysis_complete', {
    file_size: fileSize,
    file_type: fileType,
    duration_ms: duration,
    is_ai: result.isAI,
    confidence: result.confidence,
  });

  analytics.trackTiming('analysis', 'image_analysis', duration);
};

export const trackDocumentAnalysis = (fileSize, fileType, pageCount, duration) => {
  analytics.trackEvent('document_analysis_complete', {
    file_size: fileSize,
    file_type: fileType,
    page_count: pageCount,
    duration_ms: duration,
  });

  analytics.trackTiming('analysis', 'document_analysis', duration);
};

export const trackSubscription = (plan, price, interval) => {
  analytics.trackEvent('subscription_start', {
    plan,
    price,
    interval,
  });

  analytics.trackConversion(price, 'EUR', `sub_${Date.now()}`);
};

export default analytics;
