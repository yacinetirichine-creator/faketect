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

function safeText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function downloadCertificatePdf({ t, analysis, user }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const analysisId = safeText(analysis?.id);
  const userName = safeText(user?.name || user?.email);
  const fileName = safeText(analysis?.fileName || analysis?.file_name);
  const provider = safeText(analysis?.provider);

  const verdictKey = safeText(analysis?.verdict?.key || analysis?.verdict);
  const verdictLabel = verdictKey
    ? t(`verdicts.${verdictKey}`, verdictKey.replaceAll('_', ' '))
    : '';

  const aiScoreValue = analysis?.aiScore ?? analysis?.ai_score;
  const aiScore = typeof aiScoreValue === 'number' ? `${aiScoreValue.toFixed(1)}%` : safeText(aiScoreValue);

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
    [t('certificate.fields.date'), formatDateTime(now)],
    [t('certificate.fields.file'), fileName],
    [t('certificate.fields.score'), aiScore],
    [t('certificate.fields.verdict'), verdictLabel]
  ];

  if (provider) rows.push([t('certificate.fields.provider'), provider]);

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

  const footer = t('certificate.generatedAt', { date: formatDateTime(now) });
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(footer, margin, doc.internal.pageSize.getHeight() - margin / 2);

  const filename = analysisId ? `faketect-certificate-${analysisId}.pdf` : 'faketect-certificate.pdf';
  doc.save(filename);
}
