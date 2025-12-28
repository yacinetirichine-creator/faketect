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

  /**
   * Chatbot support client multi-langue
   */
  async getChatResponse(conversationHistory, language = 'fr') {
    if (!this.apiKey) {
      return this.getFallbackResponse(language);
    }

    const systemPrompts = {
      fr: `Tu es l'assistant virtuel de FakeTect, plateforme de détection de deepfakes et contenus IA.
Tu aides les utilisateurs avec:
- Questions sur les plans (FREE: 3 analyses/jour, PRO: 50/jour, BUSINESS: illimité)
- Aide technique (formats acceptés: JPG, PNG, MP4, MOV max 100MB)
- Explications des résultats d'analyse
- Problèmes de paiement Stripe
Sois concis (max 150 mots), professionnel et utile.
Si tu ne peux pas répondre ou si c'est complexe, termine par [HUMAN_SUPPORT] pour alerter un admin.`,
      en: `You are FakeTect's virtual assistant, a deepfake and AI content detection platform.
You help users with:
- Plan questions (FREE: 3 analyses/day, PRO: 50/day, BUSINESS: unlimited)
- Technical help (accepted formats: JPG, PNG, MP4, MOV max 100MB)
- Analysis results explanations
- Stripe payment issues
Be concise (max 150 words), professional and helpful.
If you can't answer or it's complex, end with [HUMAN_SUPPORT] to alert an admin.`,
      es: `Eres el asistente virtual de FakeTect, plataforma de detección de deepfakes y contenido IA.
Ayudas a los usuarios con:
- Preguntas sobre planes (FREE: 3 análisis/día, PRO: 50/día, BUSINESS: ilimitado)
- Ayuda técnica (formatos aceptados: JPG, PNG, MP4, MOV máx 100MB)
- Explicaciones de resultados de análisis
- Problemas de pago Stripe
Sé conciso (máx 150 palabras), profesional y útil.
Si no puedes responder o es complejo, termina con [HUMAN_SUPPORT] para alertar a un admin.`,
      de: `Du bist der virtuelle Assistent von FakeTect, einer Plattform zur Erkennung von Deepfakes und KI-Inhalten.
Du hilfst Benutzern mit:
- Fragen zu Plänen (FREE: 3 Analysen/Tag, PRO: 50/Tag, BUSINESS: unbegrenzt)
- Technische Hilfe (akzeptierte Formate: JPG, PNG, MP4, MOV max 100MB)
- Erklärungen zu Analyseergebnissen
- Stripe-Zahlungsproblemen
Sei prägnant (max 150 Wörter), professionell und hilfreich.
Wenn du nicht antworten kannst oder es komplex ist, ende mit [HUMAN_SUPPORT], um einen Admin zu alarmieren.`,
      it: `Sei l'assistente virtuale di FakeTect, piattaforma di rilevamento deepfake e contenuti IA.
Aiuti gli utenti con:
- Domande sui piani (FREE: 3 analisi/giorno, PRO: 50/giorno, BUSINESS: illimitato)
- Aiuto tecnico (formati accettati: JPG, PNG, MP4, MOV max 100MB)
- Spiegazioni dei risultati di analisi
- Problemi di pagamento Stripe
Sii conciso (max 150 parole), professionale e utile.
Se non puoi rispondere o è complesso, termina con [HUMAN_SUPPORT] per allertare un admin.`,
      pt: `Você é o assistente virtual da FakeTect, plataforma de detecção de deepfakes e conteúdo IA.
Você ajuda os usuários com:
- Perguntas sobre planos (FREE: 3 análises/dia, PRO: 50/dia, BUSINESS: ilimitado)
- Ajuda técnica (formatos aceitos: JPG, PNG, MP4, MOV max 100MB)
- Explicações de resultados de análise
- Problemas de pagamento Stripe
Seja conciso (max 150 palavras), profissional e útil.
Se não puder responder ou for complexo, termine com [HUMAN_SUPPORT] para alertar um admin.`
    };

    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompts[language] || systemPrompts.fr
        },
        ...conversationHistory
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 250,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Chatbot error:', error);
      return this.getFallbackResponse(language);
    }
  }

  getFallbackResponse(language) {
    const fallbacks = {
      fr: "Désolé, je rencontre un problème technique. Un administrateur va vous répondre rapidement. [HUMAN_SUPPORT]",
      en: "Sorry, I'm experiencing a technical issue. An administrator will respond shortly. [HUMAN_SUPPORT]",
      es: "Lo siento, tengo un problema técnico. Un administrador responderá pronto. [HUMAN_SUPPORT]",
      de: "Entschuldigung, ich habe ein technisches Problem. Ein Administrator wird bald antworten. [HUMAN_SUPPORT]",
      it: "Scusa, ho un problema tecnico. Un amministratore risponderà presto. [HUMAN_SUPPORT]",
      pt: "Desculpe, estou com um problema técnico. Um administrador responderá em breve. [HUMAN_SUPPORT]"
    };
    return fallbacks[language] || fallbacks.fr;
  }
}

module.exports = new OpenAIService();
