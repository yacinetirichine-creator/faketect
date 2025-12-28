const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const prisma = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, language = 'fr', phone, acceptMarketing = false } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(400).json({ error: 'Email déjà utilisé' });
    
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
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, language: user.language } });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: 'Erreur inscription', details: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, language: user.language, usedToday: user.usedToday, usedMonth: user.usedMonth } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Erreur connexion', details: e.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, email: true, name: true, role: true, plan: true, language: true, usedToday: true, usedMonth: true } });
  res.json({ user });
});

router.put('/profile', auth, async (req, res) => {
  const { name, language } = req.body;
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { ...(name && { name }), ...(language && { language }) } });
  res.json({ user });
});

module.exports = router;
