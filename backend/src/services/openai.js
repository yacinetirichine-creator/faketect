/**
 * Service OpenAI pour analyses avancées
 * Utilisé pour : analyse de texte, description d'images, recommandations
 */

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Analyse un texte pour détecter s'il est généré par IA
   */
  async analyzeText(text) {
    if (!this.apiKey) {
      return { error: 'OpenAI API key not configured', demo: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an AI text detection expert. Analyze if the given text was likely written by AI. Return a JSON with: aiProbability (0-100), indicators (array of clues), confidence (0-100).'
            },
            {
              role: 'user',
              content: `Analyze this text:\n\n${text}`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return {
        aiScore: result.aiProbability || 0,
        isAi: (result.aiProbability || 0) >= 50,
        confidence: result.confidence || 80,
        indicators: result.indicators || [],
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI text analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyse une image avec vision API pour détecter des anomalies
   */
  async analyzeImageWithVision(base64Image) {
    if (!this.apiKey) {
      return { error: 'OpenAI API key not configured', demo: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in detecting AI-generated images. Look for artifacts, inconsistencies, unnatural patterns, impossible lighting, distorted details, and other signs of AI generation.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this image for signs of AI generation. Return JSON with: aiProbability (0-100), anomalies (array), confidence (0-100), reasoning (brief explanation).'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return {
        aiScore: result.aiProbability || 0,
        isAi: (result.aiProbability || 0) >= 50,
        confidence: result.confidence || 75,
        anomalies: result.anomalies || [],
        reasoning: result.reasoning || '',
        provider: 'openai-vision'
      };
    } catch (error) {
      console.error('OpenAI vision analysis error:', error);
      throw error;
    }
  }

  /**
   * Génère une explication détaillée d'un résultat d'analyse
   */
  async explainAnalysis(analysisResult) {
    if (!this.apiKey) {
      return 'OpenAI API non configurée';
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI detection expert. Explain analysis results in simple, clear French. Be concise (max 100 words).'
            },
            {
              role: 'user',
              content: `Explain this AI detection result:\nScore: ${analysisResult.aiScore}%\nConfidence: ${analysisResult.confidence}%\nProvider: ${analysisResult.provider}`
            }
          ],
          max_tokens: 150
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI explanation error:', error);
      return 'Explication non disponible';
    }
  }
}

module.exports = new OpenAIService();
