/**
 * Service OpenAI pour analyses avancées
 * Utilisé pour : analyse de texte, description d'images, recommandations
 */

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
    this.hasApiKey = Boolean(this.apiKey && this.apiKey.length > 0);
    this.hasFetch = typeof globalThis.fetch === 'function';
    this.canCallApi = this.hasApiKey && this.hasFetch;

    if (!this.hasApiKey) {
      console.warn('⚠️  OpenAI API non configurée - Mode fallback activé pour le chatbot');
    } else if (!this.hasFetch) {
      console.warn('⚠️  fetch() non disponible (Node < 18 ?) - Mode fallback activé pour le chatbot');
    }
  }

  _normalizeLanguage(language) {
    if (!language || typeof language !== 'string') return 'fr';
    const base = language.toLowerCase().trim().split(/[-_]/)[0];
    const supported = new Set(['fr', 'en', 'es', 'de', 'it', 'pt']);
    return supported.has(base) ? base : 'fr';
  }

  _detectRequestedLanguage(message) {
    if (!message || typeof message !== 'string') return null;
    const m = message.toLowerCase();

    if (/(en\s+anglais|in\s+english|\benglish\b)/i.test(m)) return 'en';
    if (/(en\s+fran[cç]ais|in\s+french|\bfrench\b|\bfran[cç]ais\b)/i.test(m)) return 'fr';
    if (/(en\s+espagnol|in\s+spanish|\bspanish\b|espa[nñ]ol)/i.test(m)) return 'es';
    if (/(en\s+allemand|in\s+german|\bgerman\b|\bdeutsch\b)/i.test(m)) return 'de';
    if (/(en\s+italien|in\s+italian|\bitalian\b|\bitaliano\b)/i.test(m)) return 'it';
    if (/(en\s+portugais|in\s+portuguese|\bportuguese\b|\bportugu[eê]s\b)/i.test(m)) return 'pt';

    return null;
  }

  _sanitizeOpenAiErrorBody(text) {
    if (!text) {
      return undefined;
    }
    // Évite de logguer des payloads trop volumineux
    return text.length > 2000 ? text.slice(0, 2000) + '…' : text;
  }

  _shouldEscalateToHuman(message) {
    const m = (message || '').toLowerCase();
    return /(paiement|payment|stripe|rembours|refund|factur|billing|cb\b|carte|urgent|arnaque|fraude|chargeback|bug|erreur|error|crash|compte|account|connexion|login|mot de passe|password)/i.test(m);
  }

  /**
   * Analyse un texte pour détecter s'il est généré par IA
   */
  async analyzeText(text) {
    if (!this.apiKey || typeof globalThis.fetch !== 'function') {
      return { error: 'OpenAI API key not configured', demo: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an AI text detection expert. Analyze if the given text was likely written by AI. Return a JSON with: aiProbability (0-100), indicators (array of clues), confidence (0-100).',
            },
            {
              role: 'user',
              content: `Analyze this text:\n\n${text}`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
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
        provider: 'openai',
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
    if (!this.apiKey || typeof globalThis.fetch !== 'function') {
      return { error: 'OpenAI API key not configured', demo: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in detecting AI-generated images. Look for artifacts, inconsistencies, unnatural patterns, impossible lighting, distorted details, and other signs of AI generation.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this image for signs of AI generation. Return JSON with: aiProbability (0-100), anomalies (array), confidence (0-100), reasoning (brief explanation).',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
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
        provider: 'openai-vision',
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
    if (!this.apiKey || typeof globalThis.fetch !== 'function') {
      return 'OpenAI API non configurée';
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI detection expert. Explain analysis results in simple, clear French. Be concise (max 100 words).',
            },
            {
              role: 'user',
              content: `Explain this AI detection result:\nScore: ${analysisResult.aiScore}%\nConfidence: ${analysisResult.confidence}%\nProvider: ${analysisResult.provider}`,
            },
          ],
          max_tokens: 150,
        }),
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
  chatWithUser(conversationHistory, language = 'fr') {
    return this.getChatResponse(conversationHistory, language);
  }

  async getChatResponse(conversationHistory, language = 'fr') {
    const normalizedLanguage = this._normalizeLanguage(language);

    // Mode fallback intelligent si pas de clé API ou runtime incompatible
    if (!this.canCallApi) {
      return this.getSmartFallbackResponse(conversationHistory, normalizedLanguage);
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
Se não puder responder ou for complexo, termine com [HUMAN_SUPPORT] para alertar um admin.`,
    };

    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompts[normalizedLanguage] || systemPrompts.fr,
        },
        ...conversationHistory,
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 250,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => undefined);
        const sanitized = this._sanitizeOpenAiErrorBody(errorText);

        // Si la clé est invalide/interdite, désactiver OpenAI pour éviter de spammer l'API
        if (response.status === 401 || response.status === 403) {
          this.canCallApi = false;
        }

        const err = new Error(`OpenAI API error: ${response.status}`);
        err.status = response.status;
        err.body = sanitized;
        throw err;
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      // Ne pas bloquer le chatbot si OpenAI est en erreur: fallback intelligent
      console.error('Chatbot error:', {
        message: error?.message,
        status: error?.status,
        body: error?.body,
      });

      const lastUserMessage = conversationHistory?.[conversationHistory.length - 1]?.content;
      const requested = this._detectRequestedLanguage(lastUserMessage);
      const fallbackLanguage = requested || normalizedLanguage;
      const smart = this.getSmartFallbackResponse(conversationHistory, fallbackLanguage);

      // Si c'est un sujet sensible/complexe (paiement/compte/bug), on peut demander un humain
      if (this._shouldEscalateToHuman(lastUserMessage) && !smart.includes('[HUMAN_SUPPORT]')) {
        return smart + ' [HUMAN_SUPPORT]';
      }

      return smart;
    }
  }

  getFallbackResponse(language) {
    const fallbacks = {
      fr: "Je peux vous aider avec les plans, les formats supportés, ou des questions techniques. Que souhaitez-vous savoir ?",
      en: "I can help with plans, supported formats, or technical questions. What would you like to know?",
      es: "Puedo ayudarte con planes, formatos compatibles o preguntas técnicas. ¿Qué te gustaría saber?",
      de: "Ich kann bei Plänen, unterstützten Formaten oder technischen Fragen helfen. Was möchten Sie wissen?",
      it: "Posso aiutarti con piani, formati supportati o domande tecniche. Cosa vorresti sapere?",
      pt: "Posso ajudar com planos, formatos suportados ou questões técnicas. O que você gostaria de saber?",
    };
    return fallbacks[language] || fallbacks.fr;
  }

  /**
   * Mode fallback intelligent basé sur des mots-clés (sans OpenAI)
   */
  getSmartFallbackResponse(conversationHistory, language = 'fr') {
    const normalizedLanguage = this._normalizeLanguage(language);
    const lastMessageRaw = conversationHistory[conversationHistory.length - 1]?.content || '';
    const lastMessage = lastMessageRaw.toLowerCase();

    const responses = {
      fr: {
        plans: "FakeTect propose 3 plans : FREE (3 analyses/jour gratuites), PRO (50/jour à 9.99€/mois), et BUSINESS (illimité à 49.99€/mois). Besoin d'aide pour choisir ?",
        formats: "Nous acceptons les formats JPG, PNG, MP4 et MOV jusqu'à 100MB. Pour de meilleurs résultats, utilisez des fichiers de bonne qualité.",
        price: "Nos tarifs : FREE (gratuit, 3 analyses/jour), PRO (9.99€/mois, 50 analyses/jour), BUSINESS (49.99€/mois, analyses illimitées).",
        help: "Je peux vous aider avec : vos analyses, les plans tarifaires, les formats acceptés, les problèmes techniques. Que souhaitez-vous savoir ?",
        default: "Merci pour votre message. Je peux vous aider avec les plans, les formats supportés ou des questions techniques. Que souhaitez-vous savoir ?",
      },
      en: {
        plans: "FakeTect offers 3 plans: FREE (3 analyses/day free), PRO (50/day at €9.99/month), and BUSINESS (unlimited at €49.99/month). Need help choosing?",
        formats: "We accept JPG, PNG, MP4, and MOV formats up to 100MB. For best results, use high-quality files.",
        price: "Our pricing: FREE (free, 3 analyses/day), PRO (€9.99/month, 50 analyses/day), BUSINESS (€49.99/month, unlimited analyses).",
        help: "I can help you with: your analyses, pricing plans, accepted formats, technical issues. What would you like to know?",
        default: "Thank you for your message. I can help with plans, supported formats or technical questions. What would you like to know?",
      },
      es: {
        plans: "FakeTect ofrece 3 planes: FREE (3 análisis/día gratis), PRO (50/día por 9.99€/mes), y BUSINESS (ilimitado por 49.99€/mes). ¿Necesitas ayuda para elegir?",
        formats: "Aceptamos formatos JPG, PNG, MP4 y MOV hasta 100MB. Para mejores resultados, usa archivos de buena calidad.",
        price: "Nuestras tarifas: FREE (gratis, 3 análisis/día), PRO (9.99€/mes, 50 análisis/día), BUSINESS (49.99€/mes, análisis ilimitados).",
        help: "Puedo ayudarte con: tus análisis, planes de precios, formatos aceptados, problemas técnicos. ¿Qué te gustaría saber?",
        default: "Gracias por tu mensaje. Puedo ayudar con planes, formatos soportados o preguntas técnicas. ¿Qué te gustaría saber?",
      },
      de: {
        plans: "FakeTect bietet 3 Pläne: FREE (3 Analysen/Tag kostenlos), PRO (50/Tag für 9,99€/Monat) und BUSINESS (unbegrenzt für 49,99€/Monat). Brauchen Sie Hilfe bei der Auswahl?",
        formats: "Wir akzeptieren JPG, PNG, MP4 und MOV Formate bis 100MB. Für beste Ergebnisse verwenden Sie qualitativ hochwertige Dateien.",
        price: "Unsere Preise: FREE (kostenlos, 3 Analysen/Tag), PRO (9,99€/Monat, 50 Analysen/Tag), BUSINESS (49,99€/Monat, unbegrenzte Analysen).",
        help: "Ich kann Ihnen helfen mit: Ihren Analysen, Preisplänen, akzeptierten Formaten, technischen Problemen. Was möchten Sie wissen?",
        default: "Danke für Ihre Nachricht. Ich kann bei Plänen, unterstützten Formaten oder technischen Fragen helfen. Was möchten Sie wissen?",
      },
      it: {
        plans: "FakeTect offre 3 piani: FREE (3 analisi/giorno gratis), PRO (50/giorno a 9,99€/mese) e BUSINESS (illimitato a 49,99€/mese). Serve aiuto per scegliere?",
        formats: "Accettiamo formati JPG, PNG, MP4 e MOV fino a 100MB. Per risultati migliori, usa file di buona qualità.",
        price: "Le nostre tariffe: FREE (gratis, 3 analisi/giorno), PRO (9,99€/mese, 50 analisi/giorno), BUSINESS (49,99€/mese, analisi illimitate).",
        help: "Posso aiutarti con: le tue analisi, i piani tariffari, i formati accettati, problemi tecnici. Cosa vorresti sapere?",
        default: "Grazie per il tuo messaggio. Posso aiutare con i piani, i formati supportati o domande tecniche. Cosa vorresti sapere?",
      },
      pt: {
        plans: "FakeTect oferece 3 planos: FREE (3 análises/dia grátis), PRO (50/dia por €9,99/mês) e BUSINESS (ilimitado por €49,99/mês). Precisa de ajuda para escolher?",
        formats: "Aceitamos formatos JPG, PNG, MP4 e MOV até 100MB. Para melhores resultados, use arquivos de boa qualidade.",
        price: "Nossos preços: FREE (grátis, 3 análises/dia), PRO (€9,99/mês, 50 análises/dia), BUSINESS (€49,99/mês, análises ilimitadas).",
        help: "Posso ajudá-lo com: suas análises, planos de preços, formatos aceitos, problemas técnicos. O que gostaria de saber?",
        default: "Obrigado pela sua mensagem. Posso ajudar com planos, formatos suportados ou questões técnicas. O que você gostaria de saber?",
      },
    };

    const langResponses = responses[normalizedLanguage] || responses.fr;

    // Changement explicite de langue
    const requested = this._detectRequestedLanguage(lastMessageRaw);
    if (requested) {
      const requestedResponses = responses[requested] || responses.fr;
      return requestedResponses.help;
    }

    // Détection de mots-clés
    if (/(plan|price|pricing|tarif|precio|preis|prezzo|preço|abonnement|subscription)/i.test(lastMessage)) {
      return langResponses.plans;
    }
    if (/(format|file|fichier|archivo|datei|video|image|photo)/i.test(lastMessage)) {
      return langResponses.formats;
    }
    if (/(cost|coût|costo|kosten|custo|combien|how much|quanto)/i.test(lastMessage)) {
      return langResponses.price;
    }
    if (/(help|aide|ayuda|hilfe|aiuto|ajuda|bonjour|hello|hola)/i.test(lastMessage)) {
      return langResponses.help;
    }

    return langResponses.default;
  }
}

module.exports = new OpenAIService();
