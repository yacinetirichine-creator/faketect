const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const prisma = require('../config/db');
const { auth, checkLimit } = require('../middleware/auth');
const detection = require('../services/detection');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuid()}-${file.originalname}`)
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB pour vidéos
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

router.post('/file', auth, checkLimit, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
    
    const type = req.file.mimetype.startsWith('image/') ? 'IMAGE' : 
                 req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'DOCUMENT';
    
    const analysis = await prisma.analysis.create({
      data: { id: uuid(), userId: req.user.id, type, fileName: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` }
    });
    
    const fileStream = fs.createReadStream(req.file.path);
    const result = await detection.analyze(fileStream, req.file.mimetype, req.file.originalname);

    const safeDetailsString = (() => {
      try {
        const s = JSON.stringify(result);
        // Prevent huge DB rows (video responses can be very large)
        const max = 200_000;
        if (s.length <= max) return s;

        const summary = {
          aiScore: result.aiScore,
          isAi: result.isAi,
          confidence: result.confidence,
          verdict: result.verdict,
          provider: result.provider,
          sources: result.sources,
          consensus: result.consensus,
          framesAnalyzed: result.framesAnalyzed,
          truncated: true
        };
        return JSON.stringify(summary);
      } catch {
        return null;
      }
    })();
    
    const updated = await prisma.analysis.update({
      where: { id: analysis.id },
      data: { 
        aiScore: result.aiScore, 
        isAi: result.isAi, 
        confidence: result.confidence, 
        details: safeDetailsString
      }
    });
    
    await prisma.user.update({ where: { id: req.user.id }, data: { usedToday: { increment: 1 }, usedMonth: { increment: 1 } } });
    
    res.json({ 
      success: true, 
      analysis: { 
        ...updated, 
        verdict: result.verdict, 
        demo: result.demo,
        provider: result.provider,
        sources: result.sources,
        consensus: result.consensus,
        framesAnalyzed: result.framesAnalyzed
      } 
    });
  } catch (e) { 
    console.error(e); 
    res.status(500).json({ error: 'Erreur analyse', details: e.message }); 
  }
});

router.get('/history', auth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: +limit }),
    prisma.analysis.count({ where: { userId: req.user.id } })
  ]);
  res.json({ analyses, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
});

router.delete('/:id', auth, async (req, res) => {
  await prisma.analysis.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ success: true });
});

module.exports = router;
