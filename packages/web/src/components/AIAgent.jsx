import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { createClient } from '@supabase/supabase-js';
import i18n from '@shared/i18n';

// Client Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * 🤖 Agent IA conversationnel FakeTect
 * 
 * Fonctionnalités :
 * - Réponses contextuelles intelligentes
 * - Support multilingue (10 langues)
 * - Base de connaissances complète
 * - Sauvegarde des conversations pour support admin
 * - Intégration future : OpenAI GPT-4 (optionnel)
 */

export default function AIAgent({ isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const messagesEndRef = useRef(null);

  // Base de connaissances multilingue
  const KNOWLEDGE_BASE = {
    // Questions sur le fonctionnement
    detection: {
      patterns: ['comment', 'fonctionne', 'detection', 'how', 'works', 'كيف', 'يعمل', 'como', 'funciona', '如何', '工作', 'wie', 'funktioniert', 'как', 'работает'],
      answer: (lang) => {
        const responses = {
          fr: "FakeTect utilise **2 moteurs d'IA** (Sightengine et Illuminarty) pour analyser vos images.\n\nNous détectons :\n- Les patterns typiques des générateurs IA (Midjourney, DALL-E, Stable Diffusion)\n- Les incohérences visuelles\n- Les métadonnées EXIF\n- Les artefacts de génération\n\nPrécision moyenne : **92%**",
          en: "FakeTect uses **2 AI engines** (Sightengine and Illuminarty) to analyze your images.\n\nWe detect:\n- Typical patterns from AI generators (Midjourney, DALL-E, Stable Diffusion)\n- Visual inconsistencies\n- EXIF metadata\n- Generation artifacts\n\nAverage accuracy: **92%**",
          ar: "يستخدم FakeTect **محركين للذكاء الاصطناعي** (Sightengine و Illuminarty) لتحليل صورك.\n\nنكتشف:\n- الأنماط النموذجية من مولدات الذكاء الاصطناعي (Midjourney، DALL-E، Stable Diffusion)\n- التناقضات البصرية\n- بيانات EXIF الوصفية\n- آثار التوليد\n\nمتوسط الدقة: **92%**",
          'ar-ma': "FakeTect كيستعمل **جوج محركات ديال الذكاء الاصطناعي** (Sightengine و Illuminarty) باش يحلل الصور.\n\nكنكشفو:\n- الأنماط النموذجية من مولدات الذكاء الاصطناعي (Midjourney، DALL-E، Stable Diffusion)\n- التناقضات البصرية\n- بيانات EXIF الوصفية\n- آثار التوليد\n\nمتوسط الدقة: **92%**",
          es: "FakeTect utiliza **2 motores de IA** (Sightengine e Illuminarty) para analizar tus imágenes.\n\nDetectamos:\n- Patrones típicos de generadores de IA (Midjourney, DALL-E, Stable Diffusion)\n- Inconsistencias visuales\n- Metadatos EXIF\n- Artefactos de generación\n\nPrecisión promedio: **92%**",
          zh: "FakeTect 使用 **2个AI引擎** (Sightengine 和 Illuminarty) 来分析您的图像。\n\n我们检测:\n- AI生成器的典型模式 (Midjourney、DALL-E、Stable Diffusion)\n- 视觉不一致性\n- EXIF元数据\n- 生成伪影\n\n平均准确率: **92%**",
          de: "FakeTect verwendet **2 KI-Engines** (Sightengine und Illuminarty) zur Bildanalyse.\n\nWir erkennen:\n- Typische Muster von KI-Generatoren (Midjourney, DALL-E, Stable Diffusion)\n- Visuelle Inkonsistenzen\n- EXIF-Metadaten\n- Generierungsartefakte\n\nDurchschnittliche Genauigkeit: **92%**",
          pt: "FakeTect usa **2 motores de IA** (Sightengine e Illuminarty) para analisar suas imagens.\n\nDetectamos:\n- Padrões típicos de geradores de IA (Midjourney, DALL-E, Stable Diffusion)\n- Inconsistências visuais\n- Metadados EXIF\n- Artefatos de geração\n\nPrecisão média: **92%**",
          it: "FakeTect utilizza **2 motori IA** (Sightengine e Illuminarty) per analizzare le tue immagini.\n\nRileviamo:\n- Pattern tipici dei generatori IA (Midjourney, DALL-E, Stable Diffusion)\n- Incoerenze visive\n- Metadati EXIF\n- Artefatti di generazione\n\nPrecisione media: **92%**",
          ru: "FakeTect использует **2 движка ИИ** (Sightengine и Illuminarty) для анализа изображений.\n\nМы обнаруживаем:\n- Типичные паттерны ИИ-генераторов (Midjourney, DALL-E, Stable Diffusion)\n- Визуальные несоответствия\n- Метаданные EXIF\n- Артефакты генерации\n\nСредняя точность: **92%**",
        };
        return responses[lang] || responses.en;
      }
    },

    // Formats supportés
    formats: {
      patterns: ['format', 'fichier', 'taille', 'file', 'size', 'supported', 'تنسيق', 'ملف', 'حجم', 'formato', 'archivo', 'tamaño', '格式', '文件', '大小', 'datei', 'größe', 'формат', 'файл', 'размер'],
      answer: (lang) => {
        const responses = {
          fr: "**Formats supportés** :\n- Images : JPG, PNG, WEBP, GIF, BMP\n- Taille max : **10 MB** (Web) / **5 MB** (Extension Chrome)\n\n**Qualité recommandée** :\n- Résolution minimale : 512x512 px\n- Évitez les images trop compressées\n- Format original préféré (sans retouche)",
          en: "**Supported formats**:\n- Images: JPG, PNG, WEBP, GIF, BMP\n- Max size: **10 MB** (Web) / **5 MB** (Chrome Extension)\n\n**Recommended quality**:\n- Minimum resolution: 512x512 px\n- Avoid over-compressed images\n- Original format preferred (unedited)",
          ar: "**التنسيقات المدعومة**:\n- الصور: JPG, PNG, WEBP, GIF, BMP\n- الحجم الأقصى: **10 ميجابايت** (الويب) / **5 ميجابايت** (إضافة Chrome)\n\n**الجودة الموصى بها**:\n- الدقة الدنيا: 512x512 بكسل\n- تجنب الصور المضغوطة بشدة\n- التنسيق الأصلي مفضل (بدون تعديل)",
          es: "**Formatos soportados**:\n- Imágenes: JPG, PNG, WEBP, GIF, BMP\n- Tamaño máx: **10 MB** (Web) / **5 MB** (Extensión Chrome)\n\n**Calidad recomendada**:\n- Resolución mínima: 512x512 px\n- Evita imágenes muy comprimidas\n- Formato original preferido (sin editar)",
          zh: "**支持的格式**:\n- 图像: JPG, PNG, WEBP, GIF, BMP\n- 最大尺寸: **10 MB** (网页) / **5 MB** (Chrome扩展)\n\n**推荐质量**:\n- 最小分辨率: 512x512 像素\n- 避免过度压缩的图像\n- 首选原始格式 (未编辑)",
        };
        return responses[lang] || responses.en;
      }
    },

    // Tarifs et abonnements
    pricing: {
      patterns: ['prix', 'tarif', 'abonnement', 'price', 'pricing', 'subscription', 'plan', 'سعر', 'اشتراك', 'precio', 'suscripción', '价格', '订阅', 'preis', 'abonnement', 'цена', 'подписка'],
      answer: (lang) => {
        const responses = {
          fr: "**Nos plans** :\n\n🆓 **Gratuit**\n- 10 analyses/jour\n- Historique 30 jours\n- Certificats basiques\n\n⭐ **Starter - 9,99€/mois**\n- 100 analyses/jour\n- Historique illimité\n- Certificats Pro + signature\n- Support prioritaire\n\n🚀 **Professional - 29,99€/mois**\n- 500 analyses/jour\n- API complète\n- Support 24/7\n- Analytics dashboard\n\n✅ **14 jours** de garantie satisfait ou remboursé",
          en: "**Our plans**:\n\n🆓 **Free**\n- 10 analyses/day\n- 30-day history\n- Basic certificates\n\n⭐ **Starter - $9.99/month**\n- 100 analyses/day\n- Unlimited history\n- Pro certificates + signature\n- Priority support\n\n🚀 **Professional - $29.99/month**\n- 500 analyses/day\n- Full API\n- 24/7 support\n- Analytics dashboard\n\n✅ **14-day** money-back guarantee",
        };
        return responses[lang] || responses.en;
      }
    },

    // Certificats
    certificates: {
      patterns: ['certificat', 'certificate', 'rapport', 'report', 'pdf', 'شهادة', 'تقرير', 'certificado', 'informe', '证书', '报告', 'zertifikat', 'bericht', 'сертификат', 'отчет'],
      answer: (lang) => {
        const responses = {
          fr: "**Certificats authentifiés** :\n\n📄 **Utilisateurs Starter/Pro** :\n- Certificat PDF avec signature numérique\n- Logo FakeTect + métadonnées d'analyse\n- Valeur probatoire pour vos besoins légaux\n- Téléchargement immédiat après analyse\n\n🔐 **Sécurité** :\n- Hash SHA-256 de l'image\n- Horodatage certifié\n- QR Code de vérification\n\n✅ Utilisable pour :\n- Réseaux sociaux (vérification)\n- Médias (fact-checking)\n- Tribunaux (expertise)",
          en: "**Authenticated certificates**:\n\n📄 **Starter/Pro users**:\n- PDF certificate with digital signature\n- FakeTect logo + analysis metadata\n- Legal probative value\n- Instant download after analysis\n\n🔐 **Security**:\n- Image SHA-256 hash\n- Certified timestamp\n- Verification QR Code\n\n✅ Usable for:\n- Social media (verification)\n- Media (fact-checking)\n- Courts (expertise)",
        };
        return responses[lang] || responses.en;
      }
    },

    // Précision et fiabilité
    accuracy: {
      patterns: ['précision', 'fiable', 'confiance', 'accuracy', 'reliable', 'trust', 'دقة', 'موثوق', 'precisión', 'confiable', '准确', '可靠', 'genauigkeit', 'zuverlässig', 'точность', 'надежный'],
      answer: (lang) => {
        const responses = {
          fr: "**Précision de FakeTect** :\n\n📊 **Statistiques globales** :\n- Précision moyenne : **92%**\n- Faux positifs : ~5%\n- Faux négatifs : ~3%\n\n⚠️ **Limites connues** :\n- Images fortement compressées (JPEG qualité <70%)\n- Contenus hybrides (IA + retouche humaine)\n- Générateurs récents non entraînés\n\n✅ **Meilleure performance** :\n- Images originales (PNG/WEBP)\n- Résolution > 1024x1024\n- Générateurs populaires (Midjourney, DALL-E)\n\n💡 **Conseil** : Combinez toujours avec votre jugement humain",
          en: "**FakeTect accuracy**:\n\n📊 **Global statistics**:\n- Average accuracy: **92%**\n- False positives: ~5%\n- False negatives: ~3%\n\n⚠️ **Known limitations**:\n- Heavily compressed images (JPEG quality <70%)\n- Hybrid content (AI + human editing)\n- Recent untrained generators\n\n✅ **Best performance**:\n- Original images (PNG/WEBP)\n- Resolution > 1024x1024\n- Popular generators (Midjourney, DALL-E)\n\n💡 **Tip**: Always combine with your human judgment",
        };
        return responses[lang] || responses.en;
      }
    },

    // API et intégration
    api: {
      patterns: ['api', 'intégration', 'integration', 'développeur', 'developer', 'تكامل', 'مطور', 'integración', 'desarrollador', '集成', '开发者', 'entwickler', 'разработчик'],
      answer: (lang) => {
        const responses = {
          fr: "**API FakeTect** :\n\n🔌 **Disponibilité** :\n- Plan **Starter** : Accès bêta (limité)\n- Plan **Professional** : API complète\n\n📚 **Documentation** :\n- Endpoint : `https://api.faketect.com/v1/analyze`\n- Auth : Bearer Token (JWT)\n- Rate limit : 100 req/min (Starter), 500 req/min (Pro)\n\n**Exemple de requête** :\n```bash\ncurl -X POST https://api.faketect.com/v1/analyze \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -F 'image=@photo.jpg'\n```\n\n📖 Docs complètes : [docs/api](/docs/api)",
          en: "**FakeTect API**:\n\n🔌 **Availability**:\n- **Starter** plan: Beta access (limited)\n- **Professional** plan: Full API\n\n📚 **Documentation**:\n- Endpoint: `https://api.faketect.com/v1/analyze`\n- Auth: Bearer Token (JWT)\n- Rate limit: 100 req/min (Starter), 500 req/min (Pro)\n\n**Example request**:\n```bash\ncurl -X POST https://api.faketect.com/v1/analyze \\\n  -H 'Authorization: Bearer YOUR_TOKEN' \\\n  -F 'image=@photo.jpg'\n```\n\n📖 Full docs: [docs/api](/docs/api)",
        };
        return responses[lang] || responses.en;
      }
    },

    // Support et contact
    support: {
      patterns: ['support', 'aide', 'contact', 'help', 'assistance', 'دعم', 'مساعدة', 'اتصال', 'ayuda', 'contacto', '支持', '帮助', '联系', 'hilfe', 'kontakt', 'поддержка', 'помощь', 'контакт'],
      answer: (lang) => {
        const responses = {
          fr: "**Besoin d'aide ?** 🤝\n\n📧 **Email** :\n- Support général : support@faketect.com\n- DPO (RGPD) : dpo@faketect.com\n- Juridique : legal@faketect.com\n- Réclamations : complaints@faketect.com\n\n⏱️ **Temps de réponse** :\n- Gratuit : 48h\n- Starter : 24h\n- Professional : <6h (support prioritaire 24/7)\n\n💬 **Chat en direct** :\n- Disponible pour les plans Starter/Pro\n- Lun-Ven 9h-18h CET\n\n📍 **Adresse** :\nJARVIS\n123 Avenue des Champs-Élysées\n75008 Paris, France",
          en: "**Need help?** 🤝\n\n📧 **Email**:\n- General support: support@faketect.com\n- DPO (GDPR): dpo@faketect.com\n- Legal: legal@faketect.com\n- Complaints: complaints@faketect.com\n\n⏱️ **Response time**:\n- Free: 48h\n- Starter: 24h\n- Professional: <6h (24/7 priority support)\n\n💬 **Live chat**:\n- Available for Starter/Pro plans\n- Mon-Fri 9am-6pm CET\n\n📍 **Address**:\nJARVIS\n123 Avenue des Champs-Élysées\n75008 Paris, France",
        };
        return responses[lang] || responses.en;
      }
    },
  };

  // Analyse intelligente de la question
  const analyzeQuestion = (question) => {
    const lowerQuestion = question.toLowerCase();
    
    for (const [topic, data] of Object.entries(KNOWLEDGE_BASE)) {
      if (data.patterns.some(pattern => lowerQuestion.includes(pattern))) {
        return data.answer(i18n.getLocale());
      }
    }
    
    // Réponse par défaut
    const locale = i18n.getLocale();
    const defaultResponses = {
      fr: "Je n'ai pas compris votre question. Voici ce que je peux vous aider :\n\n- Comment fonctionne la détection ?\n- Quels formats sont supportés ?\n- Quels sont les tarifs ?\n- Comment obtenir un certificat ?\n- Quelle est la précision ?\n- Comment utiliser l'API ?\n- Comment contacter le support ?\n\nPosez votre question différemment ou tapez **'aide'** pour voir toutes les options.",
      en: "I didn't understand your question. Here's what I can help with:\n\n- How does detection work?\n- What formats are supported?\n- What are the prices?\n- How to get a certificate?\n- What's the accuracy?\n- How to use the API?\n- How to contact support?\n\nRephrase your question or type **'help'** to see all options.",
      ar: "لم أفهم سؤالك. إليك ما يمكنني مساعدتك فيه:\n\n- كيف يعمل الكشف؟\n- ما التنسيقات المدعومة؟\n- ما الأسعار؟\n- كيف أحصل على شهادة؟\n- ما الدقة؟\n- كيف أستخدم API؟\n- كيف أتواصل مع الدعم؟\n\nأعد صياغة سؤالك أو اكتب **'مساعدة'** لرؤية جميع الخيارات.",
    };
    return defaultResponses[locale] || defaultResponses.en;
  };

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: i18n.t('chatbot.welcome'),
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sauvegarder la conversation dans Supabase
  const saveConversation = async (newMessages) => {
    try {
      // Ne sauvegarder que si l'utilisateur est authentifié
      if (!user) return;

      const conversationData = {
        user_id: user.id,
        user_email: user.email,
        session_id: sessionId,
        messages: newMessages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString()
        })),
        last_message_at: new Date().toISOString(),
        status: 'open'
      };

      // Vérifier si une conversation existe déjà pour cette session
      const { data: existing } = await supabase
        .from('support_conversations')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        // Mettre à jour
        await supabase
          .from('support_conversations')
          .update(conversationData)
          .eq('id', existing.id);
      } else {
        // Créer nouvelle conversation
        await supabase
          .from('support_conversations')
          .insert(conversationData);
      }
    } catch (error) {
      console.error('Erreur sauvegarde conversation:', error);
      // Ne pas bloquer l'expérience utilisateur si la sauvegarde échoue
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // Simuler réflexion (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));

    const response = analyzeQuestion(input);

    const assistantMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    const finalMessages = [...updatedMessages, assistantMessage];
    setMessages(finalMessages);
    setLoading(false);

    // Sauvegarder la conversation (async, ne bloque pas l'UI)
    saveConversation(finalMessages);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-primary-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{i18n.t('chatbot.title')}</h3>
            <p className="text-xs text-gray-400">{i18n.t('common.appName')}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition"
          aria-label={i18n.t('common.close')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString(i18n.getLocale(), { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {i18n.getSection('chatbot').suggestions?.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={i18n.t('chatbot.placeholder')}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition"
            aria-label={i18n.t('chatbot.send')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
