class DetectionService {
  async analyze(buffer, mimeType) {
    // Priorité 1: Illuminarty API
    if (process.env.ILLUMINARTY_USER && process.env.ILLUMINARTY_SECRET) {
      try {
        return await this.analyzeWithIlluminarty(buffer, mimeType);
      } catch (e) {
        console.error('Illuminarty API error:', e);
        // Fallback vers Sightengine ou démo
      }
    }
    
    // Priorité 2: Sightengine API
    if (process.env.SIGHTENGINE_USER && process.env.SIGHTENGINE_SECRET) {
      try {
        return await this.analyzeWithSightengine(buffer, mimeType);
      } catch (e) {
        console.error('Sightengine API error:', e);
      }
    }
    
    // Mode démo si pas d'API configurée
    const score = Math.random() * 100;
    return {
      aiScore: Math.round(score * 100) / 100,
      isAi: score >= 50,
      confidence: 70,
      verdict: this.getVerdict(score),
      demo: true,
      provider: 'demo'
    };
  }

  async analyzeWithIlluminarty(buffer, mimeType) {
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('image', buffer, { 
      filename: 'image.jpg', 
      contentType: mimeType 
    });
    formData.append('api_user', process.env.ILLUMINARTY_USER);
    formData.append('api_secret', process.env.ILLUMINARTY_SECRET);

    const res = await fetch('https://api.illuminarty.ai/v1/analyze', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.ILLUMINARTY_API_KEY
      },
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Illuminarty API error: ${res.status}`);
    }

    const data = await res.json();
    
    // Adapter la réponse Illuminarty
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

  async analyzeWithSightengine(buffer, mimeType) {
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('media', buffer, { filename: 'image.jpg', contentType: mimeType });
    formData.append('models', 'genai');
    formData.append('api_user', process.env.SIGHTENGINE_USER);
    formData.append('api_secret', process.env.SIGHTENGINE_SECRET);

    const res = await fetch('https://api.sightengine.com/1.0/check.json', { 
      method: 'POST', 
      body: formData 
    });
    
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

  getVerdict(score) {
    if (score >= 90) return { key: 'ai_generated', color: 'red' };
    if (score >= 70) return { key: 'likely_ai', color: 'orange' };
    if (score >= 50) return { key: 'possibly_ai', color: 'yellow' };
    if (score >= 30) return { key: 'possibly_real', color: 'lime' };
    return { key: 'likely_real', color: 'green' };
  }
}

module.exports = new DetectionService();
