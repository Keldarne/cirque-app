/**
 * Service de Logging Structuré
 * Gère l'enregistrement centralisé des logs système
 */

const { SystemLog } = require('../models');
const { Op } = require('sequelize');

class LoggingService {
  /**
   * Méthode principale de logging
   * @param {string} niveau - INFO, WARN, ERROR, CRITICAL
   * @param {string} categorie - API, AUTH, DATABASE, CRON, ADMIN_ACTION, SECURITY
   * @param {string} message - Message descriptif
   * @param {object} metadata - Métadonnées additionnelles
   */
  static async log(niveau, categorie, message, metadata = {}) {
    try {
      // Enrichir metadata avec environnement
      const enrichedMetadata = {
        ...metadata,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      };

      await SystemLog.create({
        niveau,
        categorie,
        message,
        metadata: enrichedMetadata
      });
    } catch (error) {
      // Ne pas bloquer l'application si le logging échoue
      console.error('[LoggingService] Erreur lors de l\'écriture du log:', error.message);
    }
  }

  /**
   * Log niveau INFO
   */
  static async info(categorie, message, metadata = {}) {
    return this.log('INFO', categorie, message, metadata);
  }

  /**
   * Log niveau WARN
   */
  static async warn(categorie, message, metadata = {}) {
    return this.log('WARN', categorie, message, metadata);
  }

  /**
   * Log niveau ERROR
   */
  static async error(categorie, message, metadata = {}) {
    return this.log('ERROR', categorie, message, metadata);
  }

  /**
   * Log niveau CRITICAL
   */
  static async critical(categorie, message, metadata = {}) {
    return this.log('CRITICAL', categorie, message, metadata);
  }

  /**
   * Log une action administrative (audit trail)
   * @param {number} userId - ID de l'utilisateur
   * @param {string} action - Type d'action (CREATE_FIGURE, DELETE_USER, etc.)
   * @param {string} entity - Type d'entité (Figure, Utilisateur, etc.)
   * @param {number} entityId - ID de l'entité
   * @param {object} changes - Détails des modifications
   */
  static async logAdminAction(userId, action, entity, entityId, changes = {}) {
    return this.log('INFO', 'ADMIN_ACTION', `${action} on ${entity} #${entityId}`, {
      userId,
      action,
      entity,
      entityId,
      changes
    });
  }

  /**
   * Log un événement d'authentification
   * @param {number|null} userId - ID utilisateur (null si échec)
   * @param {string} eventType - LOGIN, LOGOUT, REGISTER, FAILED_LOGIN
   * @param {string} ip - Adresse IP
   * @param {boolean} success - Succès ou échec
   */
  static async logAuthEvent(userId, eventType, ip, success) {
    const niveau = success ? 'INFO' : 'WARN';
    return this.log(niveau, 'AUTH', `${eventType} ${success ? 'success' : 'failed'}`, {
      userId,
      eventType,
      ip,
      success
    });
  }

  /**
   * Log une erreur API
   * @param {object} req - Objet request Express
   * @param {Error} error - Erreur capturée
   */
  static async logApiError(req, error) {
    return this.log('ERROR', 'API', `API Error: ${error.message}`, {
      endpoint: req.path,
      method: req.method,
      userId: req.user?.id || null,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      error: error.message,
      stack: error.stack
    });
  }

  /**
   * Nettoie les logs anciens (pour cron job)
   * @param {number} retentionDays - Nombre de jours à conserver (défaut: 90)
   * @returns {number} Nombre de logs supprimés
   */
  static async cleanOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await SystemLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      await this.info('CRON', `Cleanup: ${result} logs supprimés (> ${retentionDays} jours)`, {
        deletedCount: result,
        retentionDays,
        cutoffDate: cutoffDate.toISOString()
      });

      return result;
    } catch (error) {
      console.error('[LoggingService] Erreur lors du cleanup des logs:', error.message);
      throw error;
    }
  }

  /**
   * Récupère les logs avec filtres et pagination
   * @param {object} filters - Filtres (niveau, categorie, dateDebut, dateFin, search)
   * @param {number} limit - Nombre de résultats
   * @param {number} offset - Offset pour pagination
   * @returns {object} { logs, totalCount }
   */
  static async getLogs(filters = {}, limit = 50, offset = 0) {
    const where = {};

    // Filtres
    if (filters.niveau) {
      where.niveau = filters.niveau;
    }
    if (filters.categorie) {
      where.categorie = filters.categorie;
    }
    if (filters.dateDebut || filters.dateFin) {
      where.createdAt = {};
      if (filters.dateDebut) {
        where.createdAt[Op.gte] = new Date(filters.dateDebut);
      }
      if (filters.dateFin) {
        where.createdAt[Op.lte] = new Date(filters.dateFin);
      }
    }
    if (filters.search) {
      where.message = {
        [Op.like]: `%${filters.search}%`
      };
    }

    const { count, rows } = await SystemLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      logs: rows,
      totalCount: count
    };
  }

  /**
   * Statistiques agrégées des logs
   * @param {number} hours - Nombre d'heures à analyser (défaut: 24)
   * @returns {object} Statistiques par niveau et catégorie
   */
  static async getLogStats(hours = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const logs = await SystemLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: since
        }
      },
      attributes: ['niveau', 'categorie']
    });

    // Agrégation manuelle
    const stats = {
      total: logs.length,
      byLevel: {},
      byCategory: {}
    };

    logs.forEach(log => {
      stats.byLevel[log.niveau] = (stats.byLevel[log.niveau] || 0) + 1;
      stats.byCategory[log.categorie] = (stats.byCategory[log.categorie] || 0) + 1;
    });

    return stats;
  }
}

module.exports = LoggingService;
