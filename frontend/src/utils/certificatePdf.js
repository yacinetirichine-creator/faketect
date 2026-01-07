import { jsPDF } from 'jspdf';
import { interpretResult, getSimpleMessage, getConfidenceMessage } from './resultInterpreter';

function formatDateTime(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function formatDateTimeUtc(date) {
  try {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mi = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} UTC`;
  } catch {
    return date.toISOString();
  }
}

function safeText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
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

export async function downloadCertificatePdf({ t, analysis, user, file, currentLanguage = 'fr' }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const analysisId = safeText(analysis?.id);
  const userName = safeText(user?.name || user?.email);
  const fileName = safeText(analysis?.fileName || analysis?.file_name || file?.name);
  const provider = safeText(analysis?.provider);

  const detailsObj = (() => {
    const d = analysis?.details;
    if (!d) return null;
    if (typeof d === 'string') {
      try { return JSON.parse(d); } catch { return { details: d }; }
    }
    return d;
  })();

  const confidenceValue = (() => {
    const v = analysis?.confidence ?? detailsObj?.confidence;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(100, n));
  })();

  const consensus = safeText(detailsObj?.consensus);
  const sources = Array.isArray(detailsObj?.sources) ? detailsObj.sources : [];
  const framesAnalyzed = (() => {
    const v = analysis?.framesAnalyzed ?? detailsObj?.framesAnalyzed;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  })();
  const signals = (() => {
    const a = Array.isArray(detailsObj?.anomalies) ? detailsObj.anomalies : [];
    const i = Array.isArray(detailsObj?.indicators) ? detailsObj.indicators : [];
    return [...a, ...i].map((x) => String(x)).filter(Boolean).slice(0, 5);
  })();

  const verdictKey = safeText(analysis?.verdict?.key || analysis?.verdict);
  const verdictLabel = verdictKey
    ? t(`verdicts.${verdictKey}`, verdictKey.replaceAll('_', ' '))
    : '';

  const aiScoreValue = analysis?.aiScore ?? analysis?.ai_score;
  const aiScoreNumber = typeof aiScoreValue === 'number' ? aiScoreValue : parseFloat(aiScoreValue) || 0;
  const aiScore = `${aiScoreNumber.toFixed(1)}%`;

  // Interprétation ludique du résultat
  const result = interpretResult(aiScoreNumber);
  const simpleMessage = getSimpleMessage(result.level, currentLanguage);
  const confidenceMsg = confidenceValue !== null ? getConfidenceMessage(confidenceValue, currentLanguage) : '';

  const fileHashFull = await sha256HexFromFile(file);
  const fileHash = shortenHex(fileHashFull);

  const fingerprintSource = JSON.stringify({
    analysisId,
    verdictKey,
    aiScore,
    provider,
    fileHash: fileHashFull || undefined
  });
  const fingerprintFull = await sha256HexFromString(fingerprintSource);
  const fingerprint = shortenHex(fingerprintFull, 10, 10);

  let y = margin;

  // === EN-TÊTE PREMIUM AVEC GRADIENT SUBTIL ===
  // Gradient visuel (dégradé bleu)
  doc.setFillColor(67, 56, 202); // indigo-700
  doc.rect(0, 0, pageWidth, 160, 'F');
  
  // Bande décorative supérieure
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 0, pageWidth, 6, 'F');
  
  // Badge "Certifié" (coin supérieur droit)
  const badgeX = pageWidth - margin - 80;
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(badgeX, 20, 80, 28, 4, 4, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const badgeText = '✓ CERTIFIÉ';
  const badgeTextWidth = doc.getTextWidth(badgeText);
  doc.text(badgeText, badgeX + (80 - badgeTextWidth) / 2, 38);
  
  // Logo FakeTect (grand et élégant)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(255, 255, 255);
  const logoText = 'FakeTect';
  const logoWidth = doc.getTextWidth(logoText);
  doc.text(logoText, (pageWidth - logoWidth) / 2, 70);
  
  // Trait décoratif sous le logo
  doc.setDrawColor(139, 92, 246); // violet-500
  doc.setLineWidth(3);
  const lineWidth = 100;
  doc.line((pageWidth - lineWidth) / 2, 80, (pageWidth + lineWidth) / 2, 80);
  
  // Sous-titre élégant
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.setTextColor(224, 231, 255); // indigo-100
  const subText = currentLanguage === 'fr' ? 'Certificat d\'Analyse d\'Authenticité' : 'Authenticity Analysis Certificate';
  const subWidth = doc.getTextWidth(subText);
  doc.text(subText, (pageWidth - subWidth) / 2, 105);
  
  // Date et ID (plus discrets)
  doc.setFontSize(9);
  doc.setTextColor(165, 180, 252); // indigo-300
  const dateText = `${formatDateTimeUtc(now)}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, (pageWidth - dateWidth) / 2, 125);
  
  // ID d'analyse en petit
  if (analysisId) {
    doc.setFontSize(8);
    doc.setTextColor(129, 140, 248); // indigo-400
    const idText = `ID: ${analysisId.substring(0, 18)}...`;
    const idWidth = doc.getTextWidth(idText);
    doc.text(idText, (pageWidth - idWidth) / 2, 140);
  }

  y = 200;

  // === RÉSULTAT PREMIUM AVEC EFFET 3D ===
  const boxHeight = 170;
  const boxY = y;

  // Fond coloré selon le résultat
  const bgColors = {
    real: [236, 253, 245],    // emerald-50
    uncertain: [255, 251, 235], // amber-50
    fake: [254, 242, 242]      // red-50
  };
  const accentColors = {
    real: [16, 185, 129],       // emerald-500
    uncertain: [245, 158, 11],  // amber-500
    fake: [239, 68, 68]        // red-500
  };
  const darkColors = {
    real: [6, 95, 70],         // emerald-900
    uncertain: [120, 53, 15],   // amber-900
    fake: [127, 29, 29]        // red-900
  };

  // Ombre portée pour effet 3D
  doc.setFillColor(200, 200, 200);
  doc.roundedRect(margin + 4, boxY + 4, contentWidth, boxHeight, 12, 12, 'F');

  // Carte principale avec bordure colorée épaisse
  doc.setFillColor(...bgColors[result.level]);
  doc.setDrawColor(...accentColors[result.level]);
  doc.setLineWidth(3);
  doc.roundedRect(margin, boxY, contentWidth, boxHeight, 12, 12, 'FD');

  // Badge de verdict (coin supérieur gauche)
  const badgeY = boxY + 15;
  doc.setFillColor(...accentColors[result.level]);
  doc.roundedRect(margin + 20, badgeY, 100, 32, 6, 6, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const verdictText = verdictLabel.toUpperCase();
  const verdictWidth = doc.getTextWidth(verdictText);
  doc.text(verdictText, margin + 20 + (100 - verdictWidth) / 2, badgeY + 20);

  // Emoji géant et titre centré
  y = boxY + 65;
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColors[result.level]);
  const titleText = `${result.emoji}  ${simpleMessage.title}`;
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, y);

  // Barre de progression moderne
  y += 35;
  const barWidth = contentWidth - 120;
  const barX = margin + 60;
  const barHeight = 20;

  // Fond de la barre avec ombre interne
  doc.setFillColor(243, 244, 246); // gray-100
  doc.setDrawColor(209, 213, 219); // gray-300
  doc.setLineWidth(1);
  doc.roundedRect(barX, y, barWidth, barHeight, 10, 10, 'FD');

  // Barre de progression avec dégradé simulé
  const progressWidth = (barWidth * result.realPercentage) / 100;
  doc.setFillColor(...accentColors[result.level]);
  doc.roundedRect(barX, y, progressWidth, barHeight, 10, 10, 'F');

  // Indicateur de pourcentage sur la barre
  if (progressWidth > 50) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const pctText = `${result.realPercentage}%`;
    const pctWidth = doc.getTextWidth(pctText);
    doc.text(pctText, barX + progressWidth - pctWidth - 10, y + 14);
  }

  // Labels élégants gauche/droite
  y += 32;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text('100% RÉEL', barX, y);
  const labelAIWidth = doc.getTextWidth('100% IA');
  doc.text('100% IA', barX + barWidth - labelAIWidth, y);

  // Explication avec icône
  y += 22;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99); // gray-600
  const explanationLines = doc.splitTextToSize(simpleMessage.explanation, contentWidth - 80);
  doc.text(explanationLines, (pageWidth - doc.getTextWidth(explanationLines[0])) / 2, y);

  y = boxY + boxHeight + 35;

  // === SECTION TECHNIQUE PREMIUM ===
  const techBoxY = y;
  const techBoxHeight = 200;
  
  // Ombre 3D
  doc.setFillColor(209, 213, 219);
  doc.roundedRect(margin + 4, techBoxY + 4, contentWidth, techBoxHeight, 12, 12, 'F');
  
  // Carte principale élégante
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(1);
  doc.roundedRect(margin, techBoxY, contentWidth, techBoxHeight, 12, 12, 'FD');

  // Barre de titre avec gradient
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(margin, techBoxY, contentWidth, 40, 12, 12, 'F');
  
  // Ligne d'accent indigo
  doc.setDrawColor(99, 102, 241); // indigo-500
  doc.setLineWidth(4);
  doc.line(margin + 15, techBoxY + 40, margin + contentWidth - 15, techBoxY + 40);

  y = techBoxY + 25;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202); // indigo-700
  const techTitle = currentLanguage === 'fr' ? '📊  Analyse Technique' : '📊  Technical Analysis';
  doc.text(techTitle, margin + 20, y);

  y = techBoxY + 60;
  doc.setTextColor(31, 41, 55); // gray-800

  const rows = [
    [t('certificate.fields.analysisId'), analysisId],
    [t('certificate.fields.score'), aiScore],
    [t('certificate.fields.confidence'), confidenceValue !== null ? `${confidenceValue.toFixed(0)}%` : '—'],
    [t('certificate.fields.verdict'), verdictLabel]
  ];

  if (provider) rows.push([t('certificate.fields.provider'), provider]);
  if (consensus) rows.push([t('certificate.fields.consensus'), consensus]);
  if (framesAnalyzed !== null) rows.push([t('certificate.fields.framesAnalyzed'), String(Math.round(framesAnalyzed))]);
  
  if (sources.length) {
    const src = sources
      .map((s) => {
        const name = s?.provider || s?.name || s?.source;
        const score = typeof s?.score === 'number' ? `${Math.round(s.score)}%` : '';
        const conf = typeof s?.confidence === 'number' ? `${Math.round(s.confidence)}%` : '';
        return [name, score && `${t('certificate.fields.scoreShort')} ${score}`, conf && `${t('certificate.fields.confidenceShort')} ${conf}`]
          .filter(Boolean)
          .join(' • ');
      })
      .filter(Boolean)
      .join(' | ');
    if (src) rows.push([t('certificate.fields.sources'), src]);
  }

  if (signals.length) {
    rows.push([t('certificate.fields.topSignals'), signals.join(' • ')]);
  }

  const labelWidth = 110;
  const lineHeight = 16;

  doc.setFontSize(10);

  for (const [label, value] of rows) {
    if (y > techBoxY + techBoxHeight - 25) break;

    // Label avec point décoratif
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.circle(margin + 20, y - 3, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(label, margin + 28, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55); // gray-800
    const valueX = margin + 28 + labelWidth;
    const valueText = safeText(value) || '—';

    const split = doc.splitTextToSize(valueText, contentWidth - labelWidth - 50);
    doc.text(split, valueX, y);

    y += Math.max(lineHeight, split.length * lineHeight);
  }

  y = techBoxY + techBoxHeight + 35;

  // === SECTION VÉRIFICATION SÉCURISÉE ===
  const verifyBoxY = y;
  const verifyBoxHeight = 115;
  
  // Ombre 3D
  doc.setFillColor(209, 213, 219);
  doc.roundedRect(margin + 4, verifyBoxY + 4, contentWidth, verifyBoxHeight, 12, 12, 'F');
  
  // Carte avec bordure verte épaisse (sécurité)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(2.5);
  doc.roundedRect(margin, verifyBoxY, contentWidth, verifyBoxHeight, 12, 12, 'FD');
  
  // Badge "Vérifié" dans le coin
  const verifyBadgeX = pageWidth - margin - 85;
  const verifyBadgeY = verifyBoxY + 15;
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(verifyBadgeX, verifyBadgeY, 75, 26, 5, 5, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const verifiedText = '✓ VÉRIFIÉ';
  const verifiedWidth = doc.getTextWidth(verifiedText);
  doc.text(verifiedText, verifyBadgeX + (75 - verifiedWidth) / 2, verifyBadgeY + 17);
  
  y = verifyBoxY + 30;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70); // emerald-900
  const verifyTitle = currentLanguage === 'fr' ? '🔐  Informations de Vérification' : '🔐  Verification Details';
  doc.text(verifyTitle, margin + 20, y);

  y += 25;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81); // gray-700

  const verifyRows = [
    [t('certificate.fields.user'), userName],
    [t('certificate.fields.date'), formatDateTimeUtc(now)],
    [t('certificate.fields.file'), fileName],
    [t('certificate.fields.fingerprint'), fingerprint]
  ];

  const shortLabelWidth = 90;
  const verifyLineHeight = 14;

  for (const [label, value] of verifyRows) {
    // Icône bullet point
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.circle(margin + 22, y - 2, 1.5, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 95, 70); // emerald-900
    doc.text(label, margin + 28, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    const valueX = margin + 28 + shortLabelWidth;
    const valueText = safeText(value) || '—';

    const split = doc.splitTextToSize(valueText, contentWidth - shortLabelWidth - 50);
    doc.text(split, valueX, y);

    y += Math.max(verifyLineHeight, split.length * verifyLineHeight);

    if (y > doc.internal.pageSize.getHeight() - margin - 80) {
      doc.addPage();
      y = margin;
    }
  }

  // === NOTE DE CONFIANCE ===
  if (confidenceMsg) {
    y = verifyBoxY + verifyBoxHeight + 20;
    
    // Encadré discret avec icône
    doc.setFillColor(249, 250, 251); // gray-50
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, contentWidth, 35, 8, 8, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128); // gray-500
    const confLines = doc.splitTextToSize('💡 ' + confidenceMsg, contentWidth - 30);
    doc.text(confLines, margin + 15, y + 15);
  }

  // === FOOTER PREMIUM ET MODERNE ===
  const footerY = doc.internal.pageSize.getHeight() - 50;
  
  // Bande de footer avec dégradé
  doc.setFillColor(67, 56, 202); // indigo-700
  doc.rect(0, footerY, pageWidth, 50, 'F');
  
  // Ligne décorative supérieure
  doc.setDrawColor(139, 92, 246); // violet-500
  doc.setLineWidth(2);
  doc.line(0, footerY, pageWidth, footerY);
  
  // Logo FakeTect élégant
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  const footerLogo = 'FakeTect™';
  const footerLogoWidth = doc.getTextWidth(footerLogo);
  doc.text(footerLogo, (pageWidth - footerLogoWidth) / 2, footerY + 20);
  
  // Slogan moderne
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255); // indigo-100
  const slogan = currentLanguage === 'fr' 
    ? 'Détection IA & Deepfakes en temps réel  •  www.faketect.com'
    : 'Real-time AI & Deepfake Detection  •  www.faketect.com';
  const sloganWidth = doc.getTextWidth(slogan);
  doc.text(slogan, (pageWidth - sloganWidth) / 2, footerY + 32);
  
  // Note de validation discrète
  doc.setFontSize(7.5);
  doc.setTextColor(165, 180, 252); // indigo-300
  const validation = t('certificate.verificationHint');
  const validationWidth = doc.getTextWidth(validation);
  doc.text(validation, (pageWidth - validationWidth) / 2, footerY + 42);

  const filename = analysisId ? `faketect-certificate-${analysisId}.pdf` : 'faketect-certificate.pdf';
  doc.save(filename);
}
