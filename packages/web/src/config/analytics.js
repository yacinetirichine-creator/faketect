// Configuration centralisée des analytics
export const analyticsConfig = {
  // Google Analytics 4
  ga4: {
    measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    enabled: import.meta.env.VITE_ENABLE_GA4 === 'true' || import.meta.env.PROD,
    config: {
      send_page_view: false, // Géré manuellement
      cookie_flags: 'SameSite=None;Secure',
      anonymize_ip: true,
    },
  },

  // Hotjar
  hotjar: {
    siteId: import.meta.env.VITE_HOTJAR_SITE_ID || '',
    version: 6,
    enabled: import.meta.env.VITE_ENABLE_HOTJAR === 'true' || import.meta.env.PROD,
  },

  // Configuration générale
  cookieConsent: true, // Nécessite le consentement cookies
  debug: import.meta.env.DEV,
};

// Événements trackés
export const analyticsEvents = {
  // Analyse d'images
  IMAGE_UPLOAD_START: 'image_upload_start',
  IMAGE_UPLOAD_SUCCESS: 'image_upload_success',
  IMAGE_UPLOAD_ERROR: 'image_upload_error',
  IMAGE_ANALYSIS_COMPLETE: 'image_analysis_complete',
  
  // Documents
  DOCUMENT_UPLOAD_START: 'document_upload_start',
  DOCUMENT_ANALYSIS_COMPLETE: 'document_analysis_complete',
  
  // Rapports
  REPORT_DOWNLOAD: 'report_download',
  REPORT_SHARE: 'report_share',
  REPORT_VIEW: 'report_view',
  
  // Utilisateur
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Abonnements
  SUBSCRIPTION_START: 'subscription_start',
  SUBSCRIPTION_UPGRADE: 'subscription_upgrade',
  SUBSCRIPTION_CANCEL: 'subscription_cancel',
  CHECKOUT_BEGIN: 'checkout_begin',
  PURCHASE_COMPLETE: 'purchase_complete',
  
  // Extension
  EXTENSION_INSTALL: 'extension_install',
  EXTENSION_ANALYZE: 'extension_analyze',
  
  // Engagement
  PAGE_VIEW: 'page_view',
  SEARCH: 'search',
  SHARE: 'share',
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
};

// Catégories pour Hotjar
export const hotjarCategories = {
  CONVERSION: 'conversion',
  ERROR: 'error',
  ENGAGEMENT: 'engagement',
  NAVIGATION: 'navigation',
};
