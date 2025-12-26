const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getPurposeCopy } = require('./report-purpose');

const REPORTS_DIR = path.join(__dirname, '..', 'uploads', 'reports');

const COLORS = {
  primary400: '#a78bfa',
  primary500: '#8b5cf6',
  primary600: '#7c3aed',
  accent400: '#e9d5ff',
  dark900: '#1e1932',
  dark950: '#0f0d1e',
  white: '#ffffff',
  gray300: '#d4d4d8',
  gray400: '#a1a1aa',
  gray500: '#71717a'
};

function drawPageChrome(doc, { titleRight }) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Background
  doc.save();
  doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.dark950);

  // Header
  const headerHeight = 96;
  doc.rect(0, 0, pageWidth, headerHeight).fill(COLORS.dark900);
  doc.rect(0, headerHeight - 3, pageWidth, 3).fill(COLORS.primary500);

  // Brand (left)
  const leftX = 50;
  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.white);
  doc.text('Fake', leftX, 28, { continued: true });
  doc.fillColor(COLORS.primary500).text('Tect');

  doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray300);
  doc.text('DETECTING AI FAKES', leftX, 54, { characterSpacing: 1.5 });

  // Title (right)
  const rightX = 50;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.white);
  doc.text(titleRight || "Rapport d'analyse", rightX, 30, { align: 'right' });

  doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray400);
  const now = new Date();
  doc.text(
    `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`,
    rightX,
    52,
    { align: 'right' }
  );

  doc.restore();

  // Move cursor below header
  doc.x = 50;
  doc.y = headerHeight + 24;
}

function drawGlassCard(doc, x, y, w, h, { borderColor = COLORS.primary500 } = {}) {
  doc.save();
  doc.roundedRect(x, y, w, h, 16).fillOpacity(0.08).fill(COLORS.white);
  doc.roundedRect(x, y, w, h, 16).lineWidth(1).strokeOpacity(0.35).stroke(borderColor);
  doc.restore();
}

function drawSectionTitle(doc, text) {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.accent400);
  doc.text(String(text).toUpperCase());
  doc.moveDown(0.6);
}

function drawBullets(doc, items, { x, width, color = COLORS.gray300, fontSize = 10, bullet = '•' } = {}) {
  if (!Array.isArray(items) || items.length === 0) return;
  doc.font('Helvetica').fontSize(fontSize).fillColor(color);
  for (const line of items) {
    doc.text(`${bullet} ${String(line)}`, x, doc.y, { width });
    doc.moveDown(0.2);
  }
}

function toPct(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function confidenceLabel(conf) {
  if (conf === 'high') return 'Haute';
  if (conf === 'medium') return 'Moyenne';
  if (conf === 'low') return 'Faible';
  return 'N/A';
}

function scoreColor(pct) {
  if (pct == null) return COLORS.gray400;
  if (pct >= 70) return '#ef4444';
  if (pct >= 40) return '#eab308';
  return '#22c55e';
}

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Générer un rapport PDF d'analyse
 */
async function generateReport(batchData, analyses) {
  return generateReportWithCertificate(batchData, analyses, null);
}

async function generateReportWithCertificate(batchData, analyses, certificate) {
  return new Promise((resolve, reject) => {
    try {
      const reportId = uuidv4();
      const filename = `rapport-${reportId.slice(0, 8)}.pdf`;
      const filePath = path.join(REPORTS_DIR, filename);
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Apply chrome on each page
      drawPageChrome(doc, { titleRight: certificate ? "Rapport certifié" : "Rapport d'analyse" });

      const pageLeft = 50;
      const contentWidth = doc.page.width - pageLeft * 2;

      // === SUMMARY CARD ===
      drawSectionTitle(doc, 'Résumé');
      
      const totalImages = analyses.length;
      const aiDetected = analyses.filter(a => a.is_ai_generated).length;
      const avgScore = analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + (a.combined_score || 0), 0) / analyses.length 
        : 0;

      const summaryCardY = doc.y;
      const summaryCardH = 140;
      drawGlassCard(doc, pageLeft, summaryCardY, contentWidth, summaryCardH);

      const padding = 18;
      let cursorY = summaryCardY + padding;
      doc.font('Helvetica').fontSize(11).fillColor(COLORS.gray300);
      doc.text(`Source: ${batchData.original_filename || 'Multiple images'}`, pageLeft + padding, cursorY);
      cursorY += 18;
      doc.text(`Type: ${batchData.source_type || 'images'}`, pageLeft + padding, cursorY);
      cursorY += 18;
      doc.text(`Éléments analysés: ${totalImages}`, pageLeft + padding, cursorY);
      cursorY += 18;
      doc.text(`IA détectée: ${aiDetected} (${totalImages > 0 ? Math.round((aiDetected / totalImages) * 100) : 0}%)`, pageLeft + padding, cursorY);
      cursorY += 18;

      const avgPct = Math.round(avgScore * 100);
      doc.text(`Score moyen: ${avgPct}%`, pageLeft + padding, cursorY);

      // Verdict pill (right)
      const verdictColor = aiDetected === 0 ? '#22c55e' : aiDetected < totalImages / 2 ? '#eab308' : '#ef4444';
      const verdictText = aiDetected === 0
        ? 'Authentique (aucune IA détectée)'
        : aiDetected < totalImages / 2
          ? 'Mixte (quelques IA détectées)'
          : 'IA dominante (majorité détectée)';

      const pillW = 230;
      const pillH = 34;
      const pillX = pageLeft + contentWidth - pillW - padding;
      const pillY = summaryCardY + padding;
      doc.save();
      doc.roundedRect(pillX, pillY, pillW, pillH, 12).fillOpacity(0.18).fill(verdictColor);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white);
      doc.text(verdictText, pillX + 12, pillY + 10, { width: pillW - 24, align: 'center' });
      doc.restore();

      doc.y = summaryCardY + summaryCardH + 18;

      // === PURPOSE (dynamic) ===
      if (certificate?.purpose) {
        const copy = getPurposeCopy(certificate.purpose);
        drawSectionTitle(doc, `Contexte & recommandations — ${copy.label}`);

        const purposeCardY = doc.y;
        const purposeCardH = 220;
        drawGlassCard(doc, pageLeft, purposeCardY, contentWidth, purposeCardH);

        const colGap = 18;
        const innerPad = 16;
        const colW = (contentWidth - innerPad * 2 - colGap) / 2;
        const leftX = pageLeft + innerPad;
        const rightX = pageLeft + innerPad + colW + colGap;
        let leftY = purposeCardY + innerPad;
        let rightY = purposeCardY + innerPad;

        // Left column
        doc.y = leftY;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.primary400);
        doc.text('Contexte', leftX, doc.y, { width: colW });
        doc.moveDown(0.4);
        drawBullets(doc, copy.context, { x: leftX, width: colW, fontSize: 9.5 });
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.primary400);
        doc.text('Méthode', leftX, doc.y, { width: colW });
        doc.moveDown(0.4);
        drawBullets(doc, copy.methodology, { x: leftX, width: colW, fontSize: 9.5 });
        leftY = doc.y;

        // Right column
        doc.y = rightY;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.primary400);
        doc.text('Recommandations', rightX, doc.y, { width: colW });
        doc.moveDown(0.4);
        drawBullets(doc, copy.recommendations, { x: rightX, width: colW, fontSize: 9.5 });
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.primary400);
        doc.text('Limites', rightX, doc.y, { width: colW });
        doc.moveDown(0.4);
        drawBullets(doc, copy.limitations, { x: rightX, width: colW, fontSize: 9.5, color: COLORS.gray400 });
        rightY = doc.y;

        doc.y = purposeCardY + purposeCardH + 18;
      }
      
      // === DETAILS ===
      drawSectionTitle(doc, 'Détail des analyses');

      for (let i = 0; i < analyses.length; i++) {
        const analysis = analyses[i];
        const score = toPct(analysis.combined_score) ?? 0;
        const isAI = analysis.is_ai_generated;
        
        // Nouvelle page si nécessaire
        if (doc.y > 690) {
          doc.addPage();
          drawPageChrome(doc, { titleRight: certificate ? 'Rapport certifié' : "Rapport d'analyse" });
        }
        
        const boxY = doc.y;
        const boxH = 78;
        drawGlassCard(doc, pageLeft, boxY, contentWidth, boxH, { borderColor: isAI ? '#ef4444' : COLORS.primary500 });
        
        // Index + filename
        doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white);
        doc.text(`#${i + 1}`, pageLeft + 14, boxY + 14);
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.gray300);
        doc.text(analysis.filename || `Fichier ${i + 1}`, pageLeft + 44, boxY + 14, { width: 300, ellipsis: true });
        
        // Score
        const sColor = scoreColor(score);
        doc.font('Helvetica-Bold').fontSize(20).fillColor(sColor);
        doc.text(`${score}%`, pageLeft + contentWidth - 120, boxY + 12, { width: 100, align: 'right' });
        
        // Détails
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray400);
        const seScore = analysis.sightengine_score != null ? Math.round(analysis.sightengine_score * 100) + '%' : 'N/A';
        const ilScore = analysis.illuminarty_score != null ? Math.round(analysis.illuminarty_score * 100) + '%' : 'N/A';
        doc.text(`Sightengine: ${seScore}   |   Illuminarty: ${ilScore}`, pageLeft + 14, boxY + 42);
        
        // Confiance
        const confText = confidenceLabel(analysis.confidence_level);
        doc.text(`Confiance: ${confText}`, pageLeft + 14, boxY + 56);
        
        // EXIF warning si présent
        if (analysis.exif_has_ai_markers) {
          doc.font('Helvetica-Bold').fillColor('#ef4444').text('Métadonnées IA détectées', pageLeft + 230, boxY + 56);
        }
        
        // Verdict
        doc.font('Helvetica-Bold').fontSize(10).fillColor(isAI ? '#ef4444' : '#22c55e');
        doc.text(isAI ? 'IA' : 'Authentique', pageLeft + contentWidth - 120, boxY + 50, { width: 100, align: 'right' });
        
        doc.y = boxY + boxH + 14;
      }

      // === CERTIFICATION PAGE ===
      if (certificate) {
        doc.addPage();

        drawPageChrome(doc, { titleRight: 'Certification' });
        drawSectionTitle(doc, 'Certification & Traçabilité');

        const cardY = doc.y;
        const cardH = 250;
        drawGlassCard(doc, pageLeft, cardY, contentWidth, cardH);

        const cx = pageLeft + padding;
        let cy = cardY + padding;
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.gray300);
        doc.text("Ce rapport inclut des éléments d'intégrité permettant de vérifier que les résultats n'ont pas été modifiés après génération.", cx, cy, { width: contentWidth - padding * 2 });
        cy += 42;

        doc.font('Helvetica-Bold').fillColor(COLORS.accent400).text('Identifiant', cx, cy);
        doc.font('Helvetica').fillColor(COLORS.gray300).text(certificate.id || 'N/A', cx + 110, cy);
        cy += 18;

        if (certificate.generated_at) {
          doc.font('Helvetica-Bold').fillColor(COLORS.accent400).text('Généré le', cx, cy);
          doc.font('Helvetica').fillColor(COLORS.gray300).text(String(certificate.generated_at), cx + 110, cy);
          cy += 18;
        }

        if (certificate.purpose) {
          doc.font('Helvetica-Bold').fillColor(COLORS.accent400).text('Contexte', cx, cy);
          doc.font('Helvetica').fillColor(COLORS.gray300).text(String(certificate.purpose), cx + 110, cy);
          cy += 18;
        }

        if (certificate.payload_hash) {
          doc.font('Helvetica-Bold').fillColor(COLORS.accent400).text('Hash résultats', cx, cy);
          doc.font('Helvetica').fillColor(COLORS.gray300).text(String(certificate.payload_hash), cx + 110, cy, { width: contentWidth - 110 - padding * 2 });
          cy += 30;
        }

        if (certificate.pdf_hash) {
          doc.font('Helvetica-Bold').fillColor(COLORS.accent400).text('Hash PDF', cx, cy);
          doc.font('Helvetica').fillColor(COLORS.gray300).text(String(certificate.pdf_hash), cx + 110, cy, { width: contentWidth - 110 - padding * 2 });
          cy += 30;
        }

        doc.font('Helvetica-Bold').fillColor(COLORS.accent400).text('Signature', cx, cy);
        if (certificate.signature && certificate.alg) {
          doc.font('Helvetica').fillColor(COLORS.gray300).text(`${certificate.alg} ${String(certificate.signature)}`, cx + 110, cy, { width: contentWidth - 110 - padding * 2 });
        } else {
          doc.font('Helvetica').fillColor(COLORS.gray300).text('Non disponible (CERT_SIGNING_SECRET non configuré)', cx + 110, cy, { width: contentWidth - 110 - padding * 2 });
        }
        cy += 44;

        if (certificate.verify_url) {
          doc.font('Helvetica-Bold').fillColor(COLORS.accent400).text('Vérification', cx, cy);
          doc.font('Helvetica').fillColor(COLORS.gray300).text(String(certificate.verify_url), cx + 110, cy, { width: contentWidth - 110 - padding * 2 });
        }

        doc.y = cardY + cardH + 20;

        doc.font('Helvetica').fontSize(9).fillColor(COLORS.gray400);
        doc.text(
          "Avertissement: la détection est probabiliste et peut produire des faux positifs/négatifs. Ce document fournit des éléments techniques de traçabilité à la date de génération.",
          pageLeft,
          doc.y,
          { width: contentWidth }
        );
      }

      // Footer note (last page)
      doc.moveDown(2);
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.gray500);
      doc.text('FakeTect • Rapport généré automatiquement • Résultats indicatifs', pageLeft, doc.y, { width: contentWidth, align: 'center' });

      // Finaliser
      doc.end();

      stream.on('finish', () => {
        const stats = fs.statSync(filePath);
        resolve({
          success: true,
          reportId,
          filename,
          filePath,
          fileSize: stats.size
        });
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Supprimer un rapport
 */
function deleteReport(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // Ignorer
  }
}

module.exports = { generateReport, generateReportWithCertificate, deleteReport, REPORTS_DIR };
