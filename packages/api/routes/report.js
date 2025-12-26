const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { getBatchWithAnalyses, getAnalysis, saveReport, saveCertificate, getCertificate } = require('../config/supabase');
const pdfReport = require('../services/pdf-report');
const certification = require('../services/certification');

const router = express.Router();

function normalizePurpose(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (['media', 'médias', 'presse', 'journalisme'].includes(v)) return 'media_presse';
  if (['assurance', 'assurances'].includes(v)) return 'assurances';
  if (['rh', 'recrutement', 'hr'].includes(v)) return 'recrutement_rh';
  if (['banque', 'banques', 'fintech', 'kyc'].includes(v)) return 'banques_fintech';
  if (['juridique', 'legal', 'investigation', 'enquete', 'enquête'].includes(v)) return 'juridique_investigations';
  return v.slice(0, 64);
}

/**
 * POST /api/report/generate/:batchId - Générer un rapport PDF
 */
router.post('/generate/:batchId', async (req, res) => {
  // protected
  return authMiddleware(req, res, async () => {
  try {
    const batch = await getBatchWithAnalyses(req.params.batchId, req.user.id);
    
    if (!batch) {
      return res.status(404).json({ error: true, message: 'Batch non trouvé' });
    }

    if (!batch.analyses || batch.analyses.length === 0) {
      return res.status(400).json({ error: true, message: 'Aucune analyse dans ce batch' });
    }

    console.log(`📊 Génération rapport pour batch ${req.params.batchId}`);

    const certificateId = uuidv4();
    const generatedAt = new Date().toISOString();
    const purpose = normalizePurpose(req.body?.purpose || req.body?.use_case || req.body?.context);
    const payload = certification.createCertificatePayload({
      batch,
      analyses: batch.analyses,
      purpose,
      appVersion: '2.0.0',
      generatedAt,
      certificateId
    });
    const signed = certification.signCertificatePayload(payload);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const verifyUrl = `${baseUrl}/api/report/verify/${certificateId}`;

    const report = await pdfReport.generateReportWithCertificate(batch, batch.analyses, {
      id: certificateId,
      generated_at: generatedAt,
      purpose,
      payload_hash: signed.payload_hash,
      signature: signed.signature,
      alg: signed.alg,
      verify_url: verifyUrl
    });

    const pdfHash = certification.hashFileSha256Hex(report.filePath);

    // Sauvegarder le rapport en BDD
    const savedReport = await saveReport({
      user_id: req.user.id,
      batch_id: batch.id,
      filename: report.filename,
      file_size: report.fileSize
    });

    const reportId = savedReport?.data?.id || null;
    await saveCertificate({
      id: certificateId,
      user_id: req.user.id,
      batch_id: batch.id,
      report_id: reportId,
      purpose,
      version: 1,
      alg: signed.alg,
      payload,
      payload_hash: signed.payload_hash,
      signature: signed.signature,
      pdf_filename: report.filename,
      pdf_hash: pdfHash
    });

    res.json({
      success: true,
      report: {
        filename: report.filename,
        size: report.fileSize,
        download_url: `/api/report/download/${report.filename}`
      },
      certificate: {
        id: certificateId,
        verify_url: `/api/report/verify/${certificateId}`,
        payload_hash: signed.payload_hash,
        pdf_hash: pdfHash,
        alg: signed.alg,
        signed: !!signed.signed
      }
    });

  } catch (error) {
    console.error('Erreur génération rapport:', error);
    res.status(500).json({ error: true, message: error.message });
  }
  });
});

/**
 * POST /api/report/generate-analysis/:analysisId - Générer un rapport PDF certifié pour UNE analyse
 */
router.post('/generate-analysis/:analysisId', async (req, res) => {
  // protected
  return authMiddleware(req, res, async () => {
    try {
      const analysisId = String(req.params.analysisId || '').trim();
      if (!/^[a-f0-9-]{36}$/i.test(analysisId)) {
        return res.status(400).json({ error: true, message: 'Identifiant invalide' });
      }

      const analysis = await getAnalysis(req.user.id, analysisId);
      if (!analysis) return res.status(404).json({ error: true, message: 'Analyse introuvable' });

      const certificateId = uuidv4();
      const generatedAt = new Date().toISOString();
      const purpose = normalizePurpose(req.body?.purpose || req.body?.use_case || req.body?.context);

      const syntheticBatch = {
        id: null,
        name: `Analyse ${analysis.filename}`,
        source_type: analysis.source_type || 'image',
        original_filename: analysis.filename,
        total_images: 1
      };

      const payload = certification.createCertificatePayload({
        batch: syntheticBatch,
        analyses: [analysis],
        purpose,
        appVersion: '2.0.0',
        generatedAt,
        certificateId,
        subjectOverride: {
          analysis_id: analysis.id,
          analysis_created_at: analysis.created_at || null,
          source: analysis.source || null
        }
      });

      const signed = certification.signCertificatePayload(payload);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const verifyUrl = `${baseUrl}/api/report/verify/${certificateId}`;

      const report = await pdfReport.generateReportWithCertificate(syntheticBatch, [analysis], {
        id: certificateId,
        generated_at: generatedAt,
        purpose,
        payload_hash: signed.payload_hash,
        signature: signed.signature,
        alg: signed.alg,
        verify_url: verifyUrl
      });

      const pdfHash = certification.hashFileSha256Hex(report.filePath);

      const savedReport = await saveReport({
        user_id: req.user.id,
        batch_id: null,
        filename: report.filename,
        file_size: report.fileSize
      });

      const reportId = savedReport?.data?.id || null;
      await saveCertificate({
        id: certificateId,
        user_id: req.user.id,
        batch_id: null,
        report_id: reportId,
        purpose,
        version: 1,
        alg: signed.alg,
        payload,
        payload_hash: signed.payload_hash,
        signature: signed.signature,
        pdf_filename: report.filename,
        pdf_hash: pdfHash
      });

      return res.json({
        success: true,
        report: {
          filename: report.filename,
          size: report.fileSize,
          download_url: `/api/report/download/${report.filename}`
        },
        certificate: {
          id: certificateId,
          verify_url: `/api/report/verify/${certificateId}`,
          payload_hash: signed.payload_hash,
          pdf_hash: pdfHash,
          alg: signed.alg,
          signed: !!signed.signed
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
      });
    }
  });
});

/**
 * GET /api/report/download/:filename - Télécharger un rapport
 */
router.get('/download/:filename', async (req, res) => {
  // protected
  return authMiddleware(req, res, async () => {
  try {
    const rawName = String(req.params.filename || '');
    const filename = path.basename(rawName);
    if (!/^rapport-[a-f0-9]{8}\.pdf$/i.test(filename)) {
      return res.status(400).json({ error: true, message: 'Nom de fichier invalide' });
    }

    const baseDir = path.resolve(pdfReport.REPORTS_DIR);
    const filePath = path.resolve(path.join(baseDir, filename));
    if (!filePath.startsWith(baseDir + path.sep)) {
      return res.status(400).json({ error: true, message: 'Nom de fichier invalide' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: true, message: 'Rapport non trouvé' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    
    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
  });
});

/**
 * GET /api/report/verify/:certificateId - Vérifier un certificat (public)
 */
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const certificateId = String(req.params.certificateId || '').trim();
    if (!/^[a-f0-9-]{36}$/i.test(certificateId)) {
      return res.status(400).json({ error: true, message: 'Identifiant invalide' });
    }

    const cert = await getCertificate(certificateId);
    if (!cert) return res.status(404).json({ error: true, message: 'Certificat introuvable' });

    const payload = cert.payload || null;
    const signatureValid = cert.signature && payload
      ? certification.verifyCertificateSignature(payload, cert.signature)
      : false;

    const summary = payload?.results ? {
      total_items: payload.results.total_items,
      ai_detected_count: payload.results.ai_detected_count,
      average_score: payload.results.average_score != null ? Math.round(payload.results.average_score * 100) : null
    } : null;

    return res.json({
      success: true,
      certificate: {
        id: cert.id,
        created_at: cert.created_at,
        purpose: cert.purpose || payload?.purpose || null,
        version: cert.version || payload?.certificate_version || 1,
        alg: cert.alg || null,
        payload_hash: cert.payload_hash || null,
        pdf_filename: cert.pdf_filename || null,
        pdf_hash: cert.pdf_hash || null,
        signature: cert.signature || null,
        signature_valid: signatureValid,
        summary
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? String(error.message || error) : 'Erreur serveur'
    });
  }
});

module.exports = router;
