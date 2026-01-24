const express = require('express');
const prisma = require('../config/db');
const { auth, admin } = require('../middleware/auth');
const openaiService = require('../services/openai');
const logger = require('../config/logger');

const router = express.Router();

/**
 * POST /api/chatbot/message
 * Envoyer un message au chatbot (PUBLIC - pas d'authentification requise)
 */
router.post('/message', async (req, res) => {
  try {
    const { message, language = 'fr', conversationId = null } = req.body;
    const userId = null; // Chatbot accessible sans compte

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Créer ou récupérer la conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
      });
    }

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId,
          language,
          status: 'active',
        },
        include: { messages: true },
      });
    }

    // Sauvegarder le message utilisateur
    const _userMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        language,
      },
    });

    // Construire le contexte de conversation
    const conversationHistory = conversation.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    conversationHistory.push({ role: 'user', content: message });

    // Obtenir la réponse IA
    const aiResponse = await openaiService.chatWithUser(conversationHistory, language);

    // Sauvegarder la réponse IA
    const _botMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
        language,
      },
    });

    logger.info('Chatbot conversation', {
      conversationId: conversation.id,
      userId,
      language,
      messageLength: message.length,
    });

    res.json({
      conversationId: conversation.id,
      message: aiResponse,
      requiresHumanSupport: aiResponse.includes('[HUMAN_SUPPORT]'),
    });

  } catch (error) {
    logger.error('Chatbot error', error);
    res.status(500).json({
      error: 'Erreur du chatbot',
      message: 'Désolé, une erreur est survenue. Un administrateur va vous répondre.',
    });
  }
});

/**
 * GET /api/chatbot/conversations (Admin uniquement)
 * Liste toutes les conversations nécessitant une intervention humaine
 */
router.get('/conversations', auth, admin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const conversations = await prisma.chatConversation.findMany({
      where: status !== 'all' ? { status } : {},
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.chatConversation.count({
      where: status !== 'all' ? { status } : {},
    });

    res.json({
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    logger.error('Get conversations error', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
});

/**
 * GET /api/chatbot/conversations/:id (Admin uniquement)
 * Détails complets d'une conversation
 */
router.get('/conversations/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, language: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    res.json(conversation);

  } catch (error) {
    logger.error('Get conversation detail error', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la conversation' });
  }
});

/**
 * POST /api/chatbot/conversations/:id/reply (Admin uniquement)
 * Répondre manuellement à une conversation
 */
router.post('/conversations/:id/reply', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message requis' });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    // Créer le message admin
    const adminMessage = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        role: 'admin',
        content: message,
        language: conversation.language,
        adminId: req.user.id,
      },
    });

    // Mettre à jour le statut de la conversation
    await prisma.chatConversation.update({
      where: { id },
      data: {
        status: 'resolved',
        updatedAt: new Date(),
      },
    });

    logger.info('Admin replied to conversation', {
      conversationId: id,
      adminId: req.user.id,
      messageLength: message.length,
    });

    res.json({
      message: adminMessage,
      conversation: { id, status: 'resolved' },
    });

  } catch (error) {
    logger.error('Admin reply error', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la réponse' });
  }
});

/**
 * PATCH /api/chatbot/conversations/:id/status (Admin uniquement)
 * Changer le statut d'une conversation
 */
router.patch('/conversations/:id/status', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'pending', 'resolved', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Statut invalide',
        validStatuses,
      });
    }

    const conversation = await prisma.chatConversation.update({
      where: { id },
      data: { status },
    });

    logger.info('Conversation status updated', {
      conversationId: id,
      newStatus: status,
      adminId: req.user.id,
    });

    res.json(conversation);

  } catch (error) {
    logger.error('Update conversation status error', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
});

module.exports = router;
