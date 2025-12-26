const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const CERTS_DIR = path.join(__dirname, '..', 'uploads', 'certificates');

if (!fs.existsSync(CERTS_DIR)) {
  fs.mkdirSync(CERTS_DIR, { recursive: true });
}

// Couleurs FakeTect
const COLORS = {
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  dark: '#1e1932',
  darkest: '#0f0d1e',
  white: '#ffffff',
  gray: '#71717a',
  grayLight: '#d4d4d8',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444'
};

/**
 * Générer le verdict en français clair
 */
function getVerdict(score, language = 'fr') {
  const pct = Math.round(score * 100);
  
  if (pct >= 80) {
    return {
      verdict: language === 'fr' ? 'IMAGE FORTEMENT MANIPULÉE PAR IA' : 'HIGHLY AI-MANIPULATED IMAGE',
      color: COLORS.danger,
      icon: '⛔',
      shortLabel: language === 'fr' ? 'FAUX' : 'FAKE'
    };
  } else if (pct >= 60) {
    return {
      verdict: language === 'fr' ? 'IMAGE PROBABLEMENT MANIPULÉE' : 'LIKELY MANIPULATED IMAGE',
      color: COLORS.warning,
      icon: '⚠️',
      shortLabel: language === 'fr' ? 'SUSPECT' : 'SUSPECT'
    };
  } else if (pct >= 40) {
    return {
      verdict: language === 'fr' ? 'IMAGE POSSIBLEMENT ALTÉRÉE' : 'POSSIBLY ALTERED IMAGE',
      color: COLORS.warning,
      icon: '⚠️',
      shortLabel: language === 'fr' ? 'INCERTAIN' : 'UNCERTAIN'
    };
  } else {
    return {
      verdict: language === 'fr' ? 'IMAGE PROBABLEMENT AUTHENTIQUE' : 'LIKELY AUTHENTIC IMAGE',
      color: COLORS.success,
      icon: '✓',
      shortLabel: language === 'fr' ? 'AUTHENTIQUE' : 'AUTHENTIC'
    };
  }
}

/**
 * Explication pour grand public (vulgarisée)
 */
function getPublicExplanation(analysis, language = 'fr') {
  const score = analysis.combined_score || 0;
  const pct = Math.round(score * 100);
  const hasAIMarkers = analysis.exif_has_ai_markers;
  const detectedModel = analysis.illuminarty_model;
  
  if (language === 'en') {
    if (pct >= 80) {
      return `This image shows strong signs of AI manipulation (${pct}%). ` +
        (hasAIMarkers ? `The image metadata contains AI generation markers. ` : '') +
        (detectedModel ? `Our analysis detected traces of ${detectedModel} model. ` : '') +
        `This means the image was likely created or heavily modified by artificial intelligence software, not a real camera.`;
    } else if (pct >= 60) {
      return `This image shows several suspicious elements (${pct}%). ` +
        `Our analysis detected anomalies typical of AI-generated content. ` +
        `While we cannot be 100% certain, caution is advised before using this image as authentic proof.`;
    } else if (pct >= 40) {
      return `This image presents ambiguous results (${pct}%). ` +
        `Some elements suggest possible manipulation, but the evidence is not conclusive. ` +
        `Additional verification with other sources is recommended.`;
    } else {
      return `This image appears authentic (${pct}% AI probability). ` +
        `Our analysis found few signs of AI manipulation. ` +
        `The image likely comes from a real camera, though this does not guarantee it hasn't been edited by traditional software.`;
    }
  }
  
  // Version française
  if (pct >= 80) {
    return `Cette image présente de forts indices de manipulation par IA (${pct}%). ` +
      (hasAIMarkers ? `Les métadonnées de l'image contiennent des marqueurs de génération IA. ` : '') +
      (detectedModel ? `Notre analyse a détecté des traces du modèle ${detectedModel}. ` : '') +
      `Cela signifie que l'image a probablement été créée ou fortement modifiée par un logiciel d'intelligence artificielle, et non par un véritable appareil photo.`;
  } else if (pct >= 60) {
    return `Cette image présente plusieurs éléments suspects (${pct}%). ` +
      `Notre analyse a détecté des anomalies typiques des contenus générés par IA. ` +
      `Bien que nous ne puissions être certains à 100%, nous recommandons la prudence avant d'utiliser cette image comme preuve authentique.`;
  } else if (pct >= 40) {
    return `Cette image présente des résultats ambigus (${pct}%). ` +
      `Certains éléments suggèrent une possible manipulation, mais les preuves ne sont pas concluantes. ` +
      `Une vérification supplémentaire avec d'autres sources est recommandée.`;
  } else {
    return `Cette image semble authentique (${pct}% de probabilité IA). ` +
      `Notre analyse a trouvé peu de signes de manipulation par IA. ` +
      `L'image provient probablement d'un véritable appareil photo, bien que cela ne garantisse pas qu'elle n'ait pas été retouchée avec un logiciel traditionnel.`;
  }
}

/**
 * Explication technique pour experts
 */
function getTechnicalExplanation(analysis, language = 'fr') {
  const score = analysis.combined_score || 0;
  const pct = Math.round(score * 100);
  const sightengineScore = analysis.sightengine_score;
  const illuminartyScore = analysis.illuminarty_score;
  const confidence = analysis.confidence_level;
  const model = analysis.illuminarty_model;
  
  if (language === 'en') {
    let tech = `Technical Analysis:\n\n`;
    tech += `• Combined Score: ${pct}% (threshold: 70%)\n`;
    tech += `• Confidence Level: ${confidence || 'N/A'}\n`;
    
    if (sightengineScore !== null && sightengineScore !== undefined) {
      tech += `• SightEngine Score: ${Math.round(sightengineScore * 100)}%\n`;
    }
    if (illuminartyScore !== null && illuminartyScore !== undefined) {
      tech += `• Illuminarty Score: ${Math.round(illuminartyScore * 100)}%\n`;
    }
    if (model) {
      tech += `• Detected Model: ${model}\n`;
    }
    if (analysis.exif_has_ai_markers) {
      tech += `• EXIF AI Markers: Present\n`;
    }
    
    tech += `\nMethodology:\n`;
    tech += `Our system uses a multi-engine probabilistic approach combining:\n`;
    tech += `1. Deep learning analysis (neural network patterns)\n`;
    tech += `2. EXIF metadata verification (camera vs. software)\n`;
    tech += `3. Statistical anomaly detection (noise, compression artifacts)\n`;
    tech += `4. Model signature matching (Stable Diffusion, Midjourney, DALL-E, etc.)\n\n`;
    tech += `The combined score represents the weighted average of all detection engines.`;
    
    return tech;
  }
  
  // Version française
  let tech = `Analyse Technique :\n\n`;
  tech += `• Score Combiné : ${pct}% (seuil de décision : 70%)\n`;
  tech += `• Niveau de Confiance : ${confidence === 'high' ? 'Élevé' : confidence === 'medium' ? 'Moyen' : confidence === 'low' ? 'Faible' : 'N/A'}\n`;
  
  if (sightengineScore !== null && sightengineScore !== undefined) {
    tech += `• Score SightEngine : ${Math.round(sightengineScore * 100)}%\n`;
  }
  if (illuminartyScore !== null && illuminartyScore !== undefined) {
    tech += `• Score Illuminarty : ${Math.round(illuminartyScore * 100)}%\n`;
  }
  if (model) {
    tech += `• Modèle Détecté : ${model}\n`;
  }
  if (analysis.exif_has_ai_markers) {
    tech += `• Marqueurs EXIF IA : Présents\n`;
  }
  
  tech += `\nMéthodologie :\n`;
  tech += `Notre système utilise une approche probabiliste multi-moteurs combinant :\n`;
  tech += `1. Analyse par deep learning (patterns de réseaux neuronaux)\n`;
  tech += `2. Vérification des métadonnées EXIF (appareil photo vs. logiciel)\n`;
  tech += `3. Détection d'anomalies statistiques (bruit, artefacts de compression)\n`;
  tech += `4. Correspondance de signatures de modèles (Stable Diffusion, Midjourney, DALL-E, etc.)\n\n`;
  tech += `Le score combiné représente la moyenne pondérée de tous les moteurs de détection.`;
  
  return tech;
}

/**
 * Explication du pourcentage (pourquoi ce score ?)
 */
function getScoreJustification(analysis, language = 'fr') {
  const score = analysis.combined_score || 0;
  const pct = Math.round(score * 100);
  const sightengine = analysis.sightengine_score;
  const illuminarty = analysis.illuminarty_score;
  
  if (language === 'en') {
    let justif = `Why ${pct}%?\n\n`;
    
    if (sightengine !== null && illuminarty !== null) {
      const s = Math.round(sightengine * 100);
      const i = Math.round(illuminarty * 100);
      justif += `The score is calculated from:\n`;
      justif += `• SightEngine (visual analysis): ${s}%\n`;
      justif += `• Illuminarty (AI model detection): ${i}%\n`;
      justif += `• Combined weighted average: ${pct}%\n\n`;
    }
    
    if (pct >= 80) {
      justif += `This high score indicates multiple strong indicators of AI generation detected across different analysis methods.`;
    } else if (pct >= 60) {
      justif += `This elevated score suggests consistent anomalies across multiple detection engines.`;
    } else if (pct >= 40) {
      justif += `This mid-range score indicates conflicting signals between detection methods, suggesting ambiguity.`;
    } else {
      justif += `This low score means most detection engines found the image consistent with authentic camera output.`;
    }
    
    return justif;
  }
  
  // Version française
  let justif = `Pourquoi ${pct}% ?\n\n`;
  
  if (sightengine !== null && illuminarty !== null) {
    const s = Math.round(sightengine * 100);
    const i = Math.round(illuminarty * 100);
    justif += `Le score est calculé à partir de :\n`;
    justif += `• SightEngine (analyse visuelle) : ${s}%\n`;
    justif += `• Illuminarty (détection de modèle IA) : ${i}%\n`;
    justif += `• Moyenne pondérée combinée : ${pct}%\n\n`;
  }
  
  if (pct >= 80) {
    justif += `Ce score élevé indique la détection de multiples indicateurs forts de génération IA à travers différentes méthodes d'analyse.`;
  } else if (pct >= 60) {
    justif += `Ce score élevé suggère des anomalies cohérentes détectées par plusieurs moteurs de détection.`;
  } else if (pct >= 40) {
    justif += `Ce score intermédiaire indique des signaux contradictoires entre les méthodes de détection, suggérant une ambiguïté.`;
  } else {
    justif += `Ce score faible signifie que la plupart des moteurs de détection ont trouvé l'image cohérente avec une sortie d'appareil photo authentique.`;
  }
  
  return justif;
}

/**
 * Texte juridique d'attestation
 */
function getLegalStatement(certificateId, analysis, userProfile, language = 'fr') {
  const date = new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  const score = Math.round((analysis.combined_score || 0) * 100);
  const verdict = getVerdict(analysis.combined_score, language);
  
  if (language === 'en') {
    return `CERTIFICATE OF AUTHENTICITY ANALYSIS\n\n` +
      `Certificate ID: ${certificateId}\n` +
      `Issued on: ${date}\n` +
      `Issued by: FakeTect SAS - AI Detection Service\n\n` +
      `This certificate attests that the image "${analysis.filename || 'N/A'}" ` +
      `has been analyzed by our AI detection system and obtained a manipulation probability score of ${score}%.\n\n` +
      `OFFICIAL VERDICT: ${verdict.shortLabel}\n\n` +
      `This analysis is provided for informational purposes and constitutes technical expertise. ` +
      `The results are probabilistic and should not be considered absolute proof. ` +
      `FakeTect uses state-of-the-art technologies but cannot guarantee 100% accuracy.\n\n` +
      `This certificate is digitally signed and can be verified at:\n` +
      `https://faketect.com/verify/${certificateId}\n\n` +
      `Legal Notice: This document does not constitute legal advice. ` +
      `In case of legal dispute, we recommend consulting a legal expert specialized in digital evidence.`;
  }
  
  return `CERTIFICAT D'ANALYSE D'AUTHENTICITÉ\n\n` +
    `Numéro de certificat : ${certificateId}\n` +
    `Délivré le : ${date}\n` +
    `Délivré par : FakeTect SAS - Service de Détection IA\n\n` +
    `Le présent certificat atteste que l'image "${analysis.filename || 'N/A'}" ` +
    `a été analysée par notre système de détection d'IA et a obtenu un score de probabilité de manipulation de ${score}%.\n\n` +
    `VERDICT OFFICIEL : ${verdict.shortLabel}\n\n` +
    `Cette analyse est fournie à titre informatif et constitue une expertise technique. ` +
    `Les résultats sont de nature probabiliste et ne doivent pas être considérés comme une preuve absolue. ` +
    `FakeTect utilise des technologies de pointe mais ne peut garantir une précision de 100%.\n\n` +
    `Ce certificat est signé numériquement et vérifiable à l'adresse :\n` +
    `https://faketect.com/verify/${certificateId}\n\n` +
    `Mention légale : Ce document ne constitue pas un conseil juridique. ` +
    `En cas de litige légal, nous recommandons de consulter un expert juridique spécialisé en preuve numérique.`;
}

/**
 * Générer le certificat PDF premium
 */
async function generatePremiumCertificate(analysis, options = {}) {
  const {
    language = 'fr',
    userProfile = {},
    purpose = 'general'
  } = options;
  
  const certificateId = uuidv4();
  const filename = `certificate-${certificateId.slice(0, 8)}.pdf`;
  const filePath = path.join(CERTS_DIR, filename);
  
  // Générer le QR code
  const verifyUrl = `https://faketect.com/verify/${certificateId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: COLORS.primary,
      light: '#ffffff'
    }
  });
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 60,
        info: {
          Title: 'FakeTect - Certificat d\'Authenticité',
          Author: 'FakeTect SAS',
          Subject: `Analyse ${analysis.filename || 'image'}`,
          Keywords: 'AI detection, authenticity, certificate'
        }
      });
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 60;
      const contentWidth = pageWidth - (margin * 2);
      
      // === BACKGROUND ===
      doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.darkest);
      
      // === HEADER AVEC BORDURE DÉCORATIVE ===
      doc.rect(0, 0, pageWidth, 120).fill(COLORS.dark);
      doc.rect(0, 117, pageWidth, 3).fill(COLORS.primary);
      
      // Logo et titre
      doc.font('Helvetica-Bold').fontSize(28).fillColor(COLORS.white);
      doc.text('Fake', margin, 30, { continued: true });
      doc.fillColor(COLORS.primary).text('Tect');
      
      doc.font('Helvetica').fontSize(11).fillColor(COLORS.grayLight);
      doc.text('CERTIFICAT D\'ANALYSE D\'AUTHENTICITÉ', margin, 65, { align: 'left' });
      
      // ID du certificat (en haut à droite)
      doc.fontSize(9).fillColor(COLORS.gray);
      doc.text(`ID: ${certificateId.slice(0, 13)}`, margin, 30, { align: 'right' });
      doc.text(new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US'), margin, 45, { align: 'right' });
      
      // === VERDICT PRINCIPAL (GROS) ===
      let yPos = 160;
      const verdict = getVerdict(analysis.combined_score, language);
      const scorePct = Math.round((analysis.combined_score || 0) * 100);
      
      // Cadre verdict
      doc.roundedRect(margin, yPos, contentWidth, 140, 12)
        .fillAndStroke(COLORS.dark, verdict.color);
      
      // Icône + Verdict
      doc.font('Helvetica-Bold').fontSize(48).fillColor(verdict.color);
      doc.text(verdict.icon, margin + 30, yPos + 25, { width: 60, align: 'center' });
      
      doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.white);
      doc.text(verdict.shortLabel, margin + 110, yPos + 30);
      
      doc.font('Helvetica').fontSize(12).fillColor(COLORS.grayLight);
      doc.text(verdict.verdict, margin + 110, yPos + 58, { width: contentWidth - 120 });
      
      // Score géant
      doc.font('Helvetica-Bold').fontSize(60).fillColor(verdict.color);
      doc.text(`${scorePct}%`, margin + 110, yPos + 85);
      
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.gray);
      doc.text('Probabilité IA', margin + 240, yPos + 105);
      
      // === EXPLICATION GRAND PUBLIC ===
      yPos += 170;
      doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.primaryLight);
      doc.text('📖 EXPLICATION SIMPLE', margin, yPos);
      
      yPos += 25;
      const publicExpl = getPublicExplanation(analysis, language);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.grayLight);
      doc.text(publicExpl, margin, yPos, { width: contentWidth, align: 'justify', lineGap: 4 });
      
      // === NOUVELLE PAGE : TECHNIQUE ===
      doc.addPage();
      
      // Header page 2
      doc.rect(0, 0, pageWidth, 80).fill(COLORS.dark);
      doc.rect(0, 77, pageWidth, 3).fill(COLORS.primary);
      doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.white);
      doc.text('Analyse Technique Détaillée', margin, 30);
      
      yPos = 110;
      
      // === JUSTIFICATION DU SCORE ===
      doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.primaryLight);
      doc.text('🔬 POURQUOI CE SCORE ?', margin, yPos);
      
      yPos += 25;
      const justification = getScoreJustification(analysis, language);
      doc.font('Courier').fontSize(9).fillColor(COLORS.grayLight);
      doc.text(justification, margin, yPos, { width: contentWidth - 150, lineGap: 3 });
      
      // === QR CODE (à droite) ===
      const qrX = pageWidth - margin - 130;
      const qrY = 110;
      
      doc.roundedRect(qrX - 10, qrY - 10, 150, 180, 8).fill(COLORS.white);
      
      // Convertir le Data URL en buffer
      const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, qrX, qrY, { width: 130, height: 130 });
      
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.dark);
      doc.text('Vérifier en ligne', qrX, qrY + 140, { width: 130, align: 'center' });
      doc.fontSize(7).fillColor(COLORS.gray);
      doc.text('Scannez ce QR code', qrX, qrY + 155, { width: 130, align: 'center' });
      
      // === EXPLICATION TECHNIQUE ===
      yPos += 180;
      doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.primaryLight);
      doc.text('⚙️ DÉTAILS TECHNIQUES', margin, yPos);
      
      yPos += 25;
      const techExpl = getTechnicalExplanation(analysis, language);
      doc.font('Courier').fontSize(8).fillColor(COLORS.grayLight);
      doc.text(techExpl, margin, yPos, { width: contentWidth - 150, lineGap: 2 });
      
      // === NOUVELLE PAGE : JURIDIQUE ===
      doc.addPage();
      
      // Header page 3
      doc.rect(0, 0, pageWidth, 80).fill(COLORS.dark);
      doc.rect(0, 77, pageWidth, 3).fill(COLORS.primary);
      doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.white);
      doc.text('Attestation Juridique', margin, 30);
      
      yPos = 110;
      
      // === TEXTE JURIDIQUE ===
      doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.primaryLight);
      doc.text('⚖️ DÉCLARATION LÉGALE', margin, yPos);
      
      yPos += 25;
      const legalText = getLegalStatement(certificateId, analysis, userProfile, language);
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.grayLight);
      doc.text(legalText, margin, yPos, { width: contentWidth, align: 'justify', lineGap: 4 });
      
      // === SIGNATURE NUMÉRIQUE ===
      yPos = pageHeight - 180;
      doc.roundedRect(margin, yPos, contentWidth, 100, 8)
        .fillOpacity(0.1).fill(COLORS.primary)
        .strokeOpacity(0.5).stroke(COLORS.primary);
      
      doc.fillOpacity(1);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white);
      doc.text('Signé numériquement par FakeTect SAS', margin + 20, yPos + 20);
      
      doc.font('Courier').fontSize(8).fillColor(COLORS.gray);
      doc.text(`Hash: ${certificateId}`, margin + 20, yPos + 40);
      doc.text(`Timestamp: ${new Date().toISOString()}`, margin + 20, yPos + 55);
      doc.text(`Verify at: https://faketect.com/verify/${certificateId}`, margin + 20, yPos + 70);
      
      // === FOOTER ===
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray);
      doc.text('FakeTect SAS - Détection IA professionnelle | contact@faketect.com | faketect.com', 
        margin, pageHeight - 40, { align: 'center', width: contentWidth });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve({
          certificateId,
          filename,
          filePath,
          verifyUrl,
          verdict: verdict.shortLabel,
          score: scorePct
        });
      });
      
      stream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generatePremiumCertificate,
  getVerdict,
  getPublicExplanation,
  getTechnicalExplanation,
  getScoreJustification,
  getLegalStatement
};
