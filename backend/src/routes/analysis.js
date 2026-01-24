const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const prisma = require('../config/db');
const { auth, checkLimit } = require('../middleware/auth');
const { validateVideoDuration } = require('../middleware/videoValidation');
const detection = require('../services/detection');
const { sendQuotaWarningEmail } = require('../services/emailAutomation');
const cache = require('../services/cache');
const { sendLimitReachedEmail } = require('../services/email');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) {fs.mkdirSync(dir, { recursive: true });}
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuid()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB pour vidéos
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  },
});

/**
 * Calculer le hash SHA-256 d'un fichier pour le cache
 */
async function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

router.post('/file', auth, checkLimit, upload.single('file'), validateVideoDuration, async (req, res) => {
  try {
    if (!req.file) {return res.status(400).json({ error: 'Fichier requis' });}

    const type = req.file.mimetype.startsWith('image/') ? 'IMAGE' :
                 req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'DOCUMENT';

    // Calculer le hash du fichier pour le cache
    const fileHash = await getFileHash(req.file.path);
    const cacheKey = `analysis:${fileHash}`;

    // Vérifier si le résultat est en cache
    let result = await cache.get(cacheKey);
    let fromCache = false;

    if (result) {
      console.log(`✅ Cache HIT pour ${req.file.originalname} (${fileHash.substring(0, 12)}...)`);
      fromCache = true;
    } else {
      console.log(`⚠️  Cache MISS pour ${req.file.originalname} (${fileHash.substring(0, 12)}...)`);

      // Analyser le fichier avec l'API
      const fileStream = fs.createReadStream(req.file.path);
      result = await detection.analyze(fileStream, req.file.mimetype, req.file.originalname);

      // Stocker le résultat en cache (TTL: 7 jours pour économiser les coûts)
      const ttl = 7 * 24 * 60 * 60; // 7 jours
      await cache.set(cacheKey, result, ttl);
    }

    // Créer l'analyse en BDD
    const analysis = await prisma.analysis.create({
      data: { id: uuid(), userId: req.user.id, type, fileName: req.file.originalname, fileUrl: `/uploads/${req.file.filename}` },
    });

    const safeDetailsString = (() => {
      try {
        const s = JSON.stringify(result);
        // Prevent huge DB rows (video responses can be very large)
        const max = 200_000;
        if (s.length <= max) {return s;}

        const summary = {
          aiScore: result.aiScore,
          isAi: result.isAi,
          confidence: result.confidence,
          verdict: result.verdict,
          provider: result.provider,
          sources: result.sources,
          consensus: result.consensus,
          framesAnalyzed: result.framesAnalyzed,
          truncated: true,
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
        details: safeDetailsString,
      },
    });

    // Incrémenter les compteurs selon le plan
    if (req.user.plan === 'FREE') {
      // Plan FREE : incrémenter uniquement usedTotal
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { usedTotal: { increment: 1 } },
        select: { usedTotal: true, email: true, name: true, language: true },
      });

      // Si limite atteinte (10/10), envoyer email d'alerte (non-bloquant)
      if (updatedUser.usedTotal >= 10) {
        sendLimitReachedEmail(updatedUser).catch(err => {
          console.error('Failed to send limit reached email:', err.message);
        });
      }
    } else {
      // Plans payants : incrémenter usedToday et usedMonth comme avant
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { usedToday: { increment: 1 }, usedMonth: { increment: 1 } },
        select: { usedMonth: true, plan: true, email: true, name: true, language: true, id: true },
      });

      // Vérifier si l'utilisateur atteint 75% du quota et envoyer email d'alerte
      const planLimits = { FREE: 10, STARTER: 100, PRO: 500, BUSINESS: 2000, ENTERPRISE: -1 };
      const limit = planLimits[updatedUser.plan] || 10;
      const percentUsed = (updatedUser.usedMonth / limit) * 100;

      if (percentUsed >= 75 && percentUsed < 85) { // Envoyer seulement entre 75-85% pour éviter spam
        sendQuotaWarningEmail(updatedUser).catch(err => {
          console.error('Failed to send quota warning email:', err.message);
        });
      }
    }

    res.json({
      success: true,
      analysis: {
        ...updated,
        verdict: result.verdict,
        demo: result.demo,
        provider: result.provider,
        sources: result.sources,
        consensus: result.consensus,
        framesAnalyzed: result.framesAnalyzed,
        fromCache, // Indiquer si le résultat vient du cache
        // Ajouter metadata vidéo si disponible
        ...(req.videoMetadata && {
          videoMetadata: {
            totalDuration: req.videoMetadata.totalDuration,
            analyzedDuration: req.videoMetadata.analyzedDuration,
            isPartialAnalysis: req.videoMetadata.isPartialAnalysis,
          },
        }),
      },
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
    prisma.analysis.count({ where: { userId: req.user.id } }),
  ]);
  res.json({ analyses, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) } });
});

router.delete('/:id', auth, async (req, res) => {
  await prisma.analysis.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ success: true });
});

module.exports = router;
