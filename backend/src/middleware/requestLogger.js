/**
 * Middleware de Logging des Requêtes API
 * Log automatiquement toutes les requêtes avec temps de réponse
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
 * Middleware pour logger les requêtes API
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capturer la fin de la requête
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Déterminer niveau de log
    let niveau = 'INFO';
    if (statusCode >= 500) {
      niveau = 'ERROR';
    } else if (statusCode >= 400) {
      niveau = 'WARN';
    }

    // Métadonnées de la requête
    const metadata = {
      method: req.method,
      endpoint: req.path,
      statusCode,
      duration_ms: duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || null,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      body: req.method !== 'GET' && req.body ? sanitizeBody(req.body) : undefined
    };

    // Message
    const message = `${req.method} ${req.path} ${statusCode} ${duration}ms`;

    // Logger
    await LoggingService.log(niveau, 'API', message, metadata);
  });

  next();
};

module.exports = requestLogger;
