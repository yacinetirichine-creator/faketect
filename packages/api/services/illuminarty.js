const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_KEY = process.env.ILLUMINARTY_API_KEY;
const API_URL = 'https://api.illuminarty.ai/v1/image/classify';

async function analyzeImage(filePath) {
  if (!API_KEY) return simulateResponse();

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const { data } = await axios.post(API_URL, form, {
      headers: { ...form.getHeaders(), 'X-API-Key': API_KEY },
      timeout: 30000
    });
    
    return {
      success: true,
      score: data.ai_generated_probability || data.score || 0,
      model: data.most_likely_model || 'unknown',
      raw: data,
      provider: 'illuminarty'
    };
  } catch (error) {
    // ✅ Log détaillé pour diagnostiquer les erreurs
    const statusCode = error.response?.status || 'unknown';
    const errorData = error.response?.data;
    console.error(`❌ Illuminarty: ${error.message} (Status: ${statusCode})`);
    if (errorData) console.error('   Error data:', errorData);
    
    // ✅ Fallback automatique si Illuminarty indisponible
    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      console.warn(`⚠️  Illuminarty API indisponible (${statusCode}), utilisation fallback`);
      return simulateResponse();
    }
    
    return { success: false, score: null, error: error.message, provider: 'illuminarty' };
  }
}

async function analyzeBuffer(buffer, filename = 'image.jpg') {
  if (!API_KEY) return simulateResponse();

  try {
    const form = new FormData();
    form.append('file', buffer, { filename });

    const { data } = await axios.post(API_URL, form, {
      headers: { ...form.getHeaders(), 'X-API-Key': API_KEY },
      timeout: 30000
    });
    
    return {
      success: true,
      score: data.ai_generated_probability || data.score || 0,
      model: data.most_likely_model || 'unknown',
      raw: data,
      provider: 'illuminarty'
    };
  } catch (error) {
    // ✅ Log détaillé pour diagnostiquer les erreurs
    const statusCode = error.response?.status || 'unknown';
    const errorData = error.response?.data;
    console.error(`❌ Illuminarty: ${error.message} (Status: ${statusCode})`);
    if (errorData) console.error('   Error data:', errorData);
    
    // ✅ Fallback automatique si Illuminarty indisponible
    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      console.warn(`⚠️  Illuminarty API indisponible (${statusCode}), utilisation fallback`);
      return simulateResponse();
    }
    
    return { success: false, score: null, error: error.message, provider: 'illuminarty' };
  }
}

async function analyzeUrl(imageUrl) {
  if (!API_KEY) return simulateResponse();

  try {
    const { data } = await axios.post(API_URL, { url: imageUrl }, {
      headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    return {
      success: true,
      score: data.ai_generated_probability || data.score || 0,
      model: data.most_likely_model || 'unknown',
      raw: data,
      provider: 'illuminarty'
    };
  } catch (error) {
    // ✅ Log détaillé pour diagnostiquer les erreurs
    const statusCode = error.response?.status || 'unknown';
    const errorData = error.response?.data;
    console.error(`❌ Illuminarty: ${error.message} (Status: ${statusCode})`);
    if (errorData) console.error('   Error data:', errorData);
    
    // ✅ Fallback automatique si Illuminarty indisponible
    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      console.warn(`⚠️  Illuminarty API indisponible (${statusCode}), utilisation fallback`);
      return simulateResponse();
    }
    
    return { success: false, score: null, error: error.message, provider: 'illuminarty' };
  }
}

function simulateResponse() {
  const score = Math.random() * 0.6 + 0.2;
  const models = ['midjourney', 'stable-diffusion', 'dall-e', 'flux', 'human'];
  return {
    success: true, score, model: models[Math.floor(Math.random() * models.length)],
    raw: { simulated: true }, provider: 'illuminarty', simulated: true
  };
}

module.exports = { analyzeImage, analyzeBuffer, analyzeUrl };
