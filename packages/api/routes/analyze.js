const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fileType = require('file-type');

const analyzer = require('../services/analyzer');
const { saveAnalysis, consumeVideoQuota } = require('../config/supabase');
const { authMiddleware, optionalAuthMiddleware, quotaMiddleware } = require('../middleware/auth');
const guestQuota = require('../services/guest-quota');

const router = express.Router();

/**
 * ✅ Middleware validation Content-Length (anti-gaspillage bande passante)
 */
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
        message: `Fichier trop volumineux: ${(contentLength / 1024 / 1024).toFixed(2)} MB (max: ${maxBytes / 1024 / 1024} MB)`
      });
    }
    
    next();
  };
}

function sanitizeFilename(name) {
  // ✅ Nettoyer AVANT path.basename pour bloquer path traversal
  const cleaned = String(name || 'file')
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/[./\\]/g, '_')  // Bloquer . / \ pour path traversal
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  
  const base = path.basename(cleaned);
  
  // Liste étendue extensions dangereuses
  const dangerousExts = [
    '.exe', '.sh', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar',
    '.php', '.py', '.rb', '.pl', '.asp', '.jsp', '.cgi', '.dll', '.so'
  ];
  
  const ext = path.extname(base).toLowerCase();
  if (dangerousExts.includes(ext)) {
    return base.replace(ext, '.txt');
  }
  
  // ✅ Vérification finale anti-traversal
  if (base.includes('..') || base.includes('/') || base.includes('\\')) {
    return 'suspicious_file.txt';
  }
  
  return base || 'unnamed_file';
}

// Config Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${sanitizeFilename(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

function getEnvInt(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  const value = Number.parseInt(raw, 10);
  const v = Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, v));
}

function getEnvFloat(name, fallback, { min = 0, max = Number.MAX_VALUE } = {}) {
  const raw = process.env[name];
  const value = Number.parseFloat(raw);
  const v = Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, v));
}

async function which(cmd) {
  return await new Promise((resolve) => {
    const p = spawn('which', [cmd]);
    p.on('close', (code) => resolve(code === 0));
    p.on('error', () => resolve(false));
  });
}

// ✅ Whitelist arguments FFmpeg autorisés
const ALLOWED_FFMPEG_ARGS = new Set([
  '-i', '-y', '-vf', '-ss', '-t', '-frames:v', '-q:v', '-f', '-hide_banner', '-loglevel'
]);

const ALLOWED_FFMPEG_FILTERS = new Set([
  'fps', 'scale', 'select', 'thumbnail'
]);

function validateFFmpegArgs(args) {
  const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  for (let i = 0; i < args.length; i++) {
    const arg = String(args[i] || '');
    
    // Vérifier argument dans whitelist
    if (arg.startsWith('-') && !ALLOWED_FFMPEG_ARGS.has(arg)) {
      throw new Error(`Argument FFmpeg non autorisé: ${arg}`);
    }
    
    // Vérifier filtres vidéo
    if (arg.includes('fps=') || arg.includes('scale=') || arg.includes('select=')) {
      const filterName = arg.split('=')[0];
      if (!ALLOWED_FFMPEG_FILTERS.has(filterName)) {
        throw new Error(`Filtre FFmpeg non autorisé: ${filterName}`);
      }
    }
    
    // Bloquer URLs (SSRF protection)
    if (arg.match(/^https?:\/\//i) || arg.match(/^ftp:\/\//i)) {
      throw new Error('URLs non autorisées dans FFmpeg');
    }
    
    // Bloquer protocoles dangereux
    if (arg.match(/^(concat|pipe|tcp|udp|file):/i)) {
      throw new Error('Protocoles non autorisés dans FFmpeg');
    }
    
    // Vérifier chemins fichiers (doivent être dans temp/ ou uploads/)
    if (arg.includes('/') && !arg.startsWith('-')) {
      const normalized = path.normalize(arg);
      const isInTemp = normalized.startsWith(tempDir);
      const isInUploads = normalized.startsWith(uploadsDir);
      
      if (!isInTemp && !isInUploads && arg !== '/dev/null') {
        throw new Error(`Chemin non autorisé: ${arg}`);
      }
    }
  }
  
  return true;
}

async function runFfmpeg(args) {
  // ✅ Validation avant exécution
  validateFFmpegArgs(args);
  
  return await new Promise((resolve, reject) => {
    // ✅ Timeout 5 minutes max
    const timeout = setTimeout(() => {
      p.kill('SIGKILL');
      reject(new Error('FFmpeg timeout (5 min) - vidéo trop complexe'));
    }, 5 * 60 * 1000);
    
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args]);
    let stderr = '';
    p.stderr.on('data', (d) => { stderr += d.toString(); });
    p.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    p.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) return resolve();
      reject(new Error(stderr || `ffmpeg failed with code ${code}`));
    });
  });
}

function listFrameFiles(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(f => /^frame-\d+\.jpg$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(f => path.join(dir, f));
  } catch {
    return [];
  }
}

function safeRmdirRecursive(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

/**
 * ✅ Validation MIME type avec magic bytes (anti-spoofing)
 */
async function validateFileType(filePath, expectedMimes) {
  try {
    const type = await fileType.fromFile(filePath);
    
    if (!type) {
      throw new Error('Type de fichier non reconnu');
    }
    
    if (!expectedMimes.includes(type.mime)) {
      throw new Error(`Type invalide: ${type.mime} (attendu: ${expectedMimes.join(', ')})`);
    }
    
    return type;
  } catch (error) {
    throw new Error(`Validation fichier: ${error.message}`);
  }
}

function fpsFilterValue(fps) {
  // Keep it strict/deterministic for MVP.
  if (fps === 0.5) return 'fps=1/2';
  if (fps === 0.25) return 'fps=1/4';
  if (fps === 1) return 'fps=1';
  if (fps === 2) return 'fps=2';
  // fallback: numeric string
  return `fps=${fps}`;
}

/**
 * POST /api/analyze/upload - Upload et analyse d'une image
 */
router.post('/upload',
  validateContentLength(10 * 1024 * 1024), // ✅ Check Content-Length avant upload
  optionalAuthMiddleware,
  quotaMiddleware,
  upload.single('image'),
  async (req, res) => {
  const uploadedPath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: true, message: 'Aucune image fournie' });

    // ✅ Validation MIME type (magic bytes anti-spoofing)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    try {
      await validateFileType(req.file.path, allowedMimes);
    } catch (validationError) {
      if (uploadedPath) fs.unlink(uploadedPath, () => {});
      return res.status(400).json({ error: true, message: validationError.message });
    }

    const result = await analyzer.analyzeImage(req.file.path, {
      filename: sanitizeFilename(req.file.originalname),
      size: req.file.size,
      mimetype: req.file.mimetype,
      userId: req.user?.id,
      source: 'web',
      sourceType: 'image'
    });

    // Sauvegarder si connecté
    if (req.user) {
      await saveAnalysis({
        id: result.id,
        user_id: req.user.id,
        filename: result.filename,
        file_size: result.file_size,
        mime_type: result.mime_type,
        source_type: 'image',
        sightengine_score: result.sightengine_score,
        sightengine_raw: result.sightengine_raw,
        illuminarty_score: result.illuminarty_score,
        illuminarty_model: result.illuminarty_model,
        illuminarty_raw: result.illuminarty_raw,
        exif_data: result.exif_data,
        exif_camera: result.exif_camera,
        exif_software: result.exif_software,
        exif_has_ai_markers: result.exif_has_ai_markers,
        combined_score: result.combined_score,
        confidence_level: result.confidence_level,
        is_ai_generated: result.is_ai_generated,
        source: 'web',
        analysis_duration_ms: result.analysis_duration_ms
        // NOTE: IP address not stored for authenticated users (RGPD compliance)
      });
    }

    // Supprimer le fichier
    if (uploadedPath) fs.unlink(uploadedPath, () => {});

    // Consommer quota invité uniquement si succès
    if (!req.user) req.quota = await guestQuota.consume(req.ip, req.fingerprint);

    res.json({
      success: true,
      data: {
        id: result.id,
        filename: result.filename,
        combined_score: result.combined_score,
        confidence_level: result.confidence_level,
        is_ai_generated: result.is_ai_generated,
        interpretation: result.interpretation,
        engines: result.engines,
        exif: result.exif,
        duration_ms: result.analysis_duration_ms
      },
      quota: req.quota
    });

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    if (uploadedPath) fs.unlink(uploadedPath, () => {});
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

/**
 * POST /api/analyze/url - Analyse via URL
 */
router.post('/url', optionalAuthMiddleware, quotaMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: true, message: 'URL requise' });

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: true, message: 'URL invalide' });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: true, message: 'URL invalide' });
    }
    if (String(url).length > 2048) {
      return res.status(400).json({ error: true, message: 'URL trop longue' });
    }

    const result = await analyzer.analyzeUrl(url, { userId: req.user?.id, source: 'web' });

    if (req.user) {
      await saveAnalysis({
        id: result.id,
        user_id: req.user.id,
        filename: result.filename,
        source_type: 'url',
        sightengine_score: result.sightengine_score,
        illuminarty_score: result.illuminarty_score,
        illuminarty_model: result.illuminarty_model,
        combined_score: result.combined_score,
        confidence_level: result.confidence_level,
        is_ai_generated: result.is_ai_generated,
        source: 'web',
        analysis_duration_ms: result.analysis_duration_ms
      });
    }

    if (!req.user) req.quota = await guestQuota.consume(req.ip, req.fingerprint);
    res.json({ success: true, data: result, quota: req.quota });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

/**
 * POST /api/analyze/base64 - Analyse base64 (Extension/Mobile)
 */
router.post('/base64', optionalAuthMiddleware, quotaMiddleware, async (req, res) => {
  try {
    const { image, filename, source } = req.body;
    if (!image) return res.status(400).json({ error: true, message: 'Image base64 requise' });

    const base64Clean = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const MAX_BASE64_BYTES = 10 * 1024 * 1024;
    if (buffer.length > MAX_BASE64_BYTES) {
      return res.status(413).json({ error: true, message: 'Image trop grande' });
    }

    const result = await analyzer.analyzeBuffer(buffer, {
      filename: sanitizeFilename(filename || 'image'),
      userId: req.user?.id,
      source: source || 'extension',
      sourceType: 'image'
    });

    if (req.user) {
      await saveAnalysis({
        id: result.id,
        user_id: req.user.id,
        filename: result.filename,
        source_type: 'image',
        combined_score: result.combined_score,
        confidence_level: result.confidence_level,
        is_ai_generated: result.is_ai_generated,
        source: source || 'extension',
        analysis_duration_ms: result.analysis_duration_ms
      });
    }

    if (!req.user) req.quota = await guestQuota.consume(req.ip, req.fingerprint);
    res.json({ success: true, data: result, quota: req.quota });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

/**
 * POST /api/analyze/video - Analyse vidéo (60s max) via extraction de frames
 * Auth: requis (anti-abus / coût)
 * Sampling: coarse 0.5fps, puis burst 2fps autour des timestamps suspects
 */
router.post('/video', 
  validateContentLength(80 * 1024 * 1024), // ✅ Check Content-Length avant upload vidéo
  (req, res) => authMiddleware(req, res, async () => {
  const tempRoot = path.join(os.tmpdir(), 'faketect-video');
  const jobId = uuidv4();
  const workDir = path.join(tempRoot, jobId);
  const framesCoarseDir = path.join(workDir, 'coarse');
  const framesBurstDir = path.join(workDir, 'burst');

  // Hard cap to keep cost predictable (blocking): never analyze more than 60 seconds.
  const VIDEO_MAX_SECONDS = getEnvInt('VIDEO_MAX_SECONDS', 60, { min: 5, max: 60 });
  const VIDEO_MAX_BYTES = getEnvInt('VIDEO_MAX_BYTES', 80 * 1024 * 1024, { min: 1 * 1024 * 1024, max: 500 * 1024 * 1024 });
  const COARSE_FPS = getEnvFloat('VIDEO_COARSE_FPS', 0.5, { min: 0.1, max: 5 });
  const BURST_FPS = getEnvFloat('VIDEO_BURST_FPS', 2, { min: 0.5, max: 10 });
  const BURST_WINDOW_SECONDS = getEnvInt('VIDEO_BURST_WINDOW_SECONDS', 4, { min: 2, max: 20 });
  const MAX_TOTAL_FRAMES = getEnvInt('VIDEO_MAX_FRAMES', 80, { min: 10, max: 500 });
  const BURST_TOP_K = getEnvInt('VIDEO_BURST_TOP_K', 3, { min: 1, max: 10 });
  
  // ✅ Protection DoS vidéo
  const VIDEO_MAX_RESOLUTION = 1920 * 1080; // Full HD max (anti 4K/8K DoS)
  const VIDEO_MAX_FPS = 30; // 30 fps max (anti 60/120fps DoS)

  if (!(await which('ffmpeg'))) {
    return res.status(501).json({ error: true, message: 'Analyse vidéo indisponible: ffmpeg manquant sur le serveur' });
  }

  // Multer config (scoped)
  const videoStorage = multer.diskStorage({
    destination: (r, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (r, file, cb) => cb(null, `${uuidv4()}-${sanitizeFilename(file.originalname)}`)
  });

  const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: VIDEO_MAX_BYTES },
    fileFilter: (r, file, cb) => {
      const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
      cb(null, allowed.includes(file.mimetype));
    }
  }).single('video');

  uploadVideo(req, res, async (err) => {
    const videoPath = req.file?.path;
    try {
      if (err) {
        return res.status(400).json({ error: true, message: 'Upload vidéo invalide' });
      }
      if (!req.file || !videoPath) {
        return res.status(400).json({ error: true, message: 'Aucune vidéo fournie' });
      }

      // ✅ Validation métadonnées vidéo (protection DoS 4K/8K/120fps)
      try {
        const probe = spawn('ffprobe', [
          '-v', 'error',
          '-select_streams', 'v:0',
          '-show_entries', 'stream=width,height,r_frame_rate,duration',
          '-of', 'json',
          videoPath
        ]);
        
        let probeData = '';
        probe.stdout.on('data', (d) => { probeData += d.toString(); });
        
        await new Promise((resolve, reject) => {
          probe.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('ffprobe failed'));
          });
          probe.on('error', reject);
        });
        
        const metadata = JSON.parse(probeData);
        const stream = metadata.streams?.[0];
        
        if (stream) {
          const width = stream.width || 0;
          const height = stream.height || 0;
          const pixels = width * height;
          
          // Vérifier résolution
          if (pixels > VIDEO_MAX_RESOLUTION) {
            if (videoPath) fs.unlink(videoPath, () => {});
            return res.status(400).json({
              error: true,
              message: `Résolution trop élevée: ${width}×${height} (max Full HD 1920×1080)`
            });
          }
          
          // Vérifier FPS
          if (stream.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split('/').map(Number);
            const fps = num / (den || 1);
            if (fps > VIDEO_MAX_FPS) {
              if (videoPath) fs.unlink(videoPath, () => {});
              return res.status(400).json({
                error: true,
                message: `FPS trop élevé: ${fps.toFixed(1)} fps (max ${VIDEO_MAX_FPS} fps)`
              });
            }
          }
          
          // Vérifier durée
          const duration = parseFloat(stream.duration) || 0;
          if (duration > VIDEO_MAX_SECONDS) {
            if (videoPath) fs.unlink(videoPath, () => {});
            return res.status(400).json({
              error: true,
              message: `Vidéo trop longue: ${duration.toFixed(1)}s (max ${VIDEO_MAX_SECONDS}s)`
            });
          }
        }
      } catch (probeError) {
        console.warn('⚠️ ffprobe validation failed:', probeError.message);
        // Continue sans métadonnées (timeout FFmpeg protégera)
      }

      // Quota vidéo: consomme dès que l'upload est validé (anti-abus/coût)
      let videoQuota;
      if (req.isAdmin) {
        videoQuota = { allowed: true, remaining: 999999, limit: 999999, admin: true };
      } else {
        try {
          videoQuota = await consumeVideoQuota(req.user.id);
        } catch (quotaErr) {
          console.error('❌ Video quota consume failed:', quotaErr?.message || quotaErr);
          return res.status(503).json({ error: true, message: 'Service quota indisponible, réessayez plus tard.' });
        }
        if (!videoQuota?.allowed) {
          return res.status(429).json({
            error: true,
            message: 'Limite quotidienne vidéo atteinte',
            quota: videoQuota
          });
        }
      }

      fs.mkdirSync(framesCoarseDir, { recursive: true });
      fs.mkdirSync(framesBurstDir, { recursive: true });

      const startedAt = Date.now();

      // 1) Coarse pass: first VIDEO_MAX_SECONDS seconds
      const coarseOutPattern = path.join(framesCoarseDir, 'frame-%03d.jpg');
      await runFfmpeg([
        '-ss', '0',
        '-t', String(VIDEO_MAX_SECONDS),
        '-i', videoPath,
        '-vf', fpsFilterValue(COARSE_FPS),
        '-q:v', '2',
        coarseOutPattern
      ]);

      const coarseFrames = listFrameFiles(framesCoarseDir);
      if (coarseFrames.length === 0) {
        throw new Error('Aucune frame extraite');
      }

      const analyzed = [];
      let analyzedCount = 0;

      for (let idx = 0; idx < coarseFrames.length && analyzedCount < MAX_TOTAL_FRAMES; idx++) {
        const framePath = coarseFrames[idx];
        const tsSeconds = COARSE_FPS > 0 ? (idx / COARSE_FPS) : null;
        const r = await analyzer.analyzeImage(framePath, {
          filename: `video-frame-${idx}.jpg`,
          size: 0,
          mimetype: 'image/jpeg',
          userId: req.user.id,
          source: 'video',
          sourceType: 'video_frame',
          documentName: sanitizeFilename(req.file.originalname),
          documentPage: tsSeconds != null ? String(Math.round(tsSeconds * 1000)) : null
        });
        analyzed.push({
          idx,
          ts_seconds: tsSeconds,
          combined_score: r.combined_score,
          confidence_level: r.confidence_level,
          is_ai_generated: r.is_ai_generated,
          engines: r.engines
        });
        analyzedCount++;
      }

      // 2) Burst pass around suspicious timestamps
      const aiThreshold = (() => {
        const v = Number.parseFloat(process.env.AI_DECISION_THRESHOLD || '0.7');
        return Number.isFinite(v) && v > 0 && v < 1 ? v : 0.7;
      })();

      const suspects = analyzed
        .filter(x => x.combined_score != null && x.combined_score >= aiThreshold)
        .sort((a, b) => (b.combined_score || 0) - (a.combined_score || 0))
        .slice(0, BURST_TOP_K);

      for (const s of suspects) {
        if (analyzedCount >= MAX_TOTAL_FRAMES) break;
        const center = Number.isFinite(s.ts_seconds) ? s.ts_seconds : 0;
        const start = Math.max(0, center - (BURST_WINDOW_SECONDS / 2));
        const outPattern = path.join(framesBurstDir, `frame-${Math.round(center * 1000)}-%03d.jpg`);

        await runFfmpeg([
          '-ss', String(start),
          '-t', String(BURST_WINDOW_SECONDS),
          '-i', videoPath,
          '-vf', fpsFilterValue(BURST_FPS),
          '-q:v', '2',
          outPattern
        ]);

        const burstFiles = fs.readdirSync(framesBurstDir)
          .filter(f => f.startsWith(`frame-${Math.round(center * 1000)}-`) && f.endsWith('.jpg'))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map(f => path.join(framesBurstDir, f));

        for (let j = 0; j < burstFiles.length && analyzedCount < MAX_TOTAL_FRAMES; j++) {
          const framePath = burstFiles[j];
          const tsSeconds = start + (BURST_FPS > 0 ? (j / BURST_FPS) : 0);
          const r = await analyzer.analyzeImage(framePath, {
            filename: `video-frame-burst-${Math.round(center * 1000)}-${j}.jpg`,
            size: 0,
            mimetype: 'image/jpeg',
            userId: req.user.id,
            source: 'video',
            sourceType: 'video_frame',
            documentName: sanitizeFilename(req.file.originalname),
            documentPage: String(Math.round(tsSeconds * 1000))
          });
          analyzed.push({
            idx: analyzed.length,
            ts_seconds: tsSeconds,
            combined_score: r.combined_score,
            confidence_level: r.confidence_level,
            is_ai_generated: r.is_ai_generated,
            engines: r.engines
          });
          analyzedCount++;
        }
      }

      const validScores = analyzed.map(x => x.combined_score).filter(v => typeof v === 'number' && Number.isFinite(v));
      const average = validScores.length ? (validScores.reduce((s, v) => s + v, 0) / validScores.length) : null;
      const maxScore = validScores.length ? Math.max(...validScores) : null;
      const aiCount = analyzed.filter(x => x.is_ai_generated).length;
      const total = analyzed.length;

      const evidence = analyzed
        .filter(x => x.combined_score != null)
        .sort((a, b) => (b.combined_score || 0) - (a.combined_score || 0))
        .slice(0, 5);

      const durationMs = Date.now() - startedAt;

      return res.json({
        success: true,
        data: {
          video: {
            filename: sanitizeFilename(req.file.originalname),
            analyzed_seconds: VIDEO_MAX_SECONDS,
            sampling: {
              coarse_fps: COARSE_FPS,
              burst_fps: BURST_FPS,
              burst_window_seconds: BURST_WINDOW_SECONDS,
              max_frames: MAX_TOTAL_FRAMES,
              burst_top_k: BURST_TOP_K
            }
          },
          results: {
            total_frames: total,
            ai_frames_count: aiCount,
            ai_frames_ratio: total ? Number((aiCount / total).toFixed(4)) : 0,
            average_score: average,
            max_score: maxScore,
            overall_score: maxScore
          },
          evidence_frames: evidence,
          duration_ms: durationMs
        },
        quota: videoQuota
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
      });
    } finally {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      safeRmdirRecursive(workDir);
    }
  });
}));

module.exports = router;
