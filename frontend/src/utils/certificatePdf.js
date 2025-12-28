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

  // === LOGO FAKETECT ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(99, 102, 241); // Indigo-500
  doc.text('FakeTect', margin, y);
  
  y += 10;
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(2);
  doc.line(margin, y, margin + 100, y);

  y += 30;

  // === TITRE ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30);
  doc.text(t('certificate.title'), margin, y);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(t('certificate.subtitle'), margin, y);

  y += 16;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);

  y += 30;

  // === RÉSULTAT VISUEL LUDIQUE ===
  const boxHeight = 140;
  const boxY = y;

  // Fond coloré selon le résultat
  const bgColors = {
    real: [220, 252, 231],    // green-100
    uncertain: [254, 243, 199], // amber-100
    fake: [254, 226, 226]      // red-100
  };
  const borderColors = {
    real: [34, 197, 94],       // green-500
    uncertain: [245, 158, 11],  // amber-500
    fake: [239, 68, 68]        // red-500
  };

  doc.setFillColor(...bgColors[result.level]);
  doc.setDrawColor(...borderColors[result.level]);
  doc.setLineWidth(3);
  doc.roundedRect(margin, boxY, contentWidth, boxHeight, 8, 8, 'FD');

  // Emoji et titre
  y += 35;
  doc.setFontSize(40);
  doc.setTextColor(...borderColors[result.level]);
  const titleWithEmoji = `${result.emoji} ${simpleMessage.title}`;
  const titleWidth = doc.getTextWidth(titleWithEmoji);
  doc.text(titleWithEmoji, (pageWidth - titleWidth) / 2, y);

  // Score visuel (barre de progression)
  y += 35;
  const barWidth = contentWidth - 80;
  const barX = margin + 40;
  const barHeight = 20;

  // Fond de la barre (gris)
  doc.setFillColor(229, 231, 235); // gray-200
  doc.setDrawColor(209, 213, 219); // gray-300
  doc.setLineWidth(1);
  doc.roundedRect(barX, y, barWidth, barHeight, 4, 4, 'FD');

  // Barre de progression colorée
  const progressWidth = (barWidth * result.realPercentage) / 100;
  const gradientColors = {
    real: [34, 197, 94],      // green-500
    uncertain: [245, 158, 11], // amber-500
    fake: [239, 68, 68]       // red-500
  };
  doc.setFillColor(...gradientColors[result.level]);
  doc.roundedRect(barX, y, progressWidth, barHeight, 4, 4, 'F');

  // Pourcentage au centre
  y += 14;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  const percentText = `${result.realPercentage}% ${currentLanguage === 'fr' ? 'RÉEL' : 'REAL'}`;
  const percentWidth = doc.getTextWidth(percentText);
  doc.text(percentText, (pageWidth - percentWidth) / 2, y);

  // Labels gauche/droite
  y += 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const labelReal = currentLanguage === 'fr' ? '100% Réel' : '100% Real';
  const labelAI = currentLanguage === 'fr' ? '100% IA' : '100% AI';
  doc.text(labelReal, barX, y);
  const labelAIWidth = doc.getTextWidth(labelAI);
  doc.text(labelAI, barX + barWidth - labelAIWidth, y);

  // Explication simple
  y += 20;
  doc.setFontSize(11);
  doc.setTextColor(60);
  const explanationLines = doc.splitTextToSize(simpleMessage.explanation, contentWidth - 80);
  doc.text(explanationLines, margin + 40, y);

  y = boxY + boxHeight + 30;

  // === SECTION TECHNIQUE PROFESSIONNELLE ===
  doc.setFillColor(249, 250, 251); // gray-50
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(1);
  
  const techBoxY = y;
  const techBoxHeight = 200;
  doc.roundedRect(margin, techBoxY, contentWidth, techBoxHeight, 8, 8, 'FD');

  y += 25;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  const techTitle = currentLanguage === 'fr' ? '📊 Analyse Technique Détaillée' : '📊 Detailed Technical Analysis';
  doc.text(techTitle, margin + 20, y);

  y += 25;
  doc.setTextColor(30);

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

  const labelWidth = 120;
  const lineHeight = 16;

  doc.setFontSize(10);

  for (const [label, value] of rows) {
    if (y > techBoxY + techBoxHeight - 30) break; // Éviter débordement

    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 20, y);

    doc.setFont('helvetica', 'normal');
    const valueX = margin + 20 + labelWidth;
    const valueText = safeText(value) || '—';

    const split = doc.splitTextToSize(valueText, contentWidth - labelWidth - 40);
    doc.text(split, valueX, y);

    y += Math.max(lineHeight, split.length * lineHeight);
  }

  y = techBoxY + techBoxHeight + 30;

  // === INFORMATIONS DE VÉRIFICATION ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  const verifyTitle = currentLanguage === 'fr' ? '🔐 Informations de Vérification' : '🔐 Verification Information';
  doc.text(verifyTitle, margin, y);

  y += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const verifyRows = [
    [t('certificate.fields.user'), userName],
    [t('certificate.fields.date'), formatDateTimeUtc(now)],
    [t('certificate.fields.file'), fileName],
    [t('certificate.fields.fileHash'), fileHash || '—'],
    [t('certificate.fields.fingerprint'), fingerprint]
  ];

  for (const [label, value] of verifyRows) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);

    doc.setFont('helvetica', 'normal');
    const valueX = margin + labelWidth;
    const valueText = safeText(value) || '—';

    const split = doc.splitTextToSize(valueText, contentWidth - labelWidth);
    doc.text(split, valueX, y);

    y += Math.max(lineHeight, split.length * lineHeight);

    if (y > doc.internal.pageSize.getHeight() - margin - 60) {
      doc.addPage();
      y = margin;
    }
  }

  // === EXPLICATION CONFIANCE (si disponible) ===
  if (confidenceMsg) {
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const confLines = doc.splitTextToSize(confidenceMsg, contentWidth);
    doc.text(confLines, margin, y);
  }

  // === FOOTER ===
  const footer = `${t('certificate.generatedAt', { date: formatDateTimeUtc(now) })} • ${t('certificate.verificationHint')}`;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  const footerLines = doc.splitTextToSize(footer, contentWidth);
  doc.text(footerLines, margin, doc.internal.pageSize.getHeight() - margin / 2);

  const filename = analysisId ? `faketect-certificate-${analysisId}.pdf` : 'faketect-certificate.pdf';
  doc.save(filename);
}
