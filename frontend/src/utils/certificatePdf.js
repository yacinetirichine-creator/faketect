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

function formatDateHuman(date, lang = 'fr') {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', options);
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

/** Charge le logo en base64 pour l'intégrer au PDF */
async function loadLogoBase64() {
  try {
    const response = await fetch('/images/logo.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Dessine une loupe (vectoriel) : fallback si pas de logo */
function drawMagnifier(doc, x, y, size = 18) {
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.circle(x, y, size * 0.45, 'S');
  doc.line(x + size * 0.32, y + size * 0.32, x + size * 0.75, y + size * 0.75);
}

/** Dessine un QR code simplifié (placeholder visuel) */
function drawQRPlaceholder(doc, x, y, size, text) {
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(x, y, size, size, 'S');

  // Pattern simplifié
  const cellSize = size / 8;
  doc.setFillColor(0, 0, 0);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 3 === 0 || (i === 0 || i === 7 || j === 0 || j === 7)) {
        doc.rect(x + i * cellSize, y + j * cellSize, cellSize, cellSize, 'F');
      }
    }
  }

  // Texte sous le QR
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text(text, x + size/2, y + size + 8, { align: 'center' });
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

  // Glossaire pédagogique (FR)
  const glossaryFR = {
    title: "COMPRENDRE CE CERTIFICAT",
    intro: "Ce document atteste de l'analyse d'un fichier pour détecter s'il a été créé ou modifié par intelligence artificielle. Voici les termes clés :",
    terms: [
      { term: "Deepfake", def: "Contenu (image, vidéo, audio) créé ou modifié par IA pour faire croire à quelque chose de faux. Exemple : faire dire à une personne des propos qu'elle n'a jamais tenus." },
      { term: "Score IA", def: "Pourcentage indiquant la probabilité que le contenu soit généré par IA. Plus le score est élevé, plus il y a de chances que ce soit artificiel." },
      { term: "Score Authenticité", def: "L'inverse du score IA. Un score de 85% signifie 85% de chances que le contenu soit authentique/réel." },
      { term: "SHA-256", def: "Empreinte numérique unique du fichier, comme une empreinte digitale. Si le fichier est modifié, même d'un pixel, l'empreinte change complètement." },
      { term: "Consensus multi-sources", def: "Notre analyse combine plusieurs moteurs IA (OpenAI, Sightengine, Illuminarty) pour une détection plus fiable qu'un seul système." }
    ]
  };

  // Glossaire pédagogique (EN)
  const glossaryEN = {
    title: "UNDERSTANDING THIS CERTIFICATE",
    intro: "This document certifies the analysis of a file to detect if it was created or modified by artificial intelligence. Here are the key terms:",
    terms: [
      { term: "Deepfake", def: "Content (image, video, audio) created or modified by AI to deceive. Example: making a person say things they never said." },
      { term: "AI Score", def: "Percentage indicating the likelihood that content was AI-generated. Higher score means higher chance of being artificial." },
      { term: "Authenticity Score", def: "The inverse of AI score. A score of 85% means 85% chance the content is authentic/real." },
      { term: "SHA-256", def: "Unique digital fingerprint of the file. If the file is modified, even by one pixel, the fingerprint completely changes." },
      { term: "Multi-source Consensus", def: "Our analysis combines multiple AI engines (OpenAI, Sightengine, Illuminarty) for more reliable detection than a single system." }
    ]
  };

  const glossary = currentLanguage === 'fr' ? glossaryFR : glossaryEN;

  // Legal text complet (French)
  const legalTextFR = [
    "CADRE JURIDIQUE ET VALEUR PROBATOIRE",
    "",
    "Article 1 - Nature du document",
    "Ce certificat constitue une attestation technique d'analyse d'authenticité réalisée par FakeTect (JARVIS SAS, SIREN 928 499 166). Il résulte d'un traitement algorithmique multi-sources visant à détecter la présence de contenus générés ou manipulés par intelligence artificielle (IA) ou techniques de deepfake.",
    "",
    "Article 2 - Intégrité et traçabilité",
    "L'empreinte numérique SHA-256 garantit l'intégrité du fichier analysé. Cette empreinte cryptographique permet de vérifier que le fichier n'a subi aucune modification depuis l'analyse. Toute altération, même minime, invaliderait ce certificat. L'identifiant unique (ID) permet la traçabilité de l'analyse dans nos systèmes.",
    "",
    "Article 3 - Valeur probatoire (Règlement eIDAS)",
    "Conformément au Règlement (UE) n°910/2014 (eIDAS), ce document électronique peut constituer un élément de preuve recevable devant les juridictions européennes (Art. 25.1). Sa force probante est laissée à l'appréciation souveraine du juge, qui évaluera sa fiabilité et sa pertinence au regard des circonstances de l'espèce.",
    "",
    "Article 4 - Conformité AI Act (Règlement UE 2024/1689)",
    "Notre système d'analyse respecte les obligations de transparence et de traçabilité prévues par le Règlement européen sur l'Intelligence Artificielle. Les scores fournis reflètent une probabilité statistique basée sur l'état de l'art technologique, et non une certitude absolue.",
    "",
    "Article 5 - Limites et réserves",
    "• Ce certificat n'est PAS un horodatage qualifié ni une signature électronique qualifiée au sens d'eIDAS.",
    "• Les technologies de détection IA évoluent constamment ; aucun système ne garantit une détection à 100%.",
    "• Ce document ne préjuge pas de l'intention de l'auteur du contenu analysé.",
    "• Pour une valeur probatoire renforcée, un horodatage qualifié peut être appliqué (nous contacter).",
    "",
    "Article 6 - Protection des données (RGPD)",
    "Le traitement est effectué conformément au Règlement (UE) 2016/679 (RGPD). Les données sont conservées 90 jours (gratuit) ou selon votre abonnement. Vous disposez d'un droit d'accès, rectification, effacement et portabilité (contact@faketect.com)."
  ].join('\n');

  // Legal text complet (English)
  const legalTextEN = [
    "LEGAL FRAMEWORK AND EVIDENTIAL VALUE",
    "",
    "Article 1 - Document Nature",
    "This certificate constitutes a technical authenticity analysis attestation performed by FakeTect (JARVIS SAS, SIREN 928 499 166). It results from multi-source algorithmic processing aimed at detecting content generated or manipulated by artificial intelligence (AI) or deepfake techniques.",
    "",
    "Article 2 - Integrity and Traceability",
    "The SHA-256 digital fingerprint guarantees the integrity of the analyzed file. This cryptographic hash verifies that the file has not been modified since analysis. Any alteration, however minor, would invalidate this certificate. The unique identifier (ID) enables analysis traceability in our systems.",
    "",
    "Article 3 - Evidential Value (eIDAS Regulation)",
    "In accordance with Regulation (EU) No 910/2014 (eIDAS), this electronic document may constitute admissible evidence before European courts (Art. 25.1). Its probative value is left to the sovereign discretion of the judge, who will assess its reliability and relevance in light of case circumstances.",
    "",
    "Article 4 - AI Act Compliance (EU Regulation 2024/1689)",
    "Our analysis system complies with transparency and traceability obligations under the European AI Regulation. Provided scores reflect statistical probability based on technological state-of-the-art, not absolute certainty.",
    "",
    "Article 5 - Limitations and Reservations",
    "• This certificate is NOT a qualified timestamp or qualified electronic signature under eIDAS.",
    "• AI detection technologies constantly evolve; no system guarantees 100% detection.",
    "• This document does not presume the intent of the analyzed content's author.",
    "• For enhanced evidential value, a qualified timestamp may be applied (contact us).",
    "",
    "Article 6 - Data Protection (GDPR)",
    "Processing complies with Regulation (EU) 2016/679 (GDPR). Data is retained for 90 days (free) or per subscription. You have rights of access, rectification, erasure, and portability (contact@faketect.com)."
  ].join('\n');

  const legalText = currentLanguage === 'fr' ? legalTextFR : legalTextEN;

  // Charger le logo
  const logoBase64 = await loadLogoBase64();

  // ========= HEADER =========
  // Gradient background
  doc.setFillColor(15, 23, 42); // dark blue
  doc.rect(0, 0, pageW, 160, 'F');

  // Accent line
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageW, 4, 'F');
  doc.setFillColor(34, 211, 238); // cyan accent
  doc.rect(0, 4, pageW * 0.3, 2, 'F');

  // Logo
  let logoEndX = margin + 44;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 20, 180, 45);
      logoEndX = margin + 190;
    } catch {
      drawMagnifier(doc, margin + 14, 45, 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text('FakeTect', margin + 44, 52);
    }
  } else {
    drawMagnifier(doc, margin + 14, 45, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('FakeTect', margin + 44, 52);
  }

  // Certificate title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  const certTitle = currentLanguage === 'fr'
    ? "CERTIFICAT D'AUTHENTICITÉ"
    : "AUTHENTICITY CERTIFICATE";
  doc.text(certTitle, margin, 95);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  const certSubtitle = currentLanguage === 'fr'
    ? "Analyse de détection IA & Deepfake"
    : "AI & Deepfake Detection Analysis";
  doc.text(certSubtitle, margin, 112);

  // Meta info
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`${currentLanguage === 'fr' ? 'Date' : 'Date'}: ${formatDateHuman(now, currentLanguage)}`, margin, 130);
  if (analysisId) {
    doc.text(`${currentLanguage === 'fr' ? 'Référence' : 'Reference'}: ${analysisId}`, margin, 143);
  }

  // QR Code placeholder (top right)
  drawQRPlaceholder(doc, pageW - margin - 60, 20, 55, 'faketect.com/verify');

  // Badge officiel
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(pageW - margin - 130, 90, 130, 28, 5, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  const badgeText = currentLanguage === 'fr' ? 'DOCUMENT OFFICIEL' : 'OFFICIAL DOCUMENT';
  const badgeWidth = doc.getTextWidth(badgeText);
  doc.text(badgeText, pageW - margin - 65 - badgeWidth/2, 107);

  // Separator
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(1);
  doc.line(margin, 155, pageW - margin, 155);

  let y = 175;

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

  // ========= GLOSSAIRE PEDAGOGIQUE =========
  y = ensureSpace(doc, y, 200, margin);

  // Blue info box
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(2);
  const glossaryH = 180;
  doc.roundedRect(margin, y, contentW, glossaryH, 8, 8, 'FD');

  // Icon info
  doc.setFillColor(59, 130, 246);
  doc.circle(margin + 20, y + 22, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('?', margin + 17, y + 27);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text(glossary.title, margin + 38, y + 26);

  // Intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const introLines = doc.splitTextToSize(glossary.intro, contentW - 30);
  doc.text(introLines, margin + 15, y + 45);

  // Terms
  let yGloss = y + 65;
  doc.setFontSize(8);
  for (const item of glossary.terms) {
    if (yGloss > y + glossaryH - 15) break;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(`• ${item.term}:`, margin + 15, yGloss);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    const termW = doc.getTextWidth(`• ${item.term}: `);
    const defLines = doc.splitTextToSize(item.def, contentW - 35 - termW);
    doc.text(defLines[0], margin + 15 + termW, yGloss);
    if (defLines.length > 1) {
      for (let i = 1; i < defLines.length; i++) {
        yGloss += 10;
        if (yGloss > y + glossaryH - 15) break;
        doc.text(defLines[i], margin + 25, yGloss);
      }
    }
    yGloss += 14;
  }

  y += glossaryH + 20;

  // ========= LEGAL SECTION =========
  y = ensureSpace(doc, y, 280, margin);

  // Professional legal box
  const legalH = 280;
  // Professional legal styling - ivory background
  doc.setFillColor(254, 252, 247);
  doc.setDrawColor(120, 113, 108);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, y, contentW, legalH, 8, 8, 'FD');

  // Header bar
  doc.setFillColor(41, 37, 36);
  doc.rect(margin, y, contentW, 32, 'F');

  // Legal icon (scales)
  doc.setFillColor(254, 252, 247);
  doc.circle(margin + 22, y + 16, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(41, 37, 36);
  doc.text('§', margin + 18, y + 20);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(254, 252, 247);
  const legalTitle = currentLanguage === 'fr' ? 'MENTIONS LÉGALES ET VALEUR PROBATOIRE' : 'LEGAL NOTICES AND EVIDENTIAL VALUE';
  doc.text(legalTitle, margin + 40, y + 20);

  // Legal text with proper formatting
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(41, 37, 36);
  const legalLines = doc.splitTextToSize(legalText, contentW - 28);
  let yLegal = y + 45;

  for (const line of legalLines) {
    if (yLegal > y + legalH - 15) {
      // New page for overflow
      doc.addPage();

      // Continue header on new page
      doc.setFillColor(254, 252, 247);
      doc.rect(margin, margin, contentW, pageH - margin * 2, 'F');
      doc.setDrawColor(120, 113, 108);
      doc.setLineWidth(1);
      doc.rect(margin, margin, contentW, pageH - margin * 2, 'S');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text(currentLanguage === 'fr' ? '(suite des mentions légales)' : '(legal notices continued)', margin + 10, margin + 15);

      yLegal = margin + 30;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(41, 37, 36);
    }

    // Bold article titles
    if (line.startsWith('Article') || line.startsWith('CADRE') || line.startsWith('LEGAL')) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 37, 36);
    } else if (line.startsWith('•')) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(68, 64, 60);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(68, 64, 60);
    }

    doc.text(line, margin + 14, yLegal);
    yLegal += 9;
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
  const footerY = pageH - 70;

  // Footer background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, footerY, pageW, 70, 'F');

  // Accent line
  doc.setFillColor(99, 102, 241);
  doc.rect(0, footerY, pageW, 3, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('FakeTect', margin, footerY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const footerTagline = currentLanguage === 'fr'
    ? 'Plateforme de détection IA & Deepfakes'
    : 'AI & Deepfake Detection Platform';
  doc.text(footerTagline, margin, footerY + 35);

  // Company info (center)
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const companyInfo = 'JARVIS SAS • SIREN 928 499 166 • RCS Créteil';
  const companyW = doc.getTextWidth(companyInfo);
  doc.text(companyInfo, (pageW - companyW) / 2, footerY + 50);

  const addressInfo = '64 Avenue Marinville, 94100 Saint-Maur-des-Fossés, France';
  const addressW = doc.getTextWidth(addressInfo);
  doc.text(addressInfo, (pageW - addressW) / 2, footerY + 60);

  // Contact (right side)
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  const webUrl = 'www.faketect.com';
  const webW = doc.getTextWidth(webUrl);
  doc.text(webUrl, pageW - margin - webW, footerY + 22);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const contactEmail = 'contact@faketect.com';
  const emailW = doc.getTextWidth(contactEmail);
  doc.text(contactEmail, pageW - margin - emailW, footerY + 35);

  // Verification note
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  const verifyNote = currentLanguage === 'fr'
    ? 'Vérifiez ce certificat : faketect.com/verify • Pour horodatage qualifié eIDAS, contactez-nous'
    : 'Verify this certificate: faketect.com/verify • For qualified eIDAS timestamp, contact us';
  const verifyW = doc.getTextWidth(verifyNote);
  doc.text(verifyNote, (pageW - verifyW) / 2, footerY + 68);

  const filename = analysisId ? `faketect-certificate-${analysisId}.pdf` : 'faketect-certificate.pdf';
  doc.save(filename);
}
