import { jsPDF } from 'jspdf';
import { interpretResult, getSimpleMessage, getConfidenceMessage } from './resultInterpreter';

function safeText(v) { return v === null || v === undefined ? '' : String(v); }

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function pct1(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `${x.toFixed(1)}%`;
}

function formatDateTimeUtcISO(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mi = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}Z`;
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function sha256HexFromString(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}
async function sha256HexFromFile(file) {
  if (!file) return '';
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return toHex(digest);
}
function shortenHex(hex, head = 12, tail = 12) {
  const h = safeText(hex);
  if (!h) return '';
  if (h.length <= head + tail + 3) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

/** Dessine une loupe (vectoriel) : pas d'emoji, pas d'image externe */
function drawMagnifier(doc, x, y, size = 18) {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  // lentille
  doc.circle(x, y, size * 0.45, 'S');
  // manche
  doc.line(x + size * 0.32, y + size * 0.32, x + size * 0.75, y + size * 0.75);
}

/** Auto page break simple */
function ensureSpace(doc, y, needed, margin) {
  const h = doc.internal.pageSize.getHeight();
  if (y + needed > h - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

/** Bloc texte multi-lignes */
function writeBlock(doc, text, x, y, w, lineH = 12) {
  const lines = doc.splitTextToSize(text, w);
  doc.text(lines, x, y);
  return y + lines.length * lineH;
}

export async function downloadCertificatePdf({ t, analysis, user, file, currentLanguage = 'fr' }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

  const margin = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;

  const now = new Date();
  const analysisId = safeText(analysis?.id);
  const userName = safeText(user?.name || user?.email);
  const fileName = safeText(analysis?.fileName || analysis?.file_name || file?.name);
  const provider = safeText(analysis?.provider);

  // Details parsing
  const detailsObj = (() => {
    const d = analysis?.details;
    if (!d) return null;
    if (typeof d === 'string') { try { return JSON.parse(d); } catch { return { details: d }; } }
    return d;
  })();

  // Confidence (0-100)
  const confidenceValue = (() => {
    const v = analysis?.confidence ?? detailsObj?.confidence;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? clamp(n, 0, 100) : null;
  })();

  const verdictKey = safeText(analysis?.verdict?.key || analysis?.verdict);
  const verdictLabel = verdictKey ? t(`verdicts.${verdictKey}`, verdictKey.replaceAll('_', ' ')) : '';

  // IMPORTANT: cohérence des scores
  const aiScoreValue = analysis?.aiScore ?? analysis?.ai_score;
  const aiScoreNum = Number.isFinite(aiScoreValue) ? aiScoreValue : parseFloat(aiScoreValue);
  const aiScore = Number.isFinite(aiScoreNum) ? clamp(aiScoreNum, 0, 100) : 0;
  const authScore = clamp(100 - aiScore, 0, 100);

  // Interprétation
  const result = interpretResult(aiScore);
  const simpleMessage = getSimpleMessage(result.level, currentLanguage);
  const confidenceMsg = confidenceValue !== null ? getConfidenceMessage(confidenceValue, currentLanguage) : '';

  // Hash & fingerprint
  const fileHashFull = await sha256HexFromFile(file);
  const fileHashShort = shortenHex(fileHashFull);

  const fingerprintSource = JSON.stringify({
    analysisId,
    verdictKey,
    aiScore: aiScore.toFixed(1),
    provider,
    fileHash: fileHashFull || undefined,
    issuedAtUtc: formatDateTimeUtcISO(now)
  });
  const fingerprintFull = await sha256HexFromString(fingerprintSource);
  const fingerprint = shortenHex(fingerprintFull, 10, 10);

  // Legal text (French)
  const legalTextFR = [
    "1. Objet : Ce document constitue une attestation technique d'analyse d'authenticité réalisée par FakeTect. Il résulte d'un traitement algorithmique visant à détecter la présence de contenus générés ou manipulés par intelligence artificielle (IA) ou techniques de deepfake.",
    "2. Intégrité : L'empreinte numérique (SHA-256) garantit que le fichier analysé n'a pas été modifié depuis l'analyse. Toute altération invaliderait ce certificat.",
    "3. Valeur probatoire : Conformément au règlement eIDAS (UE) n°910/2014, ce document peut servir de moyen de preuve électronique. Toutefois, sa recevabilité en justice dépend de la législation nationale et de l'appréciation du juge.",
    "4. Cadre UE : L'analyse respecte les principes de transparence et de traçabilité des systèmes d'IA prévus par le règlement IA (AI Act). Les scores indiqués reflètent une probabilité statistique, non une certitude absolue.",
    "5. Limites : Ce certificat n'est pas un horodatage qualifié ni une signature électronique qualifiée au sens d'eIDAS. Pour une valeur probatoire renforcée, un horodatage ou une signature qualifiée peut être appliqué a posteriori."
  ].join('\n\n');

  // Legal text (English)
  const legalTextEN = [
    "1. Purpose: This document constitutes a technical certificate of authenticity analysis performed by FakeTect. It results from algorithmic processing aimed at detecting content generated or manipulated by artificial intelligence (AI) or deepfake techniques.",
    "2. Integrity: The digital fingerprint (SHA-256) ensures that the analyzed file has not been modified since the analysis. Any alteration would invalidate this certificate.",
    "3. Evidential value: In accordance with eIDAS Regulation (EU) No 910/2014, this document may serve as electronic evidence. However, its admissibility in court depends on national legislation and judicial discretion.",
    "4. EU framework: The analysis complies with transparency and traceability principles for AI systems as set out in the AI Act. The indicated scores reflect statistical probability, not absolute certainty.",
    "5. Limitations: This certificate is not a qualified timestamp or qualified electronic signature within the meaning of eIDAS. For enhanced evidential value, a qualified timestamp or signature may be applied subsequently."
  ].join('\n\n');

  const legalText = currentLanguage === 'fr' ? legalTextFR : legalTextEN;

  // ========= HEADER =========
  doc.setFillColor(67, 56, 202);
  doc.rect(0, 0, pageW, 150, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageW, 6, 'F');

  // loupe + marque
  drawMagnifier(doc, margin + 14, 40, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('FakeTect', margin + 44, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(224, 231, 255);
  doc.text(
    currentLanguage === 'fr' ? "Certificat d'analyse d'authenticité (IA / Deepfake)" : "Authenticity Certificate (AI / Deepfake)",
    margin + 44,
    68
  );

  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text(`${currentLanguage === 'fr' ? 'Émis le (UTC)' : 'Issued (UTC)'}: ${formatDateTimeUtcISO(now)}`, margin + 44, 86);
  if (analysisId) doc.text(`${currentLanguage === 'fr' ? 'ID analyse' : 'Analysis ID'}: ${analysisId}`, margin + 44, 100);

  // Badge "DOCUMENT TECHNIQUE"
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(67, 56, 202);
  doc.roundedRect(pageW - margin - 140, 24, 140, 26, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const badgeText = currentLanguage === 'fr' ? 'DOCUMENT TECHNIQUE' : 'TECHNICAL DOCUMENT';
  const badgeWidth = doc.getTextWidth(badgeText);
  doc.text(badgeText, pageW - margin - 70 - badgeWidth/2, 41);

  let y = 170;

  // ========= RESULT CARD =========
  y = ensureSpace(doc, y, 180, margin);
  
  // Card colors based on result
  const cardBg = { real: [236, 253, 245], uncertain: [255, 251, 235], fake: [254, 242, 242] };
  const cardAccent = { real: [16, 185, 129], uncertain: [245, 158, 11], fake: [239, 68, 68] };
  const cardDark = { real: [6, 95, 70], uncertain: [120, 53, 15], fake: [127, 29, 29] };
  
  const bg = cardBg[result.level];
  const accent = cardAccent[result.level];
  const dark = cardDark[result.level];
  
  // Shadow
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(margin + 3, y + 3, contentW, 160, 10, 10, 'F');
  
  // Card
  doc.setFillColor(...bg);
  doc.setDrawColor(...accent);
  doc.setLineWidth(2);
  doc.roundedRect(margin, y, contentW, 160, 10, 10, 'FD');
  
  // Verdict badge (top-left corner)
  doc.setFillColor(...accent);
  doc.roundedRect(margin + 16, y + 12, 90, 24, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  const vText = verdictLabel.toUpperCase();
  const vW = doc.getTextWidth(vText);
  doc.text(vText, margin + 16 + (90 - vW)/2, y + 27);
  
  // Title (no emoji for PDF stability)
  const yTitle = y + 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...dark);
  const titleText = simpleMessage.title;
  const titleW = doc.getTextWidth(titleText);
  doc.text(titleText, (pageW - titleW)/2, yTitle);
  
  // Score bar
  const yBar = yTitle + 25;
  const barW = contentW - 100;
  const barX = margin + 50;
  const barH = 18;
  
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(barX, yBar, barW, barH, 9, 9, 'F');
  
  const fillW = (barW * authScore) / 100;
  doc.setFillColor(...accent);
  doc.roundedRect(barX, yBar, fillW, barH, 9, 9, 'F');
  
  // Percentage on bar
  if (fillW > 40) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(pct1(authScore), barX + fillW - 30, yBar + 12);
  }
  
  // Labels
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('100% RÉEL', barX, yBar + barH + 10);
  const label100 = '100% IA';
  const w100 = doc.getTextWidth(label100);
  doc.text(label100, barX + barW - w100, yBar + barH + 10);
  
  // Explanation
  const yExpl = yBar + barH + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const explLines = doc.splitTextToSize(simpleMessage.explanation, contentW - 40);
  doc.text(explLines, margin + 20, yExpl);
  
  y += 180;

  // ========= TECHNICAL TABLE =========
  y = ensureSpace(doc, y + 15, 140, margin);
  
  // Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  const techH = 140;
  doc.roundedRect(margin, y, contentW, techH, 8, 8, 'FD');
  
  // Title bar
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, y, contentW, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(67, 56, 202);
  doc.text(currentLanguage === 'fr' ? 'Analyse technique' : 'Technical analysis', margin + 12, y + 19);
  
  let yRow = y + 45;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  
  const techRows = [
    [t('certificate.fields.analysisId', 'Analysis ID'), analysisId || '—'],
    [t('certificate.fields.file', 'File'), fileName || '—'],
    [t('certificate.fields.sha256', 'SHA-256'), fileHashShort || '—'],
    [t('certificate.fields.fingerprint', 'Fingerprint'), fingerprint || '—'],
    [t('certificate.fields.verdict', 'Verdict'), verdictLabel || '—'],
    [t('certificate.fields.aiScore', 'AI Score'), pct1(aiScore)],
    [t('certificate.fields.authScore', 'Authenticity'), pct1(authScore)]
  ];
  
  if (provider) techRows.push([t('certificate.fields.provider', 'Provider'), provider]);
  if (confidenceValue !== null) techRows.push([t('certificate.fields.confidence', 'Confidence'), pct1(confidenceValue)]);
  
  const labelW = 90;
  for (const [label, value] of techRows) {
    if (yRow > y + techH - 10) break;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin + 12, yRow);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const valLines = doc.splitTextToSize(safeText(value), contentW - labelW - 30);
    doc.text(valLines, margin + 12 + labelW, yRow);
    
    yRow += 14;
  }
  
  y += techH + 20;

  // ========= LEGAL SECTION =========
  y = ensureSpace(doc, y, 180, margin);
  
  // Green legal box
  const legalH = 200;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(2);
  doc.roundedRect(margin, y, contentW, legalH, 8, 8, 'FD');
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  const legalTitle = currentLanguage === 'fr' ? 'Attestation & analyse juridique' : 'Certificate & legal analysis';
  doc.text(legalTitle, margin + 12, y + 20);
  
  // Legal text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  const legalLines = doc.splitTextToSize(legalText, contentW - 24);
  let yLegal = y + 35;
  
  for (const line of legalLines) {
    if (yLegal > y + legalH - 10) {
      doc.addPage();
      yLegal = margin;
    }
    doc.text(line, margin + 12, yLegal);
    yLegal += 10;
  }
  
  y += legalH + 20;
  
  // Confidence message if available
  if (confidenceMsg) {
    y = ensureSpace(doc, y, 30, margin);
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, contentW, 30, 6, 6, 'FD');
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const confLines = doc.splitTextToSize(confidenceMsg, contentW - 20);
    doc.text(confLines, margin + 10, y + 15);
    
    y += 40;
  }

  // ========= FOOTER =========
  const footerY = pageH - 50;
  
  doc.setFillColor(67, 56, 202);
  doc.rect(0, footerY, pageW, 50, 'F');
  
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(2);
  doc.line(0, footerY, pageW, footerY);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const footerLogo = 'FakeTect';
  const footerLogoW = doc.getTextWidth(footerLogo);
  doc.text(footerLogo, (pageW - footerLogoW)/2, footerY + 18);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  const footerText = currentLanguage === 'fr' 
    ? 'Détection IA & Deepfakes • www.faketect.com'
    : 'AI & Deepfake Detection • www.faketect.com';
  const footerTextW = doc.getTextWidth(footerText);
  doc.text(footerText, (pageW - footerTextW)/2, footerY + 30);
  
  doc.setFontSize(7);
  doc.setTextColor(165, 180, 252);
  const footerNote = currentLanguage === 'fr'
    ? 'Note : Pour horodatage/signature qualifié(e) eIDAS, contactez-nous'
    : 'Note: For qualified eIDAS timestamp/signature, contact us';
  const footerNoteW = doc.getTextWidth(footerNote);
  doc.text(footerNote, (pageW - footerNoteW)/2, footerY + 40);

  const filename = analysisId ? `faketect-certificate-${analysisId}.pdf` : 'faketect-certificate.pdf';
  doc.save(filename);
}
