/**
 * FakeTect API Error Codes
 *
 * Standard error codes for consistent API error handling.
 * Each error has a unique code, HTTP status, and message templates.
 *
 * Usage:
 *   const { ErrorCodes, createError } = require('./constants/errorCodes');
 *   throw createError(ErrorCodes.AUTH_INVALID_CREDENTIALS);
 */

export const ErrorCodes = {
  // ============================================
  // Authentication Errors (AUTH_xxx) - 1xxx
  // ============================================
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    status: 401,
    message: {
      fr: 'Email ou mot de passe incorrect',
      en: 'Invalid email or password',
      es: 'Email o contraseña incorrectos',
      de: 'Ungültige E-Mail oder Passwort',
      it: 'Email o password non validi',
      pt: 'Email ou senha inválidos'
    }
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_002',
    status: 401,
    message: {
      fr: 'Session expirée, veuillez vous reconnecter',
      en: 'Session expired, please log in again',
      es: 'Sesión expirada, por favor inicie sesión nuevamente',
      de: 'Sitzung abgelaufen, bitte erneut anmelden',
      it: 'Sessione scaduta, effettua nuovamente l\'accesso',
      pt: 'Sessão expirada, faça login novamente'
    }
  },
  AUTH_TOKEN_INVALID: {
    code: 'AUTH_003',
    status: 401,
    message: {
      fr: 'Token invalide',
      en: 'Invalid token',
      es: 'Token inválido',
      de: 'Ungültiges Token',
      it: 'Token non valido',
      pt: 'Token inválido'
    }
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_004',
    status: 403,
    message: {
      fr: 'Accès non autorisé',
      en: 'Unauthorized access',
      es: 'Acceso no autorizado',
      de: 'Nicht autorisierter Zugriff',
      it: 'Accesso non autorizzato',
      pt: 'Acesso não autorizado'
    }
  },
  AUTH_EMAIL_EXISTS: {
    code: 'AUTH_005',
    status: 409,
    message: {
      fr: 'Cet email est déjà utilisé',
      en: 'This email is already in use',
      es: 'Este email ya está en uso',
      de: 'Diese E-Mail wird bereits verwendet',
      it: 'Questa email è già in uso',
      pt: 'Este email já está em uso'
    }
  },
  AUTH_WEAK_PASSWORD: {
    code: 'AUTH_006',
    status: 400,
    message: {
      fr: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
      en: 'Password must contain at least 8 characters, one uppercase, one lowercase and one number',
      es: 'La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      de: 'Das Passwort muss mindestens 8 Zeichen, einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten',
      it: 'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero',
      pt: 'A senha deve conter pelo menos 8 caracteres, uma maiúscula, uma minúscula e um número'
    }
  },

  // ============================================
  // Analysis Errors (ANALYSIS_xxx) - 2xxx
  // ============================================
  ANALYSIS_FILE_REQUIRED: {
    code: 'ANALYSIS_001',
    status: 400,
    message: {
      fr: 'Aucun fichier fourni',
      en: 'No file provided',
      es: 'No se proporcionó ningún archivo',
      de: 'Keine Datei bereitgestellt',
      it: 'Nessun file fornito',
      pt: 'Nenhum arquivo fornecido'
    }
  },
  ANALYSIS_FILE_TOO_LARGE: {
    code: 'ANALYSIS_002',
    status: 413,
    message: {
      fr: 'Le fichier est trop volumineux (max 100MB)',
      en: 'File is too large (max 100MB)',
      es: 'El archivo es demasiado grande (máx 100MB)',
      de: 'Datei ist zu groß (max 100MB)',
      it: 'Il file è troppo grande (max 100MB)',
      pt: 'O arquivo é muito grande (máx 100MB)'
    }
  },
  ANALYSIS_INVALID_FORMAT: {
    code: 'ANALYSIS_003',
    status: 415,
    message: {
      fr: 'Format de fichier non supporté',
      en: 'Unsupported file format',
      es: 'Formato de archivo no soportado',
      de: 'Nicht unterstütztes Dateiformat',
      it: 'Formato file non supportato',
      pt: 'Formato de arquivo não suportado'
    }
  },
  ANALYSIS_PROCESSING_FAILED: {
    code: 'ANALYSIS_004',
    status: 500,
    message: {
      fr: 'Erreur lors du traitement de l\'analyse',
      en: 'Error processing analysis',
      es: 'Error al procesar el análisis',
      de: 'Fehler bei der Analyse-Verarbeitung',
      it: 'Errore durante l\'elaborazione dell\'analisi',
      pt: 'Erro ao processar a análise'
    }
  },
  ANALYSIS_NOT_FOUND: {
    code: 'ANALYSIS_005',
    status: 404,
    message: {
      fr: 'Analyse non trouvée',
      en: 'Analysis not found',
      es: 'Análisis no encontrado',
      de: 'Analyse nicht gefunden',
      it: 'Analisi non trovata',
      pt: 'Análise não encontrada'
    }
  },
  ANALYSIS_TIMEOUT: {
    code: 'ANALYSIS_006',
    status: 504,
    message: {
      fr: 'L\'analyse a pris trop de temps',
      en: 'Analysis timed out',
      es: 'El análisis tardó demasiado',
      de: 'Analyse-Zeitüberschreitung',
      it: 'L\'analisi ha impiegato troppo tempo',
      pt: 'A análise demorou muito'
    }
  },

  // ============================================
  // Quota Errors (QUOTA_xxx) - 3xxx
  // ============================================
  QUOTA_EXCEEDED_DAILY: {
    code: 'QUOTA_001',
    status: 429,
    message: {
      fr: 'Quota journalier atteint. Passez à un plan supérieur pour plus d\'analyses.',
      en: 'Daily quota reached. Upgrade your plan for more analyses.',
      es: 'Cuota diaria alcanzada. Actualice su plan para más análisis.',
      de: 'Tägliches Kontingent erreicht. Upgraden Sie für mehr Analysen.',
      it: 'Quota giornaliera raggiunta. Passa a un piano superiore per più analisi.',
      pt: 'Cota diária atingida. Atualize seu plano para mais análises.'
    }
  },
  QUOTA_EXCEEDED_MONTHLY: {
    code: 'QUOTA_002',
    status: 429,
    message: {
      fr: 'Quota mensuel atteint',
      en: 'Monthly quota reached',
      es: 'Cuota mensual alcanzada',
      de: 'Monatliches Kontingent erreicht',
      it: 'Quota mensile raggiunta',
      pt: 'Cota mensal atingida'
    }
  },
  QUOTA_FREE_EXPIRED: {
    code: 'QUOTA_003',
    status: 403,
    message: {
      fr: 'Votre période d\'essai gratuite est terminée',
      en: 'Your free trial has expired',
      es: 'Su período de prueba gratuito ha terminado',
      de: 'Ihre kostenlose Testphase ist abgelaufen',
      it: 'Il tuo periodo di prova gratuito è scaduto',
      pt: 'Seu período de teste gratuito expirou'
    }
  },

  // ============================================
  // Payment Errors (PAYMENT_xxx) - 4xxx
  // ============================================
  PAYMENT_FAILED: {
    code: 'PAYMENT_001',
    status: 402,
    message: {
      fr: 'Le paiement a échoué',
      en: 'Payment failed',
      es: 'El pago falló',
      de: 'Zahlung fehlgeschlagen',
      it: 'Pagamento fallito',
      pt: 'Pagamento falhou'
    }
  },
  PAYMENT_CARD_DECLINED: {
    code: 'PAYMENT_002',
    status: 402,
    message: {
      fr: 'Carte refusée',
      en: 'Card declined',
      es: 'Tarjeta rechazada',
      de: 'Karte abgelehnt',
      it: 'Carta rifiutata',
      pt: 'Cartão recusado'
    }
  },
  PAYMENT_SUBSCRIPTION_NOT_FOUND: {
    code: 'PAYMENT_003',
    status: 404,
    message: {
      fr: 'Abonnement non trouvé',
      en: 'Subscription not found',
      es: 'Suscripción no encontrada',
      de: 'Abonnement nicht gefunden',
      it: 'Abbonamento non trovato',
      pt: 'Assinatura não encontrada'
    }
  },
  PAYMENT_WEBHOOK_INVALID: {
    code: 'PAYMENT_004',
    status: 400,
    message: {
      fr: 'Signature webhook invalide',
      en: 'Invalid webhook signature',
      es: 'Firma de webhook inválida',
      de: 'Ungültige Webhook-Signatur',
      it: 'Firma webhook non valida',
      pt: 'Assinatura de webhook inválida'
    }
  },

  // ============================================
  // Rate Limiting Errors (RATE_xxx) - 5xxx
  // ============================================
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_001',
    status: 429,
    message: {
      fr: 'Trop de requêtes. Veuillez réessayer dans quelques minutes.',
      en: 'Too many requests. Please try again in a few minutes.',
      es: 'Demasiadas solicitudes. Por favor, inténtelo de nuevo en unos minutos.',
      de: 'Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.',
      it: 'Troppe richieste. Riprova tra qualche minuto.',
      pt: 'Muitas solicitações. Por favor, tente novamente em alguns minutos.'
    }
  },
  RATE_LIMIT_AUTH: {
    code: 'RATE_002',
    status: 429,
    message: {
      fr: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
      en: 'Too many login attempts. Please try again later.',
      es: 'Demasiados intentos de inicio de sesión. Inténtelo más tarde.',
      de: 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.',
      it: 'Troppi tentativi di accesso. Riprova più tardi.',
      pt: 'Muitas tentativas de login. Tente novamente mais tarde.'
    }
  },

  // ============================================
  // Validation Errors (VALIDATION_xxx) - 6xxx
  // ============================================
  VALIDATION_REQUIRED_FIELD: {
    code: 'VALIDATION_001',
    status: 400,
    message: {
      fr: 'Champ requis manquant',
      en: 'Required field missing',
      es: 'Campo requerido faltante',
      de: 'Erforderliches Feld fehlt',
      it: 'Campo obbligatorio mancante',
      pt: 'Campo obrigatório faltando'
    }
  },
  VALIDATION_INVALID_EMAIL: {
    code: 'VALIDATION_002',
    status: 400,
    message: {
      fr: 'Email invalide',
      en: 'Invalid email',
      es: 'Email inválido',
      de: 'Ungültige E-Mail',
      it: 'Email non valida',
      pt: 'Email inválido'
    }
  },
  VALIDATION_INVALID_FORMAT: {
    code: 'VALIDATION_003',
    status: 400,
    message: {
      fr: 'Format invalide',
      en: 'Invalid format',
      es: 'Formato inválido',
      de: 'Ungültiges Format',
      it: 'Formato non valido',
      pt: 'Formato inválido'
    }
  },

  // ============================================
  // Server Errors (SERVER_xxx) - 9xxx
  // ============================================
  SERVER_ERROR: {
    code: 'SERVER_001',
    status: 500,
    message: {
      fr: 'Erreur serveur interne',
      en: 'Internal server error',
      es: 'Error interno del servidor',
      de: 'Interner Serverfehler',
      it: 'Errore interno del server',
      pt: 'Erro interno do servidor'
    }
  },
  SERVER_UNAVAILABLE: {
    code: 'SERVER_002',
    status: 503,
    message: {
      fr: 'Service temporairement indisponible',
      en: 'Service temporarily unavailable',
      es: 'Servicio temporalmente no disponible',
      de: 'Dienst vorübergehend nicht verfügbar',
      it: 'Servizio temporaneamente non disponibile',
      pt: 'Serviço temporariamente indisponível'
    }
  },
  SERVER_DATABASE_ERROR: {
    code: 'SERVER_003',
    status: 500,
    message: {
      fr: 'Erreur de base de données',
      en: 'Database error',
      es: 'Error de base de datos',
      de: 'Datenbankfehler',
      it: 'Errore del database',
      pt: 'Erro de banco de dados'
    }
  }
};

/**
 * Creates a standardized API error response
 * @param {Object} errorDef - Error definition from ErrorCodes
 * @param {string} lang - Language code (fr, en, es, de, it, pt)
 * @param {Object} details - Additional error details
 * @returns {Object} Error response object
 */
export function createErrorResponse(errorDef, lang = 'en', details = {}) {
  const message = errorDef.message[lang] || errorDef.message.en;
  return {
    success: false,
    error: {
      code: errorDef.code,
      message,
      ...details
    }
  };
}

/**
 * Creates an Error object with API error code attached
 * @param {Object} errorDef - Error definition from ErrorCodes
 * @param {string} lang - Language code
 * @returns {Error} Error object with status and code properties
 */
export function createError(errorDef, lang = 'en') {
  const message = errorDef.message[lang] || errorDef.message.en;
  const error = new Error(message);
  error.status = errorDef.status;
  error.code = errorDef.code;
  return error;
}

// CommonJS compatibility
export default { ErrorCodes, createErrorResponse, createError };
