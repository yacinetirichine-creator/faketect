const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const analyzer = require('../services/analyzer');
const documentExtractor = require('../services/document-extractor');
const { saveAnalysis, saveBatch, updateBatch, getBatchWithAnalyses } = require('../config/supabase');
const { optionalAuthMiddleware, quotaMiddleware } = require('../middleware/auth');
const guestQuota = require('../services/guest-quota');

const router = express.Router();

// ✅ Validation Content-Length (économie bande passante)
function validateContentLength(maxBytes) {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    // Compat navigateur/proxy/HTTP2 : Content-Length peut être absent.
    // On laisse multer/les limits applicatives gérer la taille réelle.
    if (!contentLength || Number.isNaN(contentLength)) {
      return next();
    }
    if (contentLength > maxBytes) {
      return res.status(413).json({ 
        error: true, 
        message: `Fichier trop volumineux: ${(contentLength / 1024 / 1024).toFixed(2)} MB (max ${(maxBytes / 1024 / 1024).toFixed(2)} MB)` 
      });
    }
    next();
  };
}

function sanitizeFilename(name) {
  const base = path.basename(String(name || 'file'));
  return base
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
}

// Config Multer pour fichiers multiples
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${sanitizeFilename(file.originalname)}`)
});

const uploadMultiple = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocs = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    cb(null, [...allowedImages, ...allowedDocs].includes(file.mimetype));
  }
});

/**
 * POST /api/batch/images - Analyse multiple images
 */
router.post('/images', 
  validateContentLength(20 * 1024 * 1024), // ✅ 20MB max pour batch
  optionalAuthMiddleware, 
  quotaMiddleware, 
  uploadMultiple.array('images', 20), 
  async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ error: true, message: 'Aucun fichier fourni' });

  const batchId = uuidv4();
  const results = [];

  try {
    // Créer le batch
    if (req.user) {
      await saveBatch({
        id: batchId,
        user_id: req.user.id,
        name: `Lot de ${files.length} images`,
        source_type: 'multiple_images',
        total_images: files.length,
        status: 'processing'
      });
    }

    console.log(`\n📦 Analyse batch #${batchId.slice(0, 8)} - ${files.length} images`);

    // Analyser chaque image
    for (const file of files) {
      try {
        const result = await analyzer.analyzeImage(file.path, {
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          userId: req.user?.id,
          source: 'web',
          sourceType: 'image',
          batchId
        });

        results.push(result);

        if (req.user) {
          await saveAnalysis({
            id: result.id,
            user_id: req.user.id,
            batch_id: batchId,
            filename: result.filename,
            file_size: result.file_size,
            mime_type: result.mime_type,
            source_type: 'image',
            sightengine_score: result.sightengine_score,
            illuminarty_score: result.illuminarty_score,
            illuminarty_model: result.illuminarty_model,
            exif_data: result.exif_data,
            exif_has_ai_markers: result.exif_has_ai_markers,
            combined_score: result.combined_score,
            confidence_level: result.confidence_level,
            is_ai_generated: result.is_ai_generated,
            source: 'web',
            analysis_duration_ms: result.analysis_duration_ms
          });
        }
      } catch (err) {
        results.push({ filename: file.originalname, error: err.message });
      }

      // Supprimer le fichier
      fs.unlink(file.path, () => {});
    }

    // Mettre à jour le batch
    const analyzed = results.filter(r => !r.error);
    const aiCount = analyzed.filter(r => r.is_ai_generated).length;
    const avgScore = analyzed.length > 0
      ? analyzed.filter(r => r.combined_score != null).reduce((s, r) => s + r.combined_score, 0) / analyzed.length
      : 0;

    if (req.user) {
      await updateBatch(batchId, {
        ai_detected_count: aiCount,
        average_score: avgScore || 0,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }

    // Consommer quota invité uniquement si succès
    if (!req.user) req.quota = await guestQuota.consume(req.ip, req.fingerprint);

    res.json({
      success: true,
      batch_id: batchId,
      summary: {
        total: files.length,
        analyzed: analyzed.length,
        ai_detected: aiCount,
        average_score: Math.round((avgScore || 0) * 100)
      },
      results: results.map(r => ({
        id: r.id,
        filename: r.filename ? sanitizeFilename(r.filename) : r.filename,
        combined_score: r.combined_score,
        confidence_level: r.confidence_level,
        is_ai_generated: r.is_ai_generated,
        interpretation: r.interpretation,
        error: r.error
      })),
      quota: req.quota
    });

  } catch (error) {
    // Nettoyer les fichiers
    files.forEach(f => fs.unlink(f.path, () => {}));
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

/**
 * POST /api/batch/document - Analyse un document (PDF, Word, PPT, Excel)
 */
router.post('/document', optionalAuthMiddleware, quotaMiddleware, uploadMultiple.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: true, message: 'Aucun document fourni' });

  const batchId = uuidv4();
  const results = [];
  const uploadedPath = req.file.path;
  let extraction;

  try {
    console.log(`\n📄 Extraction document: ${req.file.originalname}`);

    // Extraire les images du document
    extraction = await documentExtractor.extractImages(req.file.path, req.file.mimetype);

    if (!extraction.success) {
      fs.unlink(uploadedPath, () => {});
      return res.status(400).json({ error: true, message: extraction.error || 'Extraction échouée' });
    }

    if (extraction.images.length === 0) {
      fs.unlink(uploadedPath, () => {});
      return res.json({
        success: true,
        batch_id: batchId,
        document: {
          name: req.file.originalname,
          type: extraction.documentType,
          pageCount: extraction.pageCount
        },
        summary: { total: 0, ai_detected: 0 },
        results: [],
        message: 'Aucune image trouvée dans ce document'
      });
    }

    // Créer le batch
    if (req.user) {
      await saveBatch({
        id: batchId,
        user_id: req.user.id,
        name: req.file.originalname,
        source_type: 'document',
        original_filename: req.file.originalname,
        total_images: extraction.images.length,
        status: 'processing'
      });
    }

    console.log(`  → ${extraction.images.length} images trouvées`);

    // Analyser chaque image extraite
    for (const img of extraction.images) {
      if (!img.extracted || !img.tempPath) {
        results.push({ filename: img.name, error: 'Non extrait', page: img.page });
        continue;
      }

      try {
        const result = await analyzer.analyzeImage(img.tempPath, {
          filename: img.name,
          size: img.size,
          userId: req.user?.id,
          source: 'web',
          sourceType: 'document',
          documentName: req.file.originalname,
          documentPage: img.page,
          batchId
        });

        results.push(result);

        if (req.user) {
          await saveAnalysis({
            id: result.id,
            user_id: req.user.id,
            batch_id: batchId,
            filename: result.filename,
            file_size: result.file_size,
            source_type: 'document',
            document_name: req.file.originalname,
            document_page: img.page,
            sightengine_score: result.sightengine_score,
            illuminarty_score: result.illuminarty_score,
            exif_has_ai_markers: result.exif_has_ai_markers,
            combined_score: result.combined_score,
            confidence_level: result.confidence_level,
            is_ai_generated: result.is_ai_generated,
            source: 'web',
            analysis_duration_ms: result.analysis_duration_ms
          });
        }
      } catch (err) {
        results.push({ filename: img.name, error: err.message, page: img.page });
      }
    }

    // Nettoyer
    documentExtractor.cleanupTempFiles(extraction.images);
    fs.unlink(uploadedPath, () => {});

    // Stats
    const analyzed = results.filter(r => !r.error);
    const aiCount = analyzed.filter(r => r.is_ai_generated).length;
    const avgScore = analyzed.length > 0 
      ? analyzed.reduce((s, r) => s + (r.combined_score || 0), 0) / analyzed.length 
      : 0;

    if (req.user) {
      await updateBatch(batchId, {
        ai_detected_count: aiCount,
        average_score: avgScore,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }

    // Consommer quota invité uniquement si succès
    if (!req.user) req.quota = await guestQuota.consume(req.ip, req.fingerprint);

    res.json({
      success: true,
      batch_id: batchId,
      document: {
        name: req.file.originalname,
        type: extraction.documentType,
        pageCount: extraction.pageCount
      },
      summary: {
        total: extraction.images.length,
        analyzed: analyzed.length,
        ai_detected: aiCount,
        average_score: Math.round(avgScore * 100)
      },
      results: results.map(r => ({
        id: r.id,
        filename: r.filename,
        page: r.document_page || r.page,
        combined_score: r.combined_score,
        confidence_level: r.confidence_level,
        is_ai_generated: r.is_ai_generated,
        interpretation: r.interpretation,
        error: r.error
      })),
      quota: req.quota
    });

  } catch (error) {
    if (extraction?.images) documentExtractor.cleanupTempFiles(extraction.images);
    if (uploadedPath) fs.unlink(uploadedPath, () => {});
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

/**
 * GET /api/batch/:id - Récupérer un batch avec ses analyses
 */
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: true, message: 'Connexion requise' });

    const batch = await getBatchWithAnalyses(req.params.id, req.user.id);
    if (!batch) return res.status(404).json({ error: true, message: 'Batch non trouvé' });

    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
