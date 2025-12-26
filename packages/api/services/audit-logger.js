/**
 * 📋 Audit Logger - Logging des actions sensibles
 * Enregistre authentifications, modifications, accès admin
 */
const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    // Cleanup logs > 30 jours
    this.cleanupOldLogs();
  }

  /**
   * Log une action sensible
   */
  log(event, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      ...data
    };

    // Enregistrer dans le fichier journal
    const logFile = path.join(this.logsDir, `audit-${new Date().toISOString().split('T')[0]}.jsonl`);
    
    try {
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (err) {
      console.error('❌ Audit log failed:', err.message);
    }

    // Afficher en console aussi
    console.log(`[AUDIT] ${event}:`, data);
  }

  /**
   * 🔐 Authentification réussie
   */
  loginSuccess(userId, email, ip) {
    this.log('LOGIN_SUCCESS', {
      userId,
      email: this.hashEmail(email),
      ip: this.hashIP(ip),
      userAgent: this.truncateUA(email)
    });
  }

  /**
   * 🚫 Tentative de connexion échouée
   */
  loginFailed(email, reason, ip) {
    this.log('LOGIN_FAILED', {
      email: this.hashEmail(email),
      reason,
      ip: this.hashIP(ip)
    });
  }

  /**
   * 🔒 Changement de mot de passe
   */
  passwordChanged(userId, ip) {
    this.log('PASSWORD_CHANGED', {
      userId,
      ip: this.hashIP(ip)
    });
  }

  /**
   * 🔑 2FA activé
   */
  twoFAEnabled(userId, method) {
    this.log('2FA_ENABLED', {
      userId,
      method // 'totp', 'sms', etc.
    });
  }

  /**
   * 📊 Analyse lancée
   */
  analysisStarted(analysisId, userId, sourceType, source) {
    this.log('ANALYSIS_STARTED', {
      analysisId,
      userId: userId || 'guest',
      sourceType,
      source
    });
  }

  /**
   * ✅ Analyse complétée
   */
  analysisCompleted(analysisId, userId, isAI, duration) {
    this.log('ANALYSIS_COMPLETED', {
      analysisId,
      userId: userId || 'guest',
      isAI,
      duration_ms: duration
    });
  }

  /**
   * 💳 Paiement traité
   */
  paymentProcessed(userId, amount, currency, status) {
    this.log('PAYMENT_PROCESSED', {
      userId,
      amount,
      currency,
      status
    });
  }

  /**
   * 🗑️ Compte supprimé
   */
  accountDeleted(userId) {
    this.log('ACCOUNT_DELETED', {
      userId
    });
  }

  /**
   * 👨‍💼 Accès admin
   */
  adminAccess(userId, action, resource) {
    this.log('ADMIN_ACCESS', {
      userId,
      action,
      resource
    });
  }

  /**
   * ⚠️ Anomalie détectée
   */
  anomalyDetected(type, details) {
    this.log('ANOMALY_DETECTED', {
      type,
      details,
      severity: 'HIGH'
    });
  }

  /**
   * 🚨 Incident de sécurité
   */
  securityIncident(type, description, affectedUsers = []) {
    this.log('SECURITY_INCIDENT', {
      type,
      description,
      affectedUsers,
      severity: 'CRITICAL'
    });
  }

  /**
   * Hash email pour privacy
   */
  hashEmail(email) {
    if (!email) return 'unknown';
    const parts = email.split('@');
    return `${parts[0].substring(0, 2)}***@${parts[1]}`;
  }

  /**
   * Hash IP pour privacy (SHA-256)
   */
  hashIP(ip) {
    if (!ip) return 'unknown';
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 8);
  }

  /**
   * Tronquer User-Agent
   */
  truncateUA(ua) {
    if (!ua) return 'unknown';
    return ua.substring(0, 50);
  }

  /**
   * Nettoyer les logs > 30 jours
   */
  cleanupOldLogs() {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    const now = Date.now();

    try {
      const files = fs.readdirSync(this.logsDir);
      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Deleted old audit log: ${file}`);
        }
      });
    } catch (err) {
      console.error('❌ Cleanup error:', err.message);
    }
  }

  /**
   * Exporter les logs pour analyse (ex: SIEM)
   */
  exportLogs(daysAgo = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const logs = [];
    const files = fs.readdirSync(this.logsDir);

    files.forEach(file => {
      if (file < `audit-${cutoffString}`) return;

      const filePath = path.join(this.logsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(Boolean);

      lines.forEach(line => {
        try {
          logs.push(JSON.parse(line));
        } catch (e) {
          // Ignore parse errors
        }
      });
    });

    return logs;
  }
}

module.exports = new AuditLogger();
