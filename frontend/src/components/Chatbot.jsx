import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export default function Chatbot() {
  const { i18n } = useTranslation();
  const language = i18n.language || 'fr';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/message', {
        message: inputMessage,
        language,
        conversationId
      });

      if (!conversationId) {
        setConversationId(response.data.conversationId);
      }

      const botMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        requiresHumanSupport: response.data.requiresHumanSupport
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chatbot error:', error);
      const trans = translations[language] || translations.fr;
      const errorMessage = {
        role: 'assistant',
        content: trans.error,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const translations = {
    fr: {
      title: 'Assistant FakeTect',
      placeholder: 'Posez votre question...',
      send: 'Envoyer',
      welcome: 'Bonjour ! Comment puis-je vous aider ?',
      helpButton: 'Besoin d\'aide ?',
      error: 'Désolé, une erreur est survenue. Veuillez réessayer.',
      humanSupport: '⚠️ Un admin va vous répondre prochainement'
    },
    en: {
      title: 'FakeTect Assistant',
      placeholder: 'Ask your question...',
      send: 'Send',
      welcome: 'Hello! How can I help you?',
      helpButton: 'Need help?',
      error: 'Sorry, an error occurred. Please try again.',
      humanSupport: '⚠️ An admin will respond soon'
    },
    es: {
      title: 'Asistente FakeTect',
      placeholder: 'Haz tu pregunta...',
      send: 'Enviar',
      welcome: '¡Hola! ¿Cómo puedo ayudarte?',
      helpButton: '¿Necesitas ayuda?',
      error: 'Lo siento, ocurrió un error. Por favor, inténtalo de nuevo.',
      humanSupport: '⚠️ Un administrador te responderá pronto'
    },
    de: {
      title: 'FakeTect Assistent',
      placeholder: 'Stellen Sie Ihre Frage...',
      send: 'Senden',
      welcome: 'Hallo! Wie kann ich Ihnen helfen?',
      helpButton: 'Brauchen Sie Hilfe?',
      error: 'Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      humanSupport: '⚠️ Ein Administrator wird Ihnen bald antworten'
    },
    it: {
      title: 'Assistente FakeTect',
      placeholder: 'Fai la tua domanda...',
      send: 'Invia',
      welcome: 'Ciao! Come posso aiutarti?',
      helpButton: 'Hai bisogno di aiuto?',
      error: 'Spiacente, si è verificato un errore. Riprova.',
      humanSupport: '⚠️ Un amministratore ti risponderà presto'
    },
    pt: {
      title: 'Assistente FakeTect',
      placeholder: 'Faça sua pergunta...',
      send: 'Enviar',
      welcome: 'Olá! Como posso ajudar?',
      helpButton: 'Precisa de ajuda?',
      error: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
      humanSupport: '⚠️ Um administrador responderá em breve'
    }
  };

  const t = translations[language] || translations.fr;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 hover:scale-110 z-50"
          aria-label={t.helpButton}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">{t.title}</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-indigo-700 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-indigo-700">
                {t.welcome}
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content.replace('[HUMAN_SUPPORT]', '')}</p>
                  {msg.requiresHumanSupport && (
                    <p className="text-xs mt-2 opacity-75 italic">
                      {t.humanSupport}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="text-sm text-gray-600">...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
