/**
 * Service de Monitoring Système
 * Collecte des métriques système, serveur et base de données
 */

const os = require('os');
const sequelize = require('../../db');
const { SystemLog } = require('../models');
const { Op } = require('sequelize');

class MonitoringService {
  constructor() {
    // Cache des métriques (1 minute)
    this.metricsCache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 60 * 1000; // 1 minute en ms
  }

  /**
   * Santé globale du serveur
   * @returns {object} { status, uptime, nodeVersion, env, timestamp }
   */
  async getServerHealth() {
    const uptime = process.uptime(); // Secondes depuis démarrage

    return {
      status: 'UP',
      uptime: Math.floor(uptime),
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Santé de la base de données
   * @returns {object} { connected, pool, latency_ms }
   */
  async getDatabaseHealth() {
    try {
      const startTime = Date.now();
      await sequelize.authenticate();
      const latency = Date.now() - startTime;

      // Pool de connexions
      const pool = sequelize.connectionManager.pool;
      const poolStats = {
        active: pool._allObjects.length - pool._availableObjects.length,
        idle: pool._availableObjects.length,
        total: pool._allObjects.length,
        max: pool._config.max,
        min: pool._config.min
      };

      return {
        connected: true,
        pool: poolStats,
        latency_ms: latency
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Ressources système (CPU, RAM, Disque)
   * @returns {object} { cpu, memory, disk }
   */
  async getSystemResources() {
    // CPU usage (approximatif via load average)
    const cpus = os.cpus();
    const loadAvg = os.loadavg()[0]; // 1 minute load average
    const cpuUsagePercent = Math.min(100, (loadAvg / cpus.length) * 100);

    // Memory
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Disk - approximation via process memory (pas de librairie native)
    // Note: Pour production, utiliser une librairie comme 'diskusage'
    const processMemory = process.memoryUsage();

    return {
      cpu: {
        usage_percent: Math.round(cpuUsagePercent * 100) / 100,
        cores: cpus.length,
        model: cpus[0].model
      },
      memory: {
        used_mb: Math.round(usedMemory / 1024 / 1024),
        total_mb: Math.round(totalMemory / 1024 / 1024),
        percent: Math.round(memoryUsagePercent * 100) / 100
      },
      process: {
        rss_mb: Math.round(processMemory.rss / 1024 / 1024),
        heapUsed_mb: Math.round(processMemory.heapUsed / 1024 / 1024),
        heapTotal_mb: Math.round(processMemory.heapTotal / 1024 / 1024)
      }
    };
  }

  /**
   * Métriques API (basées sur les logs)
   * @returns {object} { avg_response_time_ms, requests_per_minute, error_rate_percent }
   */
  async getApiMetrics() {
    try {
      const since = new Date();
      since.setHours(since.getHours() - 1); // Dernière heure

      // Compte requêtes API
      const apiLogs = await SystemLog.count({
        where: {
          categorie: 'API',
          createdAt: {
            [Op.gte]: since
          }
        }
      });

      // Compte erreurs API
      const apiErrors = await SystemLog.count({
        where: {
          categorie: 'API',
          niveau: {
            [Op.in]: ['ERROR', 'CRITICAL']
          },
          createdAt: {
            [Op.gte]: since
          }
        }
      });

      const requestsPerMinute = Math.round(apiLogs / 60);
      const errorRatePercent = apiLogs > 0 ? Math.round((apiErrors / apiLogs) * 100 * 100) / 100 : 0;

      return {
        requests_last_hour: apiLogs,
        requests_per_minute: requestsPerMinute,
        errors_last_hour: apiErrors,
        error_rate_percent: errorRatePercent
      };
    } catch (error) {
      return {
        requests_last_hour: 0,
        requests_per_minute: 0,
        errors_last_hour: 0,
        error_rate_percent: 0,
        error: error.message
      };
    }
  }

  /**
   * Statistiques de la base de données (tailles des tables)
   * @returns {object} { tables: [{name, rows, size_mb}], total_size_mb }
   */
  async getDatabaseStats() {
    try {
      const [results] = await sequelize.query(`
        SELECT
          TABLE_NAME as name,
          TABLE_ROWS as rows,
          ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as size_mb
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
        LIMIT 20
      `);

      const totalSize = results.reduce((sum, table) => sum + parseFloat(table.size_mb || 0), 0);

      return {
        tables: results,
        total_size_mb: Math.round(totalSize * 100) / 100
      };
    } catch (error) {
      return {
        tables: [],
        total_size_mb: 0,
        error: error.message
      };
    }
  }

  /**
   * Status des cron jobs (à enrichir manuellement)
   * @returns {array} Liste des cron jobs avec leur statut
   */
  async getCronJobsStatus() {
    // Récupère les derniers logs CRON
    const cronLogs = await SystemLog.findAll({
      where: {
        categorie: 'CRON'
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Définition des crons connus
    const knownCrons = [
      {
        name: 'Memory Decay Update',
        schedule: '0 2 * * * (2:00 AM daily)',
        description: 'Mise à jour du niveau de dégradation de la mémoire'
      },
      {
        name: 'Suggestions Cache Refresh',
        schedule: '0 3 * * * (3:00 AM daily)',
        description: 'Rafraîchissement du cache de suggestions'
      },
      {
        name: 'Backup automatique',
        schedule: '0 4 * * * (4:00 AM daily)',
        description: 'Backup automatique de la base de données'
      },
      {
        name: 'Cleanup logs',
        schedule: '0 0 * * 0 (00:00 Sunday)',
        description: 'Nettoyage des logs anciens (> 90 jours)'
      }
    ];

    // Enrichir avec les dernières exécutions des logs
    const enrichedCrons = knownCrons.map(cron => {
      const relatedLog = cronLogs.find(log =>
        log.message.toLowerCase().includes(cron.name.toLowerCase().split(' ')[0])
      );

      return {
        ...cron,
        lastRun: relatedLog ? relatedLog.createdAt : null,
        status: relatedLog ? (relatedLog.niveau === 'ERROR' ? 'failed' : 'success') : 'pending'
      };
    });

    return enrichedCrons;
  }

  /**
   * Métriques temps réel agrégées (avec cache 1 minute)
   * @returns {object} Toutes les métriques en un seul appel
   */
  async getRealtimeMetrics() {
    const now = Date.now();

    // Vérifier cache
    if (this.metricsCache && this.cacheTimestamp && (now - this.cacheTimestamp < this.CACHE_DURATION)) {
      return {
        ...this.metricsCache,
        cached: true,
        cacheAge: Math.round((now - this.cacheTimestamp) / 1000)
      };
    }

    // Calculer nouvelles métriques
    const [serverHealth, dbHealth, systemResources, apiMetrics, crons] = await Promise.all([
      this.getServerHealth(),
      this.getDatabaseHealth(),
      this.getSystemResources(),
      this.getApiMetrics(),
      this.getCronJobsStatus()
    ]);

    const metrics = {
      server: serverHealth,
      database: dbHealth,
      system: systemResources,
      api: apiMetrics,
      crons,
      cached: false,
      timestamp: new Date().toISOString()
    };

    // Mettre en cache
    this.metricsCache = metrics;
    this.cacheTimestamp = now;

    return metrics;
  }
}

// Export singleton
module.exports = new MonitoringService();
