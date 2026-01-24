const { getVideoDurationInSeconds } = require('get-video-duration');

/**
 * Middleware pour valider et limiter la durée des vidéos uploadées
 * On analyse uniquement les 60 premières secondes (même si vidéo plus longue)
 */
async function validateVideoDuration(req, res, next) {
  // Passer si pas de fichier ou si c'est une image
  if (!req.file || !req.file.mimetype.startsWith('video/')) {
    return next();
  }

  try {
    const duration = await getVideoDurationInSeconds(req.file.path);

    // Limite d'analyse : 60 secondes maximum
    const MAX_ANALYSIS_DURATION = 60;

    // Stocker la durée réelle et la durée qui sera analysée
    req.videoMetadata = {
      totalDuration: Math.round(duration),
      analyzedDuration: Math.min(Math.round(duration), MAX_ANALYSIS_DURATION),
      isPartialAnalysis: duration > MAX_ANALYSIS_DURATION,
    };

    // Avertir l'utilisateur si vidéo > 60s (on analyse que le début)
    if (duration > MAX_ANALYSIS_DURATION) {
      console.log(`⚠️  Vidéo de ${Math.round(duration)}s détectée - analyse limitée aux ${MAX_ANALYSIS_DURATION} premières secondes`);
    }

    next();

  } catch (error) {
    console.error('Erreur validation durée vidéo:', error);

    // En cas d'erreur, laisser passer (le fichier sera analysé normalement)
    // Cela évite de bloquer si ffmpeg a un problème
    next();
  }
}

module.exports = { validateVideoDuration };
