import { jsPDF } from 'jspdf';

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

export async function downloadCertificatePdf({ t, analysis, user, file }) {
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
  const aiScore = typeof aiScoreValue === 'number' ? `${aiScoreValue.toFixed(1)}%` : safeText(aiScoreValue);

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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(t('certificate.title'), margin, y);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(t('certificate.subtitle'), margin, y);

  y += 16;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);

  y += 24;
  doc.setTextColor(30);

  const rows = [
    [t('certificate.fields.analysisId'), analysisId],
    [t('certificate.fields.user'), userName],
    [t('certificate.fields.date'), formatDateTimeUtc(now)],
    [t('certificate.fields.file'), fileName],
    [t('certificate.fields.fileHash'), fileHash || '—'],
    [t('certificate.fields.score'), aiScore],
    [t('certificate.fields.verdict'), verdictLabel],
    [t('certificate.fields.confidence'), confidenceValue !== null ? `${confidenceValue.toFixed(0)}%` : '—'],
    [t('certificate.fields.fingerprint'), fingerprint]
  ];

  if (provider) rows.push([t('certificate.fields.provider'), provider]);
  if (consensus) rows.push([t('certificate.fields.consensus'), consensus]);
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

  const labelWidth = 140;
  const lineHeight = 18;

  doc.setFontSize(11);

  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);

    doc.setFont('helvetica', 'normal');
    const valueX = margin + labelWidth;
    const valueText = safeText(value) || '—';

    const split = doc.splitTextToSize(valueText, contentWidth - labelWidth);
    doc.text(split, valueX, y);

    y += Math.max(lineHeight, split.length * lineHeight);

    if (y > doc.internal.pageSize.getHeight() - margin - 40) {
      doc.addPage();
      y = margin;
    }
  }

  const footer = `${t('certificate.generatedAt', { date: formatDateTimeUtc(now) })} • ${t('certificate.verificationHint')}`;
  doc.setFontSize(9);
  doc.setTextColor(120);
  const footerLines = doc.splitTextToSize(footer, contentWidth);
  doc.text(footerLines, margin, doc.internal.pageSize.getHeight() - margin / 2);

  const filename = analysisId ? `faketect-certificate-${analysisId}.pdf` : 'faketect-certificate.pdf';
  doc.save(filename);
}
