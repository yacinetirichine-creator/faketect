const crypto = require('crypto');

/**
 * Middleware pour ajouter un Request ID unique à chaque requête
 * Améliore la traçabilité et le debugging
 */
function requestId(req, res, next) {
  // Utiliser l'ID fourni par le client ou en générer un nouveau
  const id = req.headers['x-request-id'] || crypto.randomUUID();

  // Attacher à la requête
  req.requestId = id;

  // Ajouter dans les headers de réponse
  res.setHeader('X-Request-ID', id);

  // Ajouter au logger si disponible
  if (req.logger) {
    req.logger = req.logger.child({ requestId: id });
  }

  next();
}

module.exports = { requestId };
