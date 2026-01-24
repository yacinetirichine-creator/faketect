const winston = require('winston');
const path = require('path');

// Configuration Winston pour logging structuré
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'faketect-api' },
  transports: [
    // Logs d'erreur dans un fichier séparé
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Tous les logs dans combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// En développement, afficher aussi dans la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }));
}

// Helper functions pour faciliter l'usage
logger.logRequest = (req, message = 'Request') => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
  });
};

logger.logError = (error, req = null) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
    }),
  });
};

logger.logAuth = (event, email, success, reason = null) => {
  logger.info('Authentication event', {
    event, // 'login', 'register', 'logout'
    email,
    success,
    reason,
  });
};

module.exports = logger;
