/**
 * Middleware de Gestion des Erreurs Globales
 * Capture et log toutes les erreurs non gérées
 */

const LoggingService = require('../services/LoggingService');

/**
 * Sanitize body pour enlever données sensibles
 * @param {object} body - Corps de requête
 * @returns {object} Body sanitizé
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'mot_de_passe', 'token', 'secret', 'apiKey'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Middleware de gestion d'erreurs (à placer en dernier dans server.js)
 * @param {Error} err - Erreur capturée
 * @param {object} req - Request Express
 * @param {object} res - Response Express
 * @param {function} next - Next middleware
 */
const errorLogger = async (err, req, res, next) => {
  // Log l'erreur de manière critique
  await LoggingService.critical('API', `Unhandled Error: ${err.message}`, {
    error: err.message,
    stack: err.stack,
    method: req.method,
    endpoint: req.path,
    userId: req.user?.id || null,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    query: req.query,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
  });

  // Log également dans console pour debug
  console.error('[ERROR]', err);

  // Retourner réponse user-friendly
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Une erreur interne est survenue'
      : err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorLogger;
