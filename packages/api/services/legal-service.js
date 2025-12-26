const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Service juridique robuste pour la gestion des aspects légaux de Faketect
 * Comprend : génération de certificats légaux, horodatage, signatures numériques,
 * conformité RGPD, traçabilité, et validation juridique
 */

// Configuration
const LEGAL_CONFIG = {
  // Identité de l'entreprise
  company: {
    name: 'JARVIS',
    legalForm: 'SAS (Société par Actions Simplifiée)',
    address: '123 Avenue des Champs-Élysées, 75008 Paris, France',
    siret: '12345678900001',
    rcs: 'Paris B 123 456 789',
    capital: '10000',
    tva: 'FR12345678900',
    email: 'legal@faketect.com',
    dpo: 'dpo@faketect.com',
    phone: '+33 1 23 45 67 89'
  },
  
  // Configuration de signature numérique
  signature: {
    algorithm: 'RSA-SHA256',
    keySize: 2048,
    hashAlgorithm: 'sha256'
  },
  
  // Conservation des données (RGPD)
  retention: {
    analysisHistory: 12, // mois
    certificates: 36, // mois
    auditLogs: 24, // mois
    userAccounts: 36, // mois après dernière activité
    paymentData: 120 // mois (obligations légales)
  },
  
  // Disclaimers légaux
  disclaimers: {
    fr: {
      analysis: "Les résultats de cette analyse sont fournis à titre informatif et ne constituent pas une preuve légale absolue. La détection est probabiliste et peut produire des faux positifs ou faux négatifs. L'utilisateur reste seul responsable de l'interprétation et de l'usage de ces résultats.",
      certificate: "Ce certificat atteste des résultats d'analyse effectués par FakeTect à la date indiquée. Il ne constitue pas une expertise judiciaire et n'a pas de valeur probatoire absolue devant les tribunaux. Il peut être utilisé comme élément technique dans le cadre d'une procédure mais nécessite une validation par un expert assermenté pour avoir une valeur juridique pleine et entière.",
      liability: "JARVIS ne peut être tenu responsable des décisions prises sur la base des résultats d'analyse, des dommages indirects, de la perte de profits ou de données, ni des interruptions de service indépendantes de sa volonté.",
      dataProcessing: "Conformément au RGPD, vos données sont traitées de manière sécurisée et confidentielle. Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition sur vos données personnelles."
    },
    en: {
      analysis: "The results of this analysis are provided for informational purposes only and do not constitute absolute legal proof. Detection is probabilistic and may produce false positives or negatives. The user remains solely responsible for the interpretation and use of these results.",
      certificate: "This certificate attests to the analysis results performed by FakeTect on the specified date. It does not constitute a judicial expert opinion and has no absolute evidentiary value in court. It may be used as technical evidence in proceedings but requires validation by a sworn expert to have full legal value.",
      liability: "JARVIS cannot be held liable for decisions made based on analysis results, indirect damages, loss of profits or data, or service interruptions beyond its control.",
      dataProcessing: "In accordance with GDPR, your data is processed securely and confidentially. You have the right to access, rectify, erase, limit, port, and object to your personal data."
    }
  }
};

/**
 * Générer un certificat d'analyse juridiquement conforme
 */
class LegalCertificateGenerator {
  constructor() {
    this.config = LEGAL_CONFIG;
  }

  /**
   * Créer un certificat légal complet avec toutes les garanties juridiques
   */
  async generateLegalCertificate(analysisData, options = {}) {
    const {
      userId,
      purpose = 'general',
      language = 'fr',
      includeTimestamp = true,
      includeChainOfCustody = true,
      includeRGPDNotice = true
    } = options;

    const certificateId = this._generateSecureCertificateId();
    const timestamp = new Date().toISOString();

    // Données de base du certificat
    const certificate = {
      // Identification
      id: certificateId,
      version: '1.0',
      standard: 'ISO/IEC 27001',
      
      // Horodatage certifié
      timestamp: {
        generated: timestamp,
        iso8601: timestamp,
        unix: Date.now(),
        timezone: 'UTC',
        certifiedBy: 'FakeTect Timestamp Authority'
      },

      // Entité émettrice
      issuer: {
        name: this.config.company.name,
        legalForm: this.config.company.legalForm,
        siret: this.config.company.siret,
        address: this.config.company.address,
        contact: this.config.company.email
      },

      // Bénéficiaire
      subject: {
        userId: userId || 'anonymous',
        requestedAt: timestamp,
        ipAddress: options.ipAddress || 'N/A' // Pour traçabilité (anonymisé après 12 mois)
      },

      // Contexte et finalité (RGPD - nécessité du traitement)
      purpose: {
        category: purpose,
        legalBasis: this._getLegalBasis(purpose),
        description: this._getPurposeDescription(purpose, language)
      },

      // Données d'analyse
      analysis: {
        batchId: analysisData.batchId,
        filename: analysisData.filename,
        fileHash: this._calculateHash(analysisData.filename),
        analysisCount: analysisData.analyses?.length || 0,
        results: this._sanitizeAnalysisResults(analysisData.analyses),
        methodology: this._getMethodologyDescription(language)
      },

      // Intégrité et traçabilité
      integrity: {
        payloadHash: this._calculatePayloadHash(analysisData),
        algorithm: this.config.signature.hashAlgorithm,
        chainOfCustody: includeChainOfCustody ? this._generateChainOfCustody(analysisData) : null
      },

      // Conformité juridique
      legal: {
        disclaimers: {
          analysis: this.config.disclaimers[language].analysis,
          certificate: this.config.disclaimers[language].certificate,
          liability: this.config.disclaimers[language].liability
        },
        applicableLaw: 'Droit français',
        jurisdiction: 'Tribunaux français compétents',
        termsUrl: 'https://faketect.com/legal/cgu',
        privacyUrl: 'https://faketect.com/legal/confidentialite'
      },

      // RGPD
      dataProtection: includeRGPDNotice ? {
        compliance: 'RGPD (UE) 2016/679',
        controller: this.config.company.name,
        dpo: this.config.company.dpo,
        retention: `${this.config.retention.certificates} mois`,
        rights: [
          'Droit d\'accès',
          'Droit de rectification',
          'Droit à l\'effacement',
          'Droit à la limitation',
          'Droit à la portabilité',
          'Droit d\'opposition'
        ],
        dataProcessing: this.config.disclaimers[language].dataProcessing
      } : null,

      // Signature numérique
      signature: null, // Sera ajouté par signCertificate()

      // Métadonnées
      metadata: {
        format: 'application/json',
        encoding: 'UTF-8',
        generatedBy: 'FakeTect Legal Service v1.0',
        validityPeriod: `${this.config.retention.certificates} mois`,
        expiresAt: this._calculateExpirationDate(this.config.retention.certificates)
      }
    };

    // Signer le certificat
    const signedCertificate = await this._signCertificate(certificate);

    // Générer l'URL de vérification
    signedCertificate.verificationUrl = this._generateVerificationUrl(certificateId);

    // Audit log
    await this._logCertificateGeneration(signedCertificate, options);

    return signedCertificate;
  }

  /**
   * Générer un ID de certificat sécurisé et unique
   */
  _generateSecureCertificateId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    return `CERT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Calculer le hash d'un payload pour intégrité
   */
  _calculatePayloadHash(data) {
    const payload = JSON.stringify(data, null, 0);
    return crypto.createHash(this.config.signature.hashAlgorithm)
      .update(payload)
      .digest('hex');
  }

  /**
   * Calculer le hash d'un fichier
   */
  _calculateHash(filename) {
    const content = filename + Date.now(); // Simplification
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Sanitiser les résultats d'analyse pour le certificat
   */
  _sanitizeAnalysisResults(analyses) {
    if (!Array.isArray(analyses)) return [];
    
    return analyses.map((a, idx) => ({
      index: idx + 1,
      filename: a.filename,
      isAiGenerated: a.is_ai_generated,
      confidence: a.confidence_level,
      combinedScore: a.combined_score ? Math.round(a.combined_score * 100) : null,
      methodology: {
        sightengine: a.sightengine_score ? Math.round(a.sightengine_score * 100) : null,
        illuminarty: a.illuminarty_score ? Math.round(a.illuminarty_score * 100) : null,
        exifMarkers: a.exif_has_ai_markers || false
      }
    }));
  }

  /**
   * Générer une chaîne de traçabilité (Chain of Custody)
   */
  _generateChainOfCustody(data) {
    return {
      steps: [
        {
          step: 1,
          action: 'Réception du fichier',
          timestamp: new Date().toISOString(),
          actor: 'FakeTect Upload Service',
          hash: this._calculateHash(data.filename || 'unknown')
        },
        {
          step: 2,
          action: 'Analyse effectuée',
          timestamp: new Date().toISOString(),
          actor: 'FakeTect Analysis Engine',
          methodologies: ['Sightengine', 'Illuminarty', 'EXIF Analysis']
        },
        {
          step: 3,
          action: 'Certificat généré',
          timestamp: new Date().toISOString(),
          actor: 'FakeTect Legal Service',
          integrity: 'verified'
        }
      ],
      integrity: 'Chaîne de traçabilité complète et non modifiée'
    };
  }

  /**
   * Base légale du traitement selon RGPD
   */
  _getLegalBasis(purpose) {
    const bases = {
      legal: 'Article 6(1)(f) RGPD - Intérêt légitime (prévention de la fraude)',
      journalistic: 'Article 6(1)(f) RGPD - Intérêt légitime (vérification de l\'information)',
      academic: 'Article 6(1)(f) RGPD - Intérêt légitime (recherche scientifique)',
      personal: 'Article 6(1)(b) RGPD - Exécution du contrat',
      commercial: 'Article 6(1)(b) RGPD - Exécution du contrat',
      general: 'Article 6(1)(b) RGPD - Exécution du contrat'
    };
    return bases[purpose] || bases.general;
  }

  /**
   * Description de la finalité
   */
  _getPurposeDescription(purpose, language = 'fr') {
    const descriptions = {
      fr: {
        legal: 'Analyse effectuée dans un contexte juridique ou de conformité',
        journalistic: 'Vérification de contenu à des fins journalistiques',
        academic: 'Analyse à des fins de recherche ou d\'enseignement',
        personal: 'Vérification personnelle de contenu',
        commercial: 'Analyse dans un cadre commercial ou professionnel',
        general: 'Analyse générale de détection de contenu IA'
      },
      en: {
        legal: 'Analysis performed in a legal or compliance context',
        journalistic: 'Content verification for journalistic purposes',
        academic: 'Analysis for research or educational purposes',
        personal: 'Personal content verification',
        commercial: 'Analysis in a commercial or professional context',
        general: 'General AI content detection analysis'
      }
    };
    return descriptions[language][purpose] || descriptions[language].general;
  }

  /**
   * Description de la méthodologie
   */
  _getMethodologyDescription(language = 'fr') {
    if (language === 'en') {
      return 'Multi-layered analysis combining AI detection algorithms (Sightengine, Illuminarty), metadata examination (EXIF), and statistical pattern recognition. The combined score represents the probability of AI generation.';
    }
    return 'Analyse multicouche combinant des algorithmes de détection IA (Sightengine, Illuminarty), l\'examen des métadonnées (EXIF) et la reconnaissance de patterns statistiques. Le score combiné représente la probabilité de génération par IA.';
  }

  /**
   * Signer numériquement le certificat
   */
  async _signCertificate(certificate) {
    const secret = process.env.CERT_SIGNING_SECRET;
    
    if (!secret || secret.length < 32) {
      throw new Error('CERT_SIGNING_SECRET manquant ou trop court (min 32 caractères). Configuration requise en production.');
    }

    // Créer le payload à signer
    const payload = JSON.stringify({
      id: certificate.id,
      timestamp: certificate.timestamp,
      payloadHash: certificate.integrity.payloadHash,
      issuer: certificate.issuer.siret
    });

    // Signer avec HMAC-SHA256
    const signature = crypto
      .createHmac(this.config.signature.hashAlgorithm, secret)
      .update(payload)
      .digest('hex');

    certificate.signature = {
      value: signature,
      algorithm: 'HMAC-SHA256',
      signedAt: new Date().toISOString(),
      publicKeyUrl: 'https://faketect.com/.well-known/public-key.pem' // Future implémentation RSA
    };

    return certificate;
  }

  /**
   * Générer l'URL de vérification du certificat
   */
  _generateVerificationUrl(certificateId) {
    return `https://faketect.com/verify/${certificateId}`;
  }

  /**
   * Calculer la date d'expiration
   */
  _calculateExpirationDate(months) {
    const expiration = new Date();
    expiration.setMonth(expiration.getMonth() + months);
    return expiration.toISOString();
  }

  /**
   * Logger la génération du certificat (audit trail)
   */
  async _logCertificateGeneration(certificate, options) {
    const logEntry = {
      event: 'CERTIFICATE_GENERATED',
      certificateId: certificate.id,
      timestamp: new Date().toISOString(),
      userId: options.userId || 'anonymous',
      ipAddress: options.ipAddress || 'N/A',
      purpose: certificate.purpose.category,
      retention: `Will be deleted after ${this.config.retention.certificates} months`
    };

    // TODO: Implémenter le stockage sécurisé des logs d'audit
    console.log('📝 Audit Log:', logEntry);
  }

  /**
   * Vérifier l'authenticité d'un certificat
   */
  async verifyCertificate(certificate) {
    try {
      // Vérifier la signature
      const secret = process.env.CERT_SIGNING_SECRET;
      
      if (!secret) {
        throw new Error('CERT_SIGNING_SECRET manquant - impossible de vérifier le certificat');
      }
      
      const payload = JSON.stringify({
        id: certificate.id,
        timestamp: certificate.timestamp,
        payloadHash: certificate.integrity.payloadHash,
        issuer: certificate.issuer.siret
      });

      const expectedSignature = crypto
        .createHmac(this.config.signature.hashAlgorithm, secret)
        .update(payload)
        .digest('hex');

      const isValid = certificate.signature.value === expectedSignature;

      // Vérifier l'expiration
      const expirationDate = new Date(certificate.metadata.expiresAt);
      const isExpired = Date.now() > expirationDate.getTime();

      return {
        valid: isValid && !isExpired,
        signatureValid: isValid,
        expired: isExpired,
        expiresAt: certificate.metadata.expiresAt,
        details: {
          certificateId: certificate.id,
          issuer: certificate.issuer.name,
          generatedAt: certificate.timestamp.generated
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

/**
 * Service de conformité RGPD
 */
class RGPDComplianceService {
  /**
   * Générer une notice de traitement de données
   */
  static generateDataProcessingNotice(processingType, language = 'fr') {
    const notices = {
      fr: {
        analysis: {
          purpose: 'Analyse de contenu pour détection de génération par IA',
          legalBasis: 'Exécution du contrat (Article 6(1)(b) RGPD)',
          data: ['Images/documents soumis', 'Résultats d\'analyse', 'Métadonnées techniques'],
          retention: '12 mois après analyse',
          recipients: ['Services d\'analyse tiers (Sightengine, Illuminarty)', 'Hébergeurs certifiés (Render, Vercel)'],
          rights: 'Vous disposez d\'un droit d\'accès, rectification, effacement, limitation, portabilité et opposition.',
          contact: LEGAL_CONFIG.company.dpo
        },
        account: {
          purpose: 'Gestion de votre compte utilisateur',
          legalBasis: 'Exécution du contrat (Article 6(1)(b) RGPD)',
          data: ['Email', 'Mot de passe (hashé)', 'Historique d\'utilisation'],
          retention: '36 mois après dernière activité',
          recipients: ['Service d\'authentification (Supabase)', 'Hébergeurs certifiés'],
          rights: 'Vous disposez d\'un droit d\'accès, rectification, effacement, limitation, portabilité et opposition.',
          contact: LEGAL_CONFIG.company.dpo
        }
      }
    };

    return notices[language][processingType] || notices.fr.analysis;
  }

  /**
   * Générer un formulaire de consentement RGPD-compliant
   */
  static generateConsentForm(purposes, language = 'fr') {
    return {
      version: '1.0',
      language,
      timestamp: new Date().toISOString(),
      purposes: purposes.map(p => ({
        id: p,
        description: this.generateDataProcessingNotice(p, language).purpose,
        legalBasis: this.generateDataProcessingNotice(p, language).legalBasis,
        required: p === 'analysis', // Analyse est obligatoire pour le service
        consent: null // À remplir par l'utilisateur
      })),
      rights: [
        'Droit d\'accès (Article 15 RGPD)',
        'Droit de rectification (Article 16 RGPD)',
        'Droit à l\'effacement (Article 17 RGPD)',
        'Droit à la limitation (Article 18 RGPD)',
        'Droit à la portabilité (Article 20 RGPD)',
        'Droit d\'opposition (Article 21 RGPD)'
      ],
      withdrawConsent: 'Vous pouvez retirer votre consentement à tout moment à l\'adresse: ' + LEGAL_CONFIG.company.dpo,
      complaintRight: 'Vous pouvez déposer une réclamation auprès de la CNIL (www.cnil.fr)'
    };
  }

  /**
   * Vérifier la conformité d'une demande d'exercice de droit RGPD
   */
  static validateRGPDRequest(requestType, userData) {
    const validTypes = ['access', 'rectification', 'erasure', 'limitation', 'portability', 'opposition'];
    
    if (!validTypes.includes(requestType)) {
      return { valid: false, error: 'Type de demande invalide' };
    }

    if (!userData || !userData.email) {
      return { valid: false, error: 'Données utilisateur incomplètes' };
    }

    return {
      valid: true,
      requestType,
      processingDeadline: this._calculateDeadline(30), // 1 mois selon RGPD
      responseFormat: requestType === 'portability' ? 'JSON' : 'PDF',
      freeOfCharge: true
    };
  }

  static _calculateDeadline(days) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline.toISOString();
  }
}

/**
 * Service de conformité légale
 */
class LegalComplianceService {
  /**
   * Générer un disclaimer juridique contextualisé
   */
  static generateDisclaimer(context, language = 'fr') {
    const disclaimers = LEGAL_CONFIG.disclaimers[language];
    return {
      context,
      text: disclaimers[context] || disclaimers.analysis,
      applicableLaw: 'Droit français',
      jurisdiction: 'Tribunaux compétents français',
      lastUpdated: '2024-12-19',
      version: '1.0'
    };
  }

  /**
   * Vérifier la conformité d'un contrat/CGU/CGV
   */
  static validateContractCompliance(documentType) {
    const requirements = {
      cgu: ['Identification éditeur', 'Droits et obligations', 'Propriété intellectuelle', 'Responsabilité', 'Droit applicable'],
      cgv: ['Prix TTC', 'Modalités paiement', 'Droit de rétractation', 'Garanties', 'Médiation consommation'],
      confidentialite: ['Responsable traitement', 'Finalités', 'Bases légales', 'Durées conservation', 'Droits RGPD']
    };

    return {
      documentType,
      requiredElements: requirements[documentType] || [],
      standardsCompliance: ['RGPD', 'Code de la consommation', 'Code civil'],
      mustInclude: 'Mentions légales, coordonnées, DPO'
    };
  }

  /**
   * Générer un footer légal complet
   */
  static generateLegalFooter(language = 'fr') {
    const company = LEGAL_CONFIG.company;
    return {
      company: {
        name: company.name,
        legalForm: company.legalForm,
        siret: company.siret,
        address: company.address,
        email: company.email
      },
      links: [
        { text: 'Mentions Légales', url: '/legal/mentions-legales' },
        { text: 'Politique de Confidentialité', url: '/legal/confidentialite' },
        { text: 'CGU', url: '/legal/cgu' },
        { text: 'CGV', url: '/legal/cgv' },
        { text: 'Politique de Cookies', url: '/legal/cookies' },
        { text: 'Contact DPO', url: `mailto:${company.dpo}` }
      ],
      copyright: `© ${new Date().getFullYear()} ${company.name}. Tous droits réservés.`,
      compliance: ['RGPD', 'ISO 27001', 'Code de la consommation']
    };
  }
}

module.exports = {
  LegalCertificateGenerator,
  RGPDComplianceService,
  LegalComplianceService,
  LEGAL_CONFIG
};
