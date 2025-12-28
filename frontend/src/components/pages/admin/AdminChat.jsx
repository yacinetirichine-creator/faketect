import { useState, useEffect } from 'react';
import { MessageCircle, Send, Check, Archive, Clock, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import useAuthStore from '../../../stores/authStore';

export default function AdminChat() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [filter, setFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [filter]);

  const loadConversations = async () => {
    try {
      const response = await api.get(`/chatbot/conversations?status=${filter}`);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversationDetails = async (id) => {
    try {
      const response = await api.get(`/chatbot/conversations/${id}`);
      setSelectedConversation(response.data);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedConversation) return;

    setIsLoading(true);
    try {
      await api.post(`/chatbot/conversations/${selectedConversation.id}/reply`, {
        message: replyMessage
      });

      // Recharger la conversation
      await loadConversationDetails(selectedConversation.id);
      setReplyMessage('');
      
      // Recharger la liste
      await loadConversations();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Erreur lors de l\'envoi de la réponse');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/chatbot/conversations/${id}/status`, { status });
      await loadConversations();
      if (selectedConversation?.id === id) {
        setSelectedConversation({ ...selectedConversation, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <Check className="w-4 h-4 text-green-500" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-indigo-600" />
            Gestion Chat Support
          </h1>
          <p className="text-gray-600 mt-2">
            Répondez aux conversations nécessitant une intervention humaine
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            {['pending', 'active', 'resolved', 'archived', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {conversations.length > 0 && filter === status && (
                  <span className="ml-2 bg-white text-indigo-600 px-2 py-0.5 rounded-full text-xs">
                    {conversations.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Conversations ({conversations.length})</h2>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune conversation {filter !== 'all' && filter}
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationDetails(conv.id)}
                    className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                      selectedConversation?.id === conv.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(conv.status)}
                        <span className="font-medium text-sm text-gray-900">
                          {conv.user?.name || conv.user?.email || 'Visiteur anonyme'}
                        </span>
                      </div>
                      {getStatusBadge(conv.status)}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {conv._count.messages} messages • {conv.language.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(conv.updatedAt)}
                    </p>
                    {conv.messages[0] && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {conv.messages[0].content}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation Details */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-sm flex flex-col" style={{ height: '700px' }}>
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.user?.name || 'Visiteur anonyme'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.user?.email || 'Email non disponible'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    {selectedConversation.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(selectedConversation.id, 'resolved')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Marquer résolu
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-indigo-100 text-indigo-900'
                            : msg.role === 'admin'
                            ? 'bg-green-100 text-green-900 border-2 border-green-300'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {msg.role === 'user' ? 'Client' : msg.role === 'admin' ? '👨‍💼 Admin' : '🤖 Bot'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={sendReply} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Votre réponse en tant qu'admin..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage.trim() || isLoading}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Envoyer
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Sélectionnez une conversation pour voir les détails
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
