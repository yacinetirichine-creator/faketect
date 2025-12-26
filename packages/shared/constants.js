/**
 * Constantes partagées - AI Vision Detector v2.0
 */

// Niveaux de confiance
export const CONFIDENCE_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  ERROR: 'error'
};

// Seuils de score
export const SCORE_THRESHOLDS = {
  HIGH_AI: 0.85,
  MEDIUM_AI: 0.60,
  LOW_AI: 0.30
};

// Plans utilisateur
export const PLANS = {
  FREE: { name: 'free', label: 'Gratuit', dailyLimit: 10, price: 0 },
  STARTER: { name: 'starter', label: 'Starter', dailyLimit: 100, price: 4.99 },
  PRO: { name: 'pro', label: 'Pro', dailyLimit: 500, price: 9.99 },
  BUSINESS: { name: 'business', label: 'Business', dailyLimit: 2000, price: 29.99 }
};

// Types de fichiers acceptés
export const ACCEPTED_FILES = {
  // Images
  IMAGES: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp']
  },
  // Documents
  DOCUMENTS: {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  }
};

// Extensions par catégorie
export const FILE_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  DOCUMENTS: ['.pdf', '.docx', '.pptx', '.xlsx']
};

// Limites
export const LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20 MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_BATCH_SIZE: 20, // Images par lot
  MAX_DOCUMENT_PAGES: 50 // Pages max par document
};

// Sources d'analyse
export const SOURCES = {
  WEB: 'web',
  MOBILE: 'mobile',
  EXTENSION: 'extension',
  API: 'api'
};

// Types de source
export const SOURCE_TYPES = {
  IMAGE: 'image',
  URL: 'url',
  DOCUMENT: 'document'
};

// Moteurs de détection
export const ENGINES = {
  SIGHTENGINE: { name: 'sightengine', label: 'Sightengine', weight: 0.55 },
  ILLUMINARTY: { name: 'illuminarty', label: 'Illuminarty', weight: 0.45 }
};

// Modèles IA détectables
export const AI_MODELS = [
  'midjourney', 'stable-diffusion', 'dall-e', 'dall-e-3',
  'flux', 'firefly', 'leonardo', 'ideogram', 'unknown'
];

// Marqueurs EXIF suspects (logiciels IA)
export const AI_SOFTWARE_MARKERS = [
  'midjourney', 'stable diffusion', 'dall-e', 'dalle',
  'comfyui', 'automatic1111', 'invoke ai', 'leonardo',
  'firefly', 'adobe firefly', 'canva ai', 'flux'
];

// Messages d'erreur
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'Fichier trop volumineux',
  INVALID_FILE_TYPE: 'Type de fichier non supporté',
  ANALYSIS_FAILED: 'Analyse échouée',
  QUOTA_EXCEEDED: 'Limite quotidienne atteinte',
  UNAUTHORIZED: 'Connexion requise',
  NETWORK_ERROR: 'Erreur réseau',
  DOCUMENT_TOO_LONG: 'Document trop long (max 50 pages)',
  NO_IMAGES_FOUND: 'Aucune image trouvée dans le document',
  BATCH_TOO_LARGE: 'Trop d\'images (max 20)'
};

// Interprétations
export const INTERPRETATIONS = {
  HIGH_AI: {
    emoji: '🤖',
    title: 'Très probablement généré par IA',
    color: 'red'
  },
  MEDIUM_AI: {
    emoji: '⚠️',
    title: 'Possiblement généré par IA',
    color: 'yellow'
  },
  LOW_AI: {
    emoji: '🤔',
    title: 'Résultat incertain',
    color: 'gray'
  },
  HUMAN: {
    emoji: '👤',
    title: 'Probablement authentique',
    color: 'green'
  },
  ERROR: {
    emoji: '❓',
    title: 'Analyse impossible',
    color: 'gray'
  }
};
