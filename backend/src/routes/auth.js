const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const prisma = require('../config/db');
const { auth } = require('../middleware/auth');
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, profileUpdateValidation } = require('../middleware/validators');
const logger = require('../config/logger');
const { sendWelcomeEmail } = require('../services/email');

const router = express.Router();

router.post('/register', registerLimiter, registerValidation, async (req, res) => {
  try {
    const { email, password, name, language = 'fr', phone, acceptMarketing = false } = req.body;
    
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      logger.logAuth('register', email, false, 'Email already exists');
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    
    const user = await prisma.user.create({
      data: { 
        id: uuid(), 
        email: email.toLowerCase(), 
        password: await bcrypt.hash(password, 12), 
        name, 
        language,
        phone: phone || null,
        acceptMarketing
      }
    });
    
    // Envoyer l'email de bienvenue (non-bloquant)
    sendWelcomeEmail(user).catch(err => {
      logger.error('Failed to send welcome email', { userId: user.id, error: err.message });
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    logger.logAuth('register', email, true);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, language: user.language } });
  } catch (e) {
    logger.logError(e, req);
    res.status(500).json({ error: 'Erreur inscription', details: e.message });
  }
});

router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.logAuth('login', email, false, 'Invalid credentials');
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    logger.logAuth('login', email, true);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, language: user.language, usedToday: user.usedToday, usedMonth: user.usedMonth } });
  } catch (e) {
    logger.logError(e, req);
    res.status(500).json({ error: 'Erreur connexion', details: e.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, name: true, role: true, plan: true, language: true, usedToday: true, usedMonth: true } });
    res.json({ user });
  } catch (e) {
    logger.logError(e, req);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/profile', auth, profileUpdateValidation, async (req, res) => {
  try {
    const { name, language } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { ...(name && { name }), ...(language && { language }) } });
    logger.info('Profile updated', { userId: req.user.id });
    res.json({ user });
  } catch (e) {
    logger.logError(e, req);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
