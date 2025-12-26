const { v4: uuidv4 } = require('uuid');
const sightengine = require('./sightengine');
const illuminarty = require('./illuminarty');
const exifService = require('./exif');
const metricsService = require('./metrics');
const cacheService = require('./cache-service');
const hybridDetector = require('./hybrid-detector');
const { withTimeoutAndRetry, withFallback } = require('../utils/retry-helper');

const ENGINES = {
  SIGHTENGINE: { weight: 0.55 },
  ILLUMINARTY: { weight: 0.45 }
};

// 🤖 Mapping détaillé des modèles IA
const AI_MODELS_INFO = {
  'midjourney': { name: 'Midjourney', emoji: '🎨', icon: 'midjourney' },
  'dall-e': { name: 'DALL-E', emoji: '🎭', icon: 'dalle' },
  'dall-e-3': { name: 'DALL-E 3', emoji: '🎭', icon: 'dalle' },
  'stable-diffusion': { name: 'Stable Diffusion', emoji: '⚡', icon: 'stablediffusion' },
  'flux': { name: 'Flux', emoji: '🌊', icon: 'flux' },
  'firefly': { name: 'Adobe Firefly', emoji: '🔥', icon: 'firefly' },
  'leonardo': { name: 'Leonardo AI', emoji: '🦁', icon: 'leonardo' },
  'ideogram': { name: 'Ideogram', emoji: '📐', icon: 'ideogram' },
  'deepdream': { name: 'DeepDream', emoji: '💭', icon: 'deepdream' },
  'glide': { name: 'GLIDE', emoji: '✨', icon: 'glide' },
  'human': { name: 'Contenu Humain', emoji: '👤', icon: 'human' },
  'unknown': { name: 'Modèle Inconnu', emoji: '❓', icon: 'unknown' }
};

const AI_DECISION_THRESHOLD = (() => {
  const v = Number.parseFloat(process.env.AI_DECISION_THRESHOLD || '');
  return Number.isFinite(v) && v > 0 && v < 1 ? v : 0.7;
})();

function clamp01(value) {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(1, Math.max(0, num));
}

/**
 * Calcule le score combiné avec confidence amélioré
 * Considère: engines (70%) + EXIF (15%) + file metadata (10%) + image properties (5%)
 */
function calculateCombinedScore(se, il, exifResult = null, metadata = {}) {
  const scores = [];
  const seScore = se?.success ? clamp01(se.score) : null;
  const ilScore = il?.success ? clamp01(il.score) : null;

  if (se?.success && seScore != null) scores.push({ score: seScore, weight: ENGINES.SIGHTENGINE.weight });
  if (il?.success && ilScore != null) scores.push({ score: ilScore, weight: ENGINES.ILLUMINARTY.weight });

  if (scores.length === 0) return { combined: null, confidence: 'error', confidenceFactors: {} };

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  let engineScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;

  // 📊 Facteur EXIF (15%)
  let exifFactor = 0.5; // Neutre par défaut
  let exifConfidence = 'neutral';
  if (exifResult?.aiMarkers?.hasMarkers) {
    exifFactor = 1.0; // EXIF markers = strong AI indicator
    exifConfidence = 'strong';
  } else if (exifResult?.data?.software && /unknown|generic|none/i.test(exifResult.data.software)) {
    exifFactor = 0.8; // Software inconnu = suspect
    exifConfidence = 'suspicious';
  } else if (exifResult?.data?.software && /canon|nikon|sony|fujifilm|olympus/i.test(exifResult.data.software)) {
    exifFactor = 0.2; // Camera réelle = genuine
    exifConfidence = 'weak';
  }

  // 📁 Facteur Metadata (10%)
  let metadataFactor = 0.5; // Neutre
  let metadataConfidence = 'neutral';
  
  // Vérifier cohérence metadata
  if (metadata.size && metadata.size < 50000) {
    // Image très petite (< 50KB) = plus suspect pour IA
    metadataFactor += 0.15;
    metadataConfidence = 'small_file';
  }
  if (metadata.mimetype === 'image/webp') {
    // WebP plus courant pour IA générée
    metadataFactor += 0.1;
    metadataConfidence = 'webp_format';
  }
  metadataFactor = Math.min(1, metadataFactor);

  // 🎨 Facteur propriétés image (5%)
  let imageFactor = 0.5; // Neutre
  let imageConfidence = 'neutral';
  // (pourrait ajouter analyse compression, saturation, etc. plus tard)

  // Combiner tous les facteurs
  const finalScore = 
    (engineScore * 0.70) +         // 70% engines
    (exifFactor * 0.15) +          // 15% EXIF
    (metadataFactor * 0.10) +      // 10% metadata
    (imageFactor * 0.05);          // 5% image properties

  // Déterminer confidence niveau
  let confidence = 'low';
  const engineDiff = scores.length === 2 ? Math.abs(scores[0].score - scores[1].score) : 1;
  
  // Si 2 engines + accord faible = bonne confiance
  if (scores.length === 2 && engineDiff <= 0.15) {
    confidence = (finalScore >= 0.85 || finalScore <= 0.15) ? 'high' : 'medium';
  } 
  // Si 2 engines + accord moyen
  else if (scores.length === 2 && engineDiff <= 0.25) {
    confidence = 'medium';
  }
  // Si 1 seul engine = moins de confiance
  else if (scores.length === 1) {
    if (finalScore >= 0.9 || finalScore <= 0.1) confidence = 'medium';
    else confidence = 'low';
  }

  // EXIF markers augmente confiance
  if (exifResult?.aiMarkers?.hasMarkers) {
    confidence = 'high';
  }

  return { 
    combined: clamp01(finalScore), 
    confidence,
    engineScore,
    confidenceFactors: {
      engines: { score: engineScore, weight: 0.70, confidence: scores.length === 2 ? 'high' : 'medium' },
      exif: { score: exifFactor, weight: 0.15, confidence: exifConfidence },
      metadata: { score: metadataFactor, weight: 0.10, confidence: metadataConfidence },
      image: { score: imageFactor, weight: 0.05, confidence: imageConfidence }
    }
  };
}

function getCombinedBreakdown(seResult, ilResult) {
  return {
    method: 'weighted_average',
    weights: {
      sightengine: ENGINES.SIGHTENGINE.weight,
      illuminarty: ENGINES.ILLUMINARTY.weight
    },
    available: {
      sightengine: !!(seResult?.success && seResult.score != null),
      illuminarty: !!(ilResult?.success && ilResult.score != null)
    },
    providers: {
      sightengine: seResult?.success ? clamp01(seResult.score) : null,
      illuminarty: ilResult?.success ? clamp01(ilResult.score) : null
    }
  };
}

/**
 * Génère l'interprétation avec modèle IA détaillé
 */
function getInterpretation(score, confidence, exifAiMarkers, illuminartyModel, hybridAnalysis) {
  // Si EXIF contient des marqueurs IA, augmenter la confiance
  const hasExifMarkers = exifAiMarkers?.hasMarkers;
  
  if (score === null) {
    return { emoji: '❓', title: 'Analyse impossible', description: 'Impossible d\'analyser cette image.', color: 'gray', level: 'error' };
  }

  const pct = Math.round(score * 100);
  
  // Récupérer info modèle
  const modelInfo = illuminartyModel 
    ? AI_MODELS_INFO[illuminartyModel.toLowerCase()] || AI_MODELS_INFO['unknown']
    : null;
  
  // 🎨 Détection d'image hybride/composite (priorité haute)
  if (hybridAnalysis?.success && hybridAnalysis.isHybrid && hybridAnalysis.variance > 0.6) {
    const zoneCount = hybridAnalysis.suspiciousZones?.length || 0;
    return {
      emoji: '🎨',
      title: 'Image composite/retouchée détectée',
      description: `${zoneCount} zones suspectes analysées. Possibilité de mélange AI + humain ou retouche importante.`,
      color: 'orange',
      level: 'composite-detected',
      composite_confidence: hybridAnalysis.variance,
      suspicious_zones_count: zoneCount
    };
  }
  
  // Cas spécial : marqueurs EXIF IA détectés
  if (hasExifMarkers) {
    const markerName = exifAiMarkers.markers[0]?.marker || 'Métadonnées IA';
    return {
      emoji: '🤖',
      title: 'Image générée par IA',
      description: `${modelInfo ? `${modelInfo.emoji} ${modelInfo.name}` : 'Métadonnées IA détectées'}`,
      color: 'red',
      level: 'ai-confirmed',
      exifConfirmed: true,
      model: modelInfo
    };
  }

  // Échelle de détection basée sur le pourcentage
  if (score >= 0.90) {
    return { 
      emoji: '🤖', 
      title: modelInfo ? `${modelInfo.emoji} ${modelInfo.name} (${pct}%)` : 'Image générée par IA',
      description: modelInfo 
        ? `Très haute probabilité de génération par ${modelInfo.name}`
        : 'Certitude très élevée - Tous les indicateurs confirment une génération IA.',
      color: 'red',
      level: 'ai-certain',
      model: modelInfo
    };
  }
  if (score >= 0.70) {
    return { 
      emoji: '🤖', 
      title: modelInfo ? `Probablement ${modelInfo.emoji} ${modelInfo.name} (${pct}%)` : 'Probablement générée par IA',
      description: modelInfo
        ? `Forte probabilité ${modelInfo.name}`
        : 'Forte probabilité - Plusieurs signes de génération artificielle détectés.',
      color: 'red',
      level: 'ai-probable',
      model: modelInfo
    };
  }
  if (score >= 0.50) {
    return { 
      emoji: '⚠️', 
      title: modelInfo ? `Possiblement ${modelInfo.emoji} ${modelInfo.name}` : 'Possiblement générée par IA',
      description: modelInfo
        ? `Probabilité modérée: ${modelInfo.name}`
        : 'Probabilité modérée - Certains éléments suggèrent une génération IA.',
      color: 'orange',
      level: 'ai-possible',
      model: modelInfo
    };
  }
  if (score >= 0.30) {
    return { 
      emoji: '🔍', 
      title: 'Analyse non concluante', 
      description: 'Résultat mitigé - Difficile de déterminer l\'origine avec certitude.', 
      color: 'yellow',
      level: 'uncertain'
    };
  }
  if (score >= 0.10) {
    return { 
      emoji: '✓', 
      title: 'Probablement authentique', 
      description: 'Faible probabilité IA - L\'image semble provenir d\'une source réelle.', 
      color: 'green',
      level: 'authentic-probable'
    };
  }
  return { 
    emoji: '✓', 
    title: 'Image authentique', 
    description: 'Certitude très élevée - Aucun signe de génération artificielle détecté.', 
    color: 'green',
    level: 'authentic-certain'
  };
}

/**
 * Analyse complète d'une image (fichier)
 */
async function analyzeImage(filePath, metadata = {}) {
  const startTime = Date.now();
  const analysisId = uuidv4();

  console.log(`\n🔍 Analyse #${analysisId.slice(0, 8)}...`);

  // 💾 Vérifier cache MD5
  const fileHash = cacheService.calculateFileHash(filePath);
  if (fileHash) {
    const cachedResult = await cacheService.get(fileHash);
    if (cachedResult) {
      const duration = Date.now() - startTime;
      console.log(`  ⚡ From cache: ${fileHash.substring(0, 8)} (${duration}ms)`);
      // Mettre à jour analysisId (nouveau)
      cachedResult.id = analysisId;
      metricsService.recordAnalysis(metadata.sourceType || 'image', duration, cachedResult.is_ai_generated, metadata.userId, true); // cache hit
      return cachedResult;
    }
  }

  // Extraire EXIF en parallèle avec l'analyse (avec timeout/retry)
  const [seResult, ilResult, exifResult, hybridAnalysis] = await Promise.all([
    withTimeoutAndRetry(
      () => sightengine.analyzeImage(filePath),
      { timeout: 15000, maxRetries: 2, name: 'Sightengine' }
    ).catch(err => ({ success: false, error: err.message })),
    
    withTimeoutAndRetry(
      () => illuminarty.analyzeImage(filePath),
      { timeout: 15000, maxRetries: 2, name: 'Illuminarty' }
    ).catch(err => ({ success: false, error: err.message })),
    
    exifService.extractExif(filePath).catch(err => ({
      data: null,
      aiMarkers: { hasMarkers: false },
      error: err.message
    })),

    // 🎨 Détection images hybrides (composite/retouchées)
    hybridDetector.analyzeByZones(filePath).catch(err => ({
      success: false,
      error: err.message
    }))
  ]);

  const { combined, confidence, confidenceFactors } = calculateCombinedScore(
    seResult, 
    ilResult, 
    exifResult,
    { size: metadata.size, mimetype: metadata.mimetype }
  );
  const duration = Date.now() - startTime;
  const combined_breakdown = getCombinedBreakdown(seResult, ilResult);

  console.log(`  • Sightengine: ${seResult.success && seResult.score != null ? (seResult.score * 100).toFixed(1) + '%' : '❌'}`);
  console.log(`  • Illuminarty: ${ilResult.success && ilResult.score != null ? (ilResult.score * 100).toFixed(1) + '%' : '❌'}`);
  console.log(`  • EXIF AI: ${exifResult.aiMarkers?.hasMarkers ? '⚠️ Marqueurs détectés' : '✓'}`);
  console.log(`  • Hybrid Detection: ${hybridAnalysis?.success ? `${hybridAnalysis.isHybrid ? '🎨 COMPOSITE' : '✓'}` : '❌'}`);
  console.log(`  • Confidence: ${confidence} (EXIF: ${confidenceFactors.exif.confidence}, Metadata: ${confidenceFactors.metadata.confidence})`);
  console.log(`  ✓ Score: ${combined != null ? (combined * 100).toFixed(1) + '%' : 'N/A'} (${confidence}) - ${duration}ms`);

  // Enregistrer les métriques
  const isAi = (combined != null && combined >= AI_DECISION_THRESHOLD) || exifResult.aiMarkers?.hasMarkers;
  metricsService.recordAnalysis(metadata.sourceType || 'image', duration, isAi, metadata.userId);
  metricsService.recordProvider('sightengine', seResult.success);
  metricsService.recordProvider('illuminarty', ilResult.success);

  const result = {
    id: analysisId,
    filename: metadata.filename || 'unknown',
    file_size: metadata.size || 0,
    mime_type: metadata.mimetype || 'image/unknown',
    user_id: metadata.userId || null,
    source: metadata.source || 'web',
    source_type: metadata.sourceType || 'image',
    document_name: metadata.documentName || null,
    document_page: metadata.documentPage || null,
    batch_id: metadata.batchId || null,

    sightengine_score: seResult.score,
    sightengine_raw: seResult.raw,
    illuminarty_score: ilResult.score,
    illuminarty_model: ilResult.model,
    illuminarty_raw: ilResult.raw,

    // EXIF
    exif_data: exifResult.data,
    exif_camera: exifResult.data ? `${exifResult.data.make || ''} ${exifResult.data.model || ''}`.trim() || null : null,
    exif_software: exifResult.data?.software || null,
    confidence_factors: confidenceFactors, // Nouveau: détail des facteurs
    exif_date: exifResult.data?.dateTime || null,
    exif_has_ai_markers: exifResult.aiMarkers?.hasMarkers || false,

    combined_score: combined,
    combined_breakdown,
    confidence_level: confidence,
    is_ai_generated: (combined != null && combined >= AI_DECISION_THRESHOLD) || exifResult.aiMarkers?.hasMarkers,

    // 🎨 Détection images hybrides/composites
    hybrid_analysis: hybridAnalysis?.success ? {
      is_composite: hybridAnalysis.isHybrid,
      variance: hybridAnalysis.variance,
      suspicious_zones: hybridAnalysis.suspiciousZones,
      classification: hybridAnalysis.classification,
      details: hybridAnalysis.details
    } : null,

    interpretation: getInterpretation(combined, confidence, exifResult.aiMarkers, ilResult.model, hybridAnalysis),
    analysis_duration_ms: duration,

    engines: {
      sightengine: { score: seResult.score, success: seResult.success, simulated: seResult.simulated || false },
      illuminarty: { score: ilResult.score, model: ilResult.model, success: ilResult.success, simulated: ilResult.simulated || false }
    },
    exif: {
      data: exifResult.data,
      aiMarkers: exifResult.aiMarkers,
      summary: exifService.summarizeExif(exifResult.data)
    }
  };

  // 💾 Sauvegarder en cache
  if (fileHash) {
    await cacheService.set(fileHash, result);
  }

  return result;
}

/**
 * Analyse depuis un buffer
 */
async function analyzeBuffer(buffer, metadata = {}) {
  const startTime = Date.now();
  const analysisId = uuidv4();

  const [seResult, ilResult, exifResult] = await Promise.all([
    sightengine.analyzeBuffer(buffer, metadata.filename),
    illuminarty.analyzeBuffer(buffer, metadata.filename),
    exifService.extractExifFromBuffer(buffer)
  ]);

  const { combined, confidence } = calculateCombinedScore(seResult, ilResult);
  const combined_breakdown = getCombinedBreakdown(seResult, ilResult);

  return {
    id: analysisId,
    filename: metadata.filename || 'image',
    source: metadata.source || 'extension',
    source_type: metadata.sourceType || 'image',
    user_id: metadata.userId || null,
    batch_id: metadata.batchId || null,

    sightengine_score: seResult.score,
    illuminarty_score: ilResult.score,
    illuminarty_model: ilResult.model,

    exif_data: exifResult.data,
    exif_has_ai_markers: exifResult.aiMarkers?.hasMarkers || false,

    combined_score: combined,
    combined_breakdown,
    confidence_level: confidence,
    is_ai_generated: (combined != null && combined >= AI_DECISION_THRESHOLD) || exifResult.aiMarkers?.hasMarkers,

    interpretation: getInterpretation(combined, confidence, exifResult.aiMarkers, ilResult.model, null),
    analysis_duration_ms: Date.now() - startTime,

    engines: {
      sightengine: { score: seResult.score, success: seResult.success },
      illuminarty: { score: ilResult.score, model: ilResult.model, success: ilResult.success }
    },
    exif: { aiMarkers: exifResult.aiMarkers }
  };
}

/**
 * Analyse via URL
 */
async function analyzeUrl(imageUrl, metadata = {}) {
  const startTime = Date.now();
  const analysisId = uuidv4();

  const [seResult, ilResult] = await Promise.all([
    sightengine.analyzeUrl(imageUrl),
    illuminarty.analyzeUrl(imageUrl)
  ]);

  const { combined, confidence } = calculateCombinedScore(seResult, ilResult);
  const combined_breakdown = getCombinedBreakdown(seResult, ilResult);

  return {
    id: analysisId,
    filename: imageUrl.split('/').pop()?.split('?')[0] || 'url-image',
    source: metadata.source || 'web',
    source_type: 'url',
    user_id: metadata.userId || null,

    sightengine_score: seResult.score,
    illuminarty_score: ilResult.score,
    illuminarty_model: ilResult.model,

    combined_score: combined,
    combined_breakdown,
    confidence_level: confidence,
    is_ai_generated: combined != null && combined >= AI_DECISION_THRESHOLD,

    interpretation: getInterpretation(combined, confidence, null, null, null),
    analysis_duration_ms: Date.now() - startTime,

    engines: {
      sightengine: { score: seResult.score, success: seResult.success },
      illuminarty: { score: ilResult.score, model: ilResult.model, success: ilResult.success }
    }
  };
}

module.exports = { analyzeImage, analyzeBuffer, analyzeUrl, calculateCombinedScore, getInterpretation };
