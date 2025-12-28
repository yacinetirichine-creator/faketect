class DetectionService {
  async analyze(buffer, mimeType) {
    // Mode démo si pas d'API configurée
    if (!process.env.SIGHTENGINE_USER) {
      const score = Math.random() * 100;
      return {
        aiScore: Math.round(score * 100) / 100,
        isAi: score >= 50,
        confidence: 70,
        verdict: this.getVerdict(score),
        demo: true
      };
    }
    
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('media', buffer, { filename: 'image.jpg', contentType: mimeType });
      formData.append('models', 'genai');
      formData.append('api_user', process.env.SIGHTENGINE_USER);
      formData.append('api_secret', process.env.SIGHTENGINE_SECRET);

      const res = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.status === 'success') {
        const score = (data.type?.ai_generated || 0) * 100;
        return { aiScore: score, isAi: score >= 50, confidence: 85, verdict: this.getVerdict(score) };
      }
    } catch (e) { console.error('API error:', e); }
    
    const score = Math.random() * 100;
    return { aiScore: score, isAi: score >= 50, confidence: 70, verdict: this.getVerdict(score), demo: true };
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
