/**
 * Utilitaires partagés - AI Vision Detector v2.0
 */

import { 
  CONFIDENCE_LEVELS, SCORE_THRESHOLDS, INTERPRETATIONS, ENGINES,
  AI_SOFTWARE_MARKERS, FILE_EXTENSIONS
} from './constants.js';

/**
 * Calcule le score combiné
 */
export function calculateCombinedScore(results) {
  const scores = [];
  
  if (results.sightengine != null) {
    scores.push({ score: results.sightengine, weight: ENGINES.SIGHTENGINE.weight });
  }
  if (results.illuminarty != null) {
    scores.push({ score: results.illuminarty, weight: ENGINES.ILLUMINARTY.weight });
  }

  if (scores.length === 0) {
    return { score: null, confidence: CONFIDENCE_LEVELS.ERROR };
  }

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;

  let confidence = CONFIDENCE_LEVELS.LOW;
  
  if (scores.length === 2) {
    const diff = Math.abs(scores[0].score - scores[1].score);
    if (diff < 0.15 && weightedScore > SCORE_THRESHOLDS.HIGH_AI) {
      confidence = CONFIDENCE_LEVELS.HIGH;
    } else if (diff < 0.25 && weightedScore > SCORE_THRESHOLDS.MEDIUM_AI) {
      confidence = CONFIDENCE_LEVELS.MEDIUM;
    }
  } else if (weightedScore > SCORE_THRESHOLDS.HIGH_AI) {
    confidence = CONFIDENCE_LEVELS.MEDIUM;
  }

  return { score: weightedScore, confidence };
}

/**
 * Génère l'interprétation
 */
export function getInterpretation(score, confidence) {
  if (score === null) {
    return { ...INTERPRETATIONS.ERROR, description: 'Analyse impossible.' };
  }

  const pct = Math.round(score * 100);

  if (confidence === CONFIDENCE_LEVELS.HIGH && score > SCORE_THRESHOLDS.HIGH_AI) {
    return {
      ...INTERPRETATIONS.HIGH_AI,
      description: `Score de ${pct}% - Les moteurs sont d'accord : image IA.`
    };
  }
  if (confidence === CONFIDENCE_LEVELS.HIGH && score < SCORE_THRESHOLDS.LOW_AI) {
    return {
      ...INTERPRETATIONS.HUMAN,
      description: `Score de ${pct}% - Pas de signes de génération IA.`
    };
  }
  if (score > SCORE_THRESHOLDS.MEDIUM_AI) {
    return {
      ...INTERPRETATIONS.MEDIUM_AI,
      description: `Score de ${pct}% - Possiblement généré par IA.`
    };
  }
  return {
    ...INTERPRETATIONS.LOW_AI,
    description: `Score de ${pct}% - Résultat à interpréter avec prudence.`
  };
}

/**
 * Vérifie si les métadonnées EXIF contiennent des marqueurs IA
 */
export function checkExifForAI(exifData) {
  if (!exifData) return { hasMarkers: false, markers: [] };
  
  const markers = [];
  const fieldsToCheck = ['Software', 'ProcessingSoftware', 'Creator', 'Artist', 'Comment'];
  
  for (const field of fieldsToCheck) {
    const value = exifData[field];
    if (value && typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      for (const marker of AI_SOFTWARE_MARKERS) {
        if (lowerValue.includes(marker)) {
          markers.push({ field, value, marker });
        }
      }
    }
  }
  
  return { hasMarkers: markers.length > 0, markers };
}

/**
 * Formate un score en pourcentage
 */
export function formatScore(score) {
  if (score == null) return 'N/A';
  return `${Math.round(score * 100)}%`;
}

/**
 * Formate une taille de fichier
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formate une date relative
 */
export function formatRelativeDate(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Détermine le type de fichier
 */
export function getFileType(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  
  if (FILE_EXTENSIONS.IMAGES.includes(ext)) return 'image';
  if (FILE_EXTENSIONS.DOCUMENTS.includes(ext)) return 'document';
  return 'unknown';
}

/**
 * Génère un ID unique
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
