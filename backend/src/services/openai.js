/**
 * Service AI pour analyses avancées
 * Support: OpenAI (payant) ou Google Gemini (gratuit)
 */

class AIService {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
    this.openaiUrl = 'https://api.openai.com/v1';
    this.geminiUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Vérifie si un service AI est configuré
   */
  hasAIService() {
    return !!(this.openaiKey || this.geminiKey);
  }

  /**
   * Chatbot support client multi-langue (utilise Gemini gratuit ou OpenAI)
   */
  async getChatResponse(conversationHistory, language = 'fr') {
    // Essayer Gemini d'abord (gratuit), puis OpenAI
    if (this.geminiKey) {
      return this.getChatResponseGemini(conversationHistory, language);
    }
    if (this.openaiKey) {
      return this.getChatResponseOpenAI(conversationHistory, language);
    }
    return this.getFallbackResponse(language);
  }

  /**
   * Chat avec Google Gemini (GRATUIT)
   */
  async getChatResponseGemini(conversationHistory, language = 'fr') {
    const systemPrompt = this.getSystemPrompt(language);

    try {
      // Construire le prompt pour Gemini
      const messages = conversationHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Ajouter le contexte système au premier message
      const fullPrompt = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nConversation précédente:\n${conversationHistory.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUtilisateur: ${conversationHistory[conversationHistory.length - 1]?.content || ''}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      };

      const response = await fetch(
        `${this.geminiUrl}/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPrompt)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Gemini API error:', response.status, error);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid Gemini response format');
    } catch (error) {
      console.error('Gemini chat error:', error);
      // Fallback vers OpenAI si disponible
      if (this.openaiKey) {
        return this.getChatResponseOpenAI(conversationHistory, language);
      }
      return this.getFallbackResponse(language);
    }
  }

  /**
   * Chat avec OpenAI (payant)
   */
  async getChatResponseOpenAI(conversationHistory, language = 'fr') {
    const systemPrompt = this.getSystemPrompt(language);

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ];

      const response = await fetch(`${this.openaiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
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
      console.error('OpenAI chat error:', error);
      return this.getFallbackResponse(language);
    }
  }

  /**
   * Prompts système multilingues pour le chatbot
   */
  getSystemPrompt(language) {
    const prompts = {
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
      ar: `أنت المساعد الافتراضي لـ FakeTect، منصة كشف التزييف العميق والمحتوى المُنشأ بالذكاء الاصطناعي.
تساعد المستخدمين في:
- أسئلة حول الخطط (FREE: 3 تحليلات/يوم، PRO: 50/يوم، BUSINESS: غير محدود)
- المساعدة التقنية (الصيغ المقبولة: JPG، PNG، MP4، MOV بحد أقصى 100MB)
- شرح نتائج التحليل
- مشاكل الدفع عبر Stripe
كن موجزاً (150 كلمة كحد أقصى)، محترفاً ومفيداً.
إذا لم تستطع الإجابة أو كان الأمر معقداً، أنهِ بـ [HUMAN_SUPPORT] لتنبيه المسؤول.`,
      zh: `你是FakeTect的虚拟助手，这是一个深度伪造和AI内容检测平台。
你帮助用户解决:
- 计划问题（FREE: 每天3次分析，PRO: 每天50次，BUSINESS: 无限）
- 技术帮助（支持格式: JPG、PNG、MP4、MOV 最大100MB）
- 分析结果说明
- Stripe支付问题
简洁（最多150字）、专业且有帮助。
如果无法回答或问题复杂，请以[HUMAN_SUPPORT]结尾以提醒管理员。`,
      ja: `あなたはFakeTectのバーチャルアシスタントです。ディープフェイクとAI生成コンテンツを検出するプラットフォームです。
ユーザーをサポートします:
- プランに関する質問（FREE: 1日3分析、PRO: 1日50回、BUSINESS: 無制限）
- 技術サポート（対応フォーマット: JPG、PNG、MP4、MOV 最大100MB）
- 分析結果の説明
- Stripe決済の問題
簡潔に（最大150語）、プロフェッショナルで親切に対応してください。
回答できない場合や複雑な場合は、[HUMAN_SUPPORT]で終わり、管理者に通知してください。`
    };
    return prompts[language] || prompts.fr;
  }

  /**
   * Réponse de secours multilingue
   */
  getFallbackResponse(language) {
    const fallbacks = {
      fr: "Désolé, je rencontre un problème technique. Un administrateur va vous répondre rapidement. [HUMAN_SUPPORT]",
      en: "Sorry, I'm experiencing a technical issue. An administrator will respond shortly. [HUMAN_SUPPORT]",
      es: "Lo siento, tengo un problema técnico. Un administrador responderá pronto. [HUMAN_SUPPORT]",
      de: "Entschuldigung, ich habe ein technisches Problem. Ein Administrator wird bald antworten. [HUMAN_SUPPORT]",
      it: "Scusa, ho un problema tecnico. Un amministratore risponderà presto. [HUMAN_SUPPORT]",
      pt: "Desculpe, estou com um problema técnico. Um administrador responderá em breve. [HUMAN_SUPPORT]",
      ar: "عذراً، أواجه مشكلة تقنية. سيرد عليك أحد المسؤولين قريباً. [HUMAN_SUPPORT]",
      zh: "抱歉，我遇到了技术问题。管理员将很快回复您。[HUMAN_SUPPORT]",
      ja: "申し訳ありませんが、技術的な問題が発生しています。管理者がすぐに対応いたします。[HUMAN_SUPPORT]"
    };
    return fallbacks[language] || fallbacks.fr;
  }

  /**
   * Analyse un texte pour détecter s'il est généré par IA
   */
  async analyzeText(text) {
    if (this.geminiKey) {
      return this.analyzeTextGemini(text);
    }
    if (this.openaiKey) {
      return this.analyzeTextOpenAI(text);
    }
    return { error: 'No AI API key configured', demo: true };
  }

  async analyzeTextGemini(text) {
    try {
      const response = await fetch(
        `${this.geminiUrl}/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI text detection expert. Analyze if this text was likely written by AI. Return ONLY a valid JSON object with: aiProbability (number 0-100), indicators (array of strings with clues), confidence (number 0-100).

Text to analyze:
${text}

Return only the JSON, no explanation.`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500
            }
          })
        }
      );

      if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

      const data = await response.json();
      const content = data.candidates[0]?.content?.parts?.[0]?.text || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      return {
        aiScore: result.aiProbability || 0,
        isAi: (result.aiProbability || 0) >= 50,
        confidence: result.confidence || 80,
        indicators: result.indicators || [],
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Gemini text analysis error:', error);
      throw error;
    }
  }

  async analyzeTextOpenAI(text) {
    try {
      const response = await fetch(`${this.openaiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an AI text detection expert. Analyze if the given text was likely written by AI. Return a JSON with: aiProbability (0-100), indicators (array of clues), confidence (0-100).'
            },
            { role: 'user', content: `Analyze this text:\n\n${text}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

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
   * Analyse une image avec vision API
   */
  async analyzeImageWithVision(base64Image) {
    if (!this.openaiKey) {
      return { error: 'OpenAI API key not configured for vision', demo: true };
    }

    try {
      const response = await fetch(`${this.openaiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in detecting AI-generated images.'
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
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` }
                }
              ]
            }
          ],
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) throw new Error(`OpenAI Vision API error: ${response.status}`);

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
    if (!this.openaiKey && !this.geminiKey) {
      return 'API AI non configurée';
    }

    const prompt = `Explain this AI detection result in simple terms:\nScore: ${analysisResult.aiScore}%\nConfidence: ${analysisResult.confidence}%\nProvider: ${analysisResult.provider}`;

    if (this.geminiKey) {
      try {
        const response = await fetch(
          `${this.geminiUrl}/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 150 }
            })
          }
        );
        const data = await response.json();
        return data.candidates[0]?.content?.parts?.[0]?.text || 'Explication non disponible';
      } catch (error) {
        console.error('Gemini explanation error:', error);
      }
    }

    if (this.openaiKey) {
      try {
        const response = await fetch(`${this.openaiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'Explain analysis results in simple, clear French. Be concise (max 100 words).' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 150
          })
        });
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI explanation error:', error);
      }
    }

    return 'Explication non disponible';
  }
}

module.exports = new AIService();
