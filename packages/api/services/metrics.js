/**
 * Service de métriques de performance
 * Collecte et expose les métriques d'utilisation
 */

class MetricsService {
  constructor() {
    this.metrics = {
      // Compteurs
      totalAnalyses: 0,
      totalBatches: 0,
      totalVideos: 0,
      totalErrors: 0,
      
      // Analyse par type
      imageAnalyses: 0,
      documentAnalyses: 0,
      urlAnalyses: 0,
      videoAnalyses: 0,
      
      // Temps de réponse
      analysisTimings: [],
      maxTimingsSamples: 1000, // Garder les 1000 dernières mesures
      
      // Détection IA
      aiDetectedCount: 0,
      authenticCount: 0,
      
      // Providers
      sightengineSuccess: 0,
      sightengineErrors: 0,
      illuminartySuccess: 0,
      illuminartyErrors: 0,
      
      // Quotas
      quotaExceeded: 0,
      guestAnalyses: 0,
      authenticatedAnalyses: 0,
      
      // Démarrage
      startTime: Date.now()
    };
  }

  /**
   * Enregistrer une analyse
   */
  recordAnalysis(type, duration, isAi, userId = null) {
    this.metrics.totalAnalyses++;
    
    // Type d'analyse
    if (type === 'image') this.metrics.imageAnalyses++;
    else if (type === 'document') this.metrics.documentAnalyses++;
    else if (type === 'url') this.metrics.urlAnalyses++;
    else if (type === 'video') this.metrics.videoAnalyses++;
    
    // Timing
    this.metrics.analysisTimings.push(duration);
    if (this.metrics.analysisTimings.length > this.metrics.maxTimingsSamples) {
      this.metrics.analysisTimings.shift();
    }
    
    // Détection
    if (isAi) this.metrics.aiDetectedCount++;
    else this.metrics.authenticCount++;
    
    // Authentification
    if (userId) this.metrics.authenticatedAnalyses++;
    else this.metrics.guestAnalyses++;
  }

  /**
   * Enregistrer un batch
   */
  recordBatch(imageCount) {
    this.metrics.totalBatches++;
    this.metrics.totalAnalyses += imageCount;
  }

  /**
   * Enregistrer une vidéo
   */
  recordVideo(frameCount, duration) {
    this.metrics.totalVideos++;
    this.metrics.videoAnalyses++;
    this.metrics.analysisTimings.push(duration);
    if (this.metrics.analysisTimings.length > this.metrics.maxTimingsSamples) {
      this.metrics.analysisTimings.shift();
    }
  }

  /**
   * Enregistrer une erreur
   */
  recordError(type = 'general') {
    this.metrics.totalErrors++;
  }

  /**
   * Enregistrer succès/échec provider
   */
  recordProvider(provider, success) {
    if (provider === 'sightengine') {
      if (success) this.metrics.sightengineSuccess++;
      else this.metrics.sightengineErrors++;
    } else if (provider === 'illuminarty') {
      if (success) this.metrics.illuminartySuccess++;
      else this.metrics.illuminartyErrors++;
    }
  }

  /**
   * Enregistrer dépassement quota
   */
  recordQuotaExceeded() {
    this.metrics.quotaExceeded++;
  }

  /**
   * Calculer les statistiques
   */
  getStats() {
    const timings = this.metrics.analysisTimings;
    const avgDuration = timings.length > 0
      ? timings.reduce((a, b) => a + b, 0) / timings.length
      : 0;
    
    const p95Duration = timings.length > 0
      ? this._percentile(timings, 0.95)
      : 0;
    
    const p99Duration = timings.length > 0
      ? this._percentile(timings, 0.99)
      : 0;
    
    const uptime = Math.floor((Date.now() - this.metrics.startTime) / 1000);
    const errorRate = this.metrics.totalAnalyses > 0
      ? (this.metrics.totalErrors / this.metrics.totalAnalyses * 100).toFixed(2)
      : 0;
    
    const aiDetectionRate = this.metrics.totalAnalyses > 0
      ? (this.metrics.aiDetectedCount / this.metrics.totalAnalyses * 100).toFixed(2)
      : 0;

    const sightengineTotal = this.metrics.sightengineSuccess + this.metrics.sightengineErrors;
    const sightengineSuccessRate = sightengineTotal > 0
      ? (this.metrics.sightengineSuccess / sightengineTotal * 100).toFixed(2)
      : 100;
    
    const illuminartyTotal = this.metrics.illuminartySuccess + this.metrics.illuminartyErrors;
    const illuminartySuccessRate = illuminartyTotal > 0
      ? (this.metrics.illuminartySuccess / illuminartyTotal * 100).toFixed(2)
      : 100;

    return {
      uptime: uptime,
      uptimeFormatted: this._formatUptime(uptime),
      
      analyses: {
        total: this.metrics.totalAnalyses,
        byType: {
          image: this.metrics.imageAnalyses,
          document: this.metrics.documentAnalyses,
          url: this.metrics.urlAnalyses,
          video: this.metrics.videoAnalyses
        },
        batches: this.metrics.totalBatches,
        videos: this.metrics.totalVideos
      },
      
      performance: {
        averageDuration: Math.round(avgDuration),
        p95Duration: Math.round(p95Duration),
        p99Duration: Math.round(p99Duration),
        samples: timings.length
      },
      
      detection: {
        aiDetected: this.metrics.aiDetectedCount,
        authentic: this.metrics.authenticCount,
        aiDetectionRate: `${aiDetectionRate}%`
      },
      
      providers: {
        sightengine: {
          success: this.metrics.sightengineSuccess,
          errors: this.metrics.sightengineErrors,
          successRate: `${sightengineSuccessRate}%`
        },
        illuminarty: {
          success: this.metrics.illuminartySuccess,
          errors: this.metrics.illuminartyErrors,
          successRate: `${illuminartySuccessRate}%`
        }
      },
      
      users: {
        guest: this.metrics.guestAnalyses,
        authenticated: this.metrics.authenticatedAnalyses,
        quotaExceeded: this.metrics.quotaExceeded
      },
      
      errors: {
        total: this.metrics.totalErrors,
        rate: `${errorRate}%`
      }
    };
  }

  /**
   * Calculer percentile
   */
  _percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Formater uptime
   */
  _formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  /**
   * Reset des métriques (pour tests)
   */
  reset() {
    this.metrics = {
      totalAnalyses: 0,
      totalBatches: 0,
      totalVideos: 0,
      totalErrors: 0,
      imageAnalyses: 0,
      documentAnalyses: 0,
      urlAnalyses: 0,
      videoAnalyses: 0,
      analysisTimings: [],
      maxTimingsSamples: 1000,
      aiDetectedCount: 0,
      authenticCount: 0,
      sightengineSuccess: 0,
      sightengineErrors: 0,
      illuminartySuccess: 0,
      illuminartyErrors: 0,
      quotaExceeded: 0,
      guestAnalyses: 0,
      authenticatedAnalyses: 0,
      startTime: Date.now()
    };
  }
}

// Instance singleton
const metricsService = new MetricsService();

module.exports = metricsService;
