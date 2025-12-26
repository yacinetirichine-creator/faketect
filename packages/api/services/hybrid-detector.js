/**
 * 🎨 Hybrid Image Detector - Détecte images retouchées/composites
 * Divise image en zones et les analyse séparément
 * Si variance élevée = image hybride (AI + retouche humaine)
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class HybridImageDetector {
  constructor() {
    this.gridSize = 4; // 4x4 = 16 zones
    this.minVariance = 0.25; // Si variance > 25% = hybride
  }

  /**
   * Analyser une image par zones (quadrants)
   */
  async analyzeByZones(filePath) {
    try {
      // Charger image avec Sharp
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        return { success: false, error: 'Invalid image metadata' };
      }

      // Calculer taille zones
      const zoneWidth = Math.floor(metadata.width / this.gridSize);
      const zoneHeight = Math.floor(metadata.height / this.gridSize);

      if (zoneWidth < 50 || zoneHeight < 50) {
        // Image trop petite pour découper
        return { success: false, error: 'Image too small for zone analysis' };
      }

      // Extraire et analyser chaque zone
      const zoneAnalyses = [];
      const zoneResults = [];

      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          const left = col * zoneWidth;
          const top = row * zoneHeight;

          // Extraire zone
          const zoneBuffer = await image
            .extract({ left, top, width: zoneWidth, height: zoneHeight })
            .raw()
            .toBuffer({ resolveWithObject: true });

          // Calculer "texture signature" simple (histogramme)
          const signature = this.calculateSignature(zoneBuffer.data);
          zoneResults.push({
            zone: `${row}-${col}`,
            row,
            col,
            signature
          });
        }
      }

      // Analyser variance entre zones
      const { variance, isHybrid, suspiciousZones } = this.analyzeVariance(zoneResults);

      return {
        success: true,
        gridSize: this.gridSize,
        variance,
        isHybrid,
        suspiciousZones,
        zoneCount: zoneResults.length,
        details: {
          zones: zoneResults,
          variance_threshold: this.minVariance,
          hybrid_confidence: Math.min(variance * 100, 100)
        }
      };
    } catch (error) {
      console.error('❌ Zone analysis error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculer signature texturale d'une zone
   * Basé sur histogram des canaux RGB
   */
  calculateSignature(buffer) {
    const histogram = { r: [], g: [], b: [] };
    const buckets = 16; // 16 buckets per channel

    // Initialiser buckets
    for (let i = 0; i < buckets; i++) {
      histogram.r[i] = 0;
      histogram.g[i] = 0;
      histogram.b[i] = 0;
    }

    // Compter pixels par bucket
    for (let i = 0; i < buffer.length; i += 3) {
      const r = Math.floor(buffer[i] / (256 / buckets));
      const g = Math.floor(buffer[i + 1] / (256 / buckets));
      const b = Math.floor(buffer[i + 2] / (256 / buckets));

      histogram.r[Math.min(r, buckets - 1)]++;
      histogram.g[Math.min(g, buckets - 1)]++;
      histogram.b[Math.min(b, buckets - 1)]++;
    }

    // Normaliser
    const pixelCount = buffer.length / 3;
    const normalized = {
      r: histogram.r.map(v => v / pixelCount),
      g: histogram.g.map(v => v / pixelCount),
      b: histogram.b.map(v => v / pixelCount)
    };

    return normalized;
  }

  /**
   * Analyser variance entre zones
   */
  analyzeVariance(zones) {
    if (zones.length < 2) return { variance: 0, isHybrid: false, suspiciousZones: [] };

    // Calculer distance moyenne entre signatures
    const distances = [];
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const dist = this.signatureDistance(zones[i].signature, zones[j].signature);
        distances.push(dist);
      }
    }

    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = Math.min(avgDistance, 1.0); // Clamp 0-1

    // Détecter zones suspectes (outliers)
    const suspiciousZones = this.findSuspiciousZones(zones, variance);

    // Si variance élevée ET zones suspectes groupées = probablement composite
    const isHybrid = variance > this.minVariance && suspiciousZones.length > 0;

    return { variance, isHybrid, suspiciousZones };
  }

  /**
   * Distance entre 2 signatures (Bhattacharyya)
   */
  signatureDistance(sig1, sig2) {
    let distance = 0;
    for (const channel of ['r', 'g', 'b']) {
      for (let i = 0; i < sig1[channel].length; i++) {
        const p = sig1[channel][i];
        const q = sig2[channel][i];
        distance += Math.sqrt(p * q);
      }
    }
    return 1 - (distance / 3); // Normaliser: 0 = identique, 1 = totalement différent
  }

  /**
   * Trouver zones suspectes (outliers)
   */
  findSuspiciousZones(zones, baseVariance) {
    const distanceMap = new Map();

    // Calculer distance moyenne de chaque zone
    for (let i = 0; i < zones.length; i++) {
      let totalDist = 0;
      let count = 0;

      for (let j = 0; j < zones.length; j++) {
        if (i !== j) {
          const dist = this.signatureDistance(zones[i].signature, zones[j].signature);
          totalDist += dist;
          count++;
        }
      }

      const avgDist = totalDist / count;
      distanceMap.set(zones[i].zone, avgDist);
    }

    // Zones suspectes = écart > 1.5x moyenne
    const threshold = baseVariance * 1.5;
    const suspicious = [];

    for (const [zone, dist] of distanceMap.entries()) {
      if (dist > threshold) {
        suspicious.push({ zone, distance: dist, suspicion_level: Math.min(dist * 100, 100) });
      }
    }

    return suspicious;
  }

  /**
   * Interpréter résultats zone analysis
   */
  getInterpretation(analysis) {
    if (!analysis.success) {
      return {
        detected: false,
        reason: 'Could not analyze zones'
      };
    }

    const { isHybrid, variance, suspiciousZones } = analysis;

    if (!isHybrid) {
      return {
        detected: false,
        consistency: 'high',
        variance_score: variance,
        reason: 'Image texture is consistent across zones'
      };
    }

    // Image hybride détectée
    const suspiciousCount = suspiciousZones.length;
    const totalZones = analysis.gridSize * analysis.gridSize;
    const suspicionRate = suspiciousCount / totalZones;

    let hybridType = 'unknown';
    let confidence = 'low';

    if (suspicionRate > 0.5) {
      hybridType = 'heavily_composite'; // >50% zones suspectes
      confidence = 'high';
    } else if (suspicionRate > 0.25) {
      hybridType = 'partially_composite'; // 25-50% zones suspectes
      confidence = 'medium';
    } else {
      hybridType = 'slightly_composite'; // <25% zones suspectes
      confidence = 'low';
    }

    return {
      detected: true,
      type: hybridType,
      confidence,
      variance_score: variance,
      suspicious_zones: suspiciousCount,
      total_zones: totalZones,
      suspicion_rate: Math.round(suspicionRate * 100),
      zones_details: suspiciousZones,
      reason: `Image contains ${hybridType} characteristics (${Math.round(suspicionRate * 100)}% zones anomalous)`
    };
  }
}

module.exports = new HybridImageDetector();
