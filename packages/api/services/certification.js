const crypto = require('crypto');

// Import du service juridique
const { LegalCertificateGenerator } = require('./legal-service');

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function canonicalize(value) {
  if (value == null) return null;

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = canonicalize(value[key]);
    }
    return out;
  }

  if (value instanceof Date) return value.toISOString();

  // Preserve primitives as-is
  return value;
}

function canonicalJSONStringify(obj) {
  return JSON.stringify(canonicalize(obj));
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecodeToBuffer(str) {
  const b64 = String(str)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(String(str).length / 4) * 4, '=');
  return Buffer.from(b64, 'base64');
}

function hmacSha256Base64Url(payloadString, secret) {
  const mac = crypto.createHmac('sha256', secret).update(payloadString).digest();
  return base64UrlEncode(mac);
}

function timingSafeEqualStr(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function getSigningSecrets() {
  const current = process.env.CERT_SIGNING_SECRET;
  const old = process.env.CERT_SIGNING_SECRET_OLD;
  return [current, old].filter(Boolean);
}

function createCertificatePayload({
  batch,
  analyses,
  purpose,
  appVersion,
  generatedAt,
  certificateId,
  subjectOverride
}) {
  const safePurpose = typeof purpose === 'string' ? purpose.trim().slice(0, 64) : null;

  const minimalAnalyses = (analyses || []).map(a => ({
    id: a.id,
    filename: a.filename,
    source_type: a.source_type,
    document_name: a.document_name || null,
    document_page: a.document_page || null,
    combined_score: a.combined_score,
    confidence_level: a.confidence_level,
    is_ai_generated: a.is_ai_generated,
    exif_has_ai_markers: !!a.exif_has_ai_markers,
    engines: {
      sightengine: a.sightengine_score ?? null,
      illuminarty: a.illuminarty_score ?? null
    },
    detected_model: a.illuminarty_model ?? null,
    created_at: a.created_at || null
  }));

  const subject = {
    batch_id: batch?.id || null,
    batch_name: batch?.name || null,
    source_type: batch?.source_type || null,
    original_filename: batch?.original_filename || null,
    total_images: batch?.total_images ?? null
  };

  if (isPlainObject(subjectOverride)) {
    for (const key of Object.keys(subjectOverride)) {
      subject[key] = subjectOverride[key];
    }
  }

  return {
    certificate_version: 1,
    certificate_id: certificateId,
    generated_at: generatedAt,
    generator: {
      product: 'FakeTect',
      component: 'api',
      version: appVersion || 'unknown'
    },
    purpose: safePurpose,
    subject,
    results: {
      total_items: minimalAnalyses.length,
      ai_detected_count: minimalAnalyses.filter(x => x.is_ai_generated).length,
      average_score: minimalAnalyses.length
        ? minimalAnalyses.reduce((s, x) => s + (Number(x.combined_score) || 0), 0) / minimalAnalyses.length
        : 0,
      analyses: minimalAnalyses
    },
    methodology: {
      description: 'Détection probabiliste multi-moteurs + marqueurs EXIF. Les résultats sont indicatifs.',
      providers: ['sightengine', 'illuminarty'],
      decision_threshold: process.env.AI_DECISION_THRESHOLD || '0.7'
    }
  };
}

function signCertificatePayload(payload) {
  const secrets = getSigningSecrets();
  if (secrets.length === 0) {
    return {
      alg: null,
      payload_string: canonicalJSONStringify(payload),
      payload_hash: sha256Hex(canonicalJSONStringify(payload)),
      signature: null,
      signed: false
    };
  }

  const payloadString = canonicalJSONStringify(payload);
  return {
    alg: 'HS256',
    payload_string: payloadString,
    payload_hash: sha256Hex(payloadString),
    signature: hmacSha256Base64Url(payloadString, secrets[0]),
    signed: true
  };
}

function verifyCertificateSignature(payload, signature) {
  const secrets = getSigningSecrets();
  if (secrets.length === 0) return false;
  const payloadString = canonicalJSONStringify(payload);

  for (const secret of secrets) {
    const expected = hmacSha256Base64Url(payloadString, secret);
    if (timingSafeEqualStr(expected, signature)) return true;
  }
  return false;
}

function hashFileSha256Hex(filePath) {
  const hash = crypto.createHash('sha256');
  const fs = require('fs');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Générer un certificat juridiquement conforme
 * Utilise le LegalCertificateGenerator pour une conformité maximale
 */
async function generateLegalCertificate(batchData, analyses, options = {}) {
  const generator = new LegalCertificateGenerator();
  
  const analysisData = {
    batchId: batchData.id,
    filename: batchData.original_filename,
    analyses: analyses
  };

  const certificate = await generator.generateLegalCertificate(analysisData, {
    userId: options.userId,
    purpose: options.purpose || 'general',
    language: options.language || 'fr',
    ipAddress: options.ipAddress,
    includeTimestamp: true,
    includeChainOfCustody: true,
    includeRGPDNotice: true
  });

  return certificate;
}

module.exports = {
  canonicalJSONStringify,
  sha256Hex,
  base64UrlEncode,
  base64UrlDecodeToBuffer,
  createCertificatePayload,
  signCertificatePayload,
  verifyCertificateSignature,
  hashFileSha256Hex,
  generateLegalCertificate
};
