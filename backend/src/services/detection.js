class DetectionService {
  async analyze(input, mimeType, filename = 'file') {
    // Backward-compatible signature:
    // - analyze(buffer, mimeType)
    // - analyze(streamOrBuffer, mimeType, filename)
    const isVideo = String(mimeType || '').startsWith('video/');
    
    // Pour les vidéos, utiliser uniquement Sightengine (support vidéo)
    if (isVideo) {
      if (process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET) {
        try {
          return await this.analyzeVideoWithSightengine(input, mimeType, filename);
        } catch (e) {
          console.error('Sightengine video error:', e);
          return this.demoAnalysis('video');
        }
      }
      return this.demoAnalysis('video');
    }
    
    // Pour les images : analyse combinée pour plus de précision
    const jobs = [];

    if (process.env.ILLUMINARTY_USER && process.env.ILLUMINARTY_SECRET) {
      jobs.push(
        this.analyzeWithIlluminarty(input, mimeType, filename).catch((e) => {
          console.error('Illuminarty API error:', e);
          return null;
        })
      );
    }

    if (process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET) {
      jobs.push(
        this.analyzeWithSightengine(input, mimeType, filename).catch((e) => {
          console.error('Sightengine API error:', e);
          return null;
        })
      );
    }

    const settled = await Promise.all(jobs);
    const results = settled.filter(Boolean);
    
    // Si au moins une API a fonctionné, combiner les résultats
    if (results.length > 0) {
      return this.combineResults(results);
    }
    
    // Mode démo si aucune API disponible
    return this.demoAnalysis('image');
  }

  /**
   * Combine les résultats de plusieurs APIs pour plus de précision
   */
  combineResults(results) {
    // Moyenne pondérée des scores
    const totalScore = results.reduce((sum, r) => sum + r.aiScore, 0);
    const avgScore = totalScore / results.length;
    
    // Moyenne des confiances
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = totalConfidence / results.length;
    
    // Consensus : majorité détermine isAi
    const aiCount = results.filter(r => r.isAi).length;
    const isAi = aiCount > results.length / 2;
    
    return {
      aiScore: Math.round(avgScore * 100) / 100,
      isAi,
      confidence: Math.round(avgConfidence * 100) / 100,
      verdict: this.getVerdict(avgScore),
      provider: 'combined',
      sources: results.map(r => ({
        provider: r.provider,
        score: r.aiScore,
        confidence: r.confidence
      })),
      consensus: `${aiCount}/${results.length} APIs détectent de l'IA`
    };
  }

  async analyzeWithIlluminarty(input, mimeType, filename = 'image.jpg') {
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('image', input, { 
      filename: filename || 'image.jpg', 
      contentType: mimeType 
    });
    formData.append('api_user', process.env.ILLUMINARTY_USER);
    formData.append('api_secret', process.env.ILLUMINARTY_SECRET);

    const res = await this.fetchWithTimeout('https://api.illuminarty.ai/v1/analyze', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.ILLUMINARTY_API_KEY
      },
      body: formData
    }, 15_000);

    if (!res.ok) {
      throw new Error(`Illuminarty API error: ${res.status}`);
    }

    const data = await res.json();
    
    const score = (data.ai_probability || data.score || 0) * 100;
    const confidence = (data.confidence || 85);
    
    return {
      aiScore: Math.round(score * 100) / 100,
      isAi: score >= 50,
      confidence,
      verdict: this.getVerdict(score),
      provider: 'illuminarty',
      details: data
    };
  }

  async analyzeWithSightengine(input, mimeType, filename = 'image.jpg') {
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('media', input, { filename: filename || 'image.jpg', contentType: mimeType });
    formData.append('models', 'genai');
    formData.append('api_user', process.env.SIGHTENGINE_API_USER);
    formData.append('api_secret', process.env.SIGHTENGINE_API_SECRET);

    const res = await this.fetchWithTimeout('https://api.sightengine.com/1.0/check.json', { 
      method: 'POST', 
      body: formData 
    }, 15_000);
    
    const data = await res.json();
    
    if (data.status === 'success') {
      const score = (data.type?.ai_generated || 0) * 100;
      return { 
        aiScore: score, 
        isAi: score >= 50, 
        confidence: 85, 
        verdict: this.getVerdict(score),
        provider: 'sightengine',
        details: data
      };
    }
    
    throw new Error('Sightengine API returned error');
  }

  async analyzeVideoWithSightengine(input, mimeType, filename = 'video.mp4') {
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('media', input, { 
      filename: filename || 'video.mp4', 
      contentType: mimeType 
    });
    formData.append('models', 'genai');
    formData.append('api_user', process.env.SIGHTENGINE_API_USER);
    formData.append('api_secret', process.env.SIGHTENGINE_API_SECRET);

    const res = await this.fetchWithTimeout('https://api.sightengine.com/1.0/video/check.json', { 
      method: 'POST', 
      body: formData 
    }, 45_000);
    
    const data = await res.json();
    
    if (data.status === 'success') {
      // Pour les vidéos, Sightengine analyse plusieurs frames
      const frames = data.data?.frames || [];
      if (!frames.length) throw new Error('Sightengine video: no frames returned');
      const avgScore = frames.reduce((sum, f) => sum + (f.genai?.prob || 0), 0) / frames.length * 100;
      
      return { 
        aiScore: Math.round(avgScore * 100) / 100, 
        isAi: avgScore >= 50, 
        confidence: 80, 
        verdict: this.getVerdict(avgScore),
        provider: 'sightengine-video',
        framesAnalyzed: frames.length,
        details: data
      };
    }
    
    throw new Error('Sightengine video API returned error');
  }

  demoAnalysis(type = 'image') {
    const score = Math.random() * 100;
    return {
      aiScore: Math.round(score * 100) / 100,
      isAi: score >= 50,
      confidence: 70,
      verdict: this.getVerdict(score),
      demo: true,
      provider: `demo-${type}`
    };
  }

  getVerdict(score) {
    if (score >= 90) return { key: 'ai_generated', color: 'red' };
    if (score >= 70) return { key: 'likely_ai', color: 'orange' };
    if (score >= 50) return { key: 'possibly_ai', color: 'yellow' };
    if (score >= 30) return { key: 'possibly_real', color: 'lime' };
    return { key: 'likely_real', color: 'green' };
  }

  async fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  }
}

module.exports = new DetectionService();
