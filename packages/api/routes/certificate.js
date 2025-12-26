const express = require('express');
const { generatePremiumCertificate } = require('../services/premium-certificate');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// If Supabase admin isn't configured, don't crash the process.
router.use((req, res, next) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: 'Service indisponible',
      message: 'Supabase non configuré (variables Render manquantes)'
    });
  }
  next();
});

const supabase = supabaseAdmin;

/**
 * POST /api/certificate/generate
 * Générer un certificat premium pour une analyse
 */
router.post('/generate', optionalAuthMiddleware, async (req, res) => {
  try {
    const { analysisId, language = 'fr', purpose = 'general' } = req.body;
    
    if (!analysisId) {
      return res.status(400).json({ 
        error: 'ID d\'analyse requis',
        message: 'Veuillez fournir un analysisId'
      });
    }
    
    // Récupérer l'analyse depuis Supabase
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();
    
    if (fetchError || !analysis) {
      return res.status(404).json({ 
        error: 'Analyse introuvable',
        message: 'Aucune analyse trouvée avec cet ID'
      });
    }
    
    // Vérifier que l'utilisateur a le droit d'accéder à cette analyse
    if (req.user && analysis.user_id && analysis.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: 'Vous n\'avez pas accès à cette analyse'
      });
    }
    
    // Générer le certificat premium
    const certificate = await generatePremiumCertificate(analysis, {
      language,
      purpose,
      userProfile: req.user || {}
    });
    
    // Enregistrer le certificat dans la base de données
    const { data: savedCert, error: saveError } = await supabase
      .from('certificates')
      .insert({
        id: certificate.certificateId,
        analysis_id: analysisId,
        user_id: req.user?.id || null,
        verdict: certificate.verdict,
        score: certificate.score,
        file_path: certificate.filePath,
        verify_url: certificate.verifyUrl,
        language,
        purpose,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Erreur sauvegarde certificat:', saveError);
      // Continue quand même, le PDF est généré
    }
    
    res.json({
      success: true,
      certificate: {
        id: certificate.certificateId,
        filename: certificate.filename,
        downloadUrl: `/api/certificate/download/${certificate.certificateId}`,
        verifyUrl: certificate.verifyUrl,
        verdict: certificate.verdict,
        score: certificate.score
      }
    });
    
  } catch (error) {
    console.error('Erreur génération certificat:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Impossible de générer le certificat'
    });
  }
});

/**
 * GET /api/certificate/download/:certificateId
 * Télécharger un certificat PDF
 */
router.get('/download/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    // Récupérer le certificat depuis la base
    const { data: cert, error: fetchError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();
    
    if (fetchError || !cert) {
      return res.status(404).json({ 
        error: 'Certificat introuvable',
        message: 'Aucun certificat trouvé avec cet ID'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(cert.file_path)) {
      return res.status(404).json({ 
        error: 'Fichier introuvable',
        message: 'Le fichier PDF du certificat n\'existe plus'
      });
    }
    
    // Envoyer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="faketect-certificate-${certificateId.slice(0, 8)}.pdf"`);
    
    const fileStream = fs.createReadStream(cert.file_path);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Erreur téléchargement certificat:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Impossible de télécharger le certificat'
    });
  }
});

/**
 * GET /api/certificate/verify/:certificateId
 * Vérifier l'authenticité d'un certificat
 */
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const { data: cert, error: fetchError } = await supabase
      .from('certificates')
      .select(`
        *,
        analysis:analyses(
          filename,
          combined_score,
          confidence_level,
          is_ai_generated,
          created_at
        )
      `)
      .eq('id', certificateId)
      .single();
    
    if (fetchError || !cert) {
      return res.status(404).json({ 
        valid: false,
        error: 'Certificat introuvable',
        message: 'Aucun certificat trouvé avec cet ID'
      });
    }
    
    res.json({
      valid: true,
      certificate: {
        id: cert.id,
        verdict: cert.verdict,
        score: cert.score,
        createdAt: cert.created_at,
        analysis: {
          filename: cert.analysis?.filename,
          score: cert.analysis?.combined_score,
          confidence: cert.analysis?.confidence_level,
          isAI: cert.analysis?.is_ai_generated,
          analyzedAt: cert.analysis?.created_at
        },
        verifyUrl: cert.verify_url
      }
    });
    
  } catch (error) {
    console.error('Erreur vérification certificat:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Erreur serveur',
      message: 'Impossible de vérifier le certificat'
    });
  }
});

/**
 * GET /api/certificate/list
 * Lister les certificats de l'utilisateur connecté
 */
router.get('/list', optionalAuthMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Non authentifié',
        message: 'Connexion requise pour voir vos certificats'
      });
    }
    
    const { data: certificates, error: fetchError } = await supabase
      .from('certificates')
      .select(`
        *,
        analysis:analyses(filename, combined_score)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (fetchError) {
      throw fetchError;
    }
    
    res.json({
      success: true,
      certificates: certificates.map(cert => ({
        id: cert.id,
        verdict: cert.verdict,
        score: cert.score,
        filename: cert.analysis?.filename,
        createdAt: cert.created_at,
        downloadUrl: `/api/certificate/download/${cert.id}`,
        verifyUrl: cert.verify_url
      }))
    });
    
  } catch (error) {
    console.error('Erreur liste certificats:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: 'Impossible de récupérer la liste des certificats'
    });
  }
});

module.exports = router;
