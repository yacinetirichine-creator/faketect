const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_USER = process.env.SIGHTENGINE_USER;
const API_SECRET = process.env.SIGHTENGINE_SECRET;
const API_URL = 'https://api.sightengine.com/1.0/check.json';

async function analyzeImage(filePath) {
  if (!API_USER || !API_SECRET) return simulateResponse();

  try {
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));
    form.append('models', 'genai');
    form.append('api_user', API_USER);
    form.append('api_secret', API_SECRET);

    const { data } = await axios.post(API_URL, form, { headers: form.getHeaders(), timeout: 30000 });
    return { success: true, score: data.type?.ai_generated || 0, raw: data, provider: 'sightengine' };
  } catch (error) {
    console.error('❌ Sightengine:', error.message);
    return { success: false, score: null, error: error.message, provider: 'sightengine' };
  }
}

async function analyzeBuffer(buffer, filename = 'image.jpg') {
  if (!API_USER || !API_SECRET) return simulateResponse();

  try {
    const form = new FormData();
    form.append('media', buffer, { filename });
    form.append('models', 'genai');
    form.append('api_user', API_USER);
    form.append('api_secret', API_SECRET);

    const { data } = await axios.post(API_URL, form, { headers: form.getHeaders(), timeout: 30000 });
    return { success: true, score: data.type?.ai_generated || 0, raw: data, provider: 'sightengine' };
  } catch (error) {
    return { success: false, score: null, error: error.message, provider: 'sightengine' };
  }
}

async function analyzeUrl(imageUrl) {
  if (!API_USER || !API_SECRET) return simulateResponse();

  try {
    const { data } = await axios.get(API_URL, {
      params: { url: imageUrl, models: 'genai', api_user: API_USER, api_secret: API_SECRET },
      timeout: 30000
    });
    return { success: true, score: data.type?.ai_generated || 0, raw: data, provider: 'sightengine' };
  } catch (error) {
    return { success: false, score: null, error: error.message, provider: 'sightengine' };
  }
}

function simulateResponse() {
  const score = Math.random() * 0.6 + 0.2;
  return { success: true, score, raw: { simulated: true }, provider: 'sightengine', simulated: true };
}

module.exports = { analyzeImage, analyzeBuffer, analyzeUrl };
