/**
 * Routes Administration Système
 * Monitoring, logs, backups, analytics pour admin master uniquement
 */

const express = require('express');
const router = express.Router();
const { verifierToken, estAdmin } = require('../../middleware/auth');
const MonitoringService = require('../../services/MonitoringService');
const LoggingService = require('../../services/LoggingService');
const BackupService = require('../../services/BackupService');
const { Utilisateur, Ecole, Figure, Discipline, ProgressionEtape, TentativeEtape, SystemLog } = require('../../models');
const { Op } = require('sequelize');
const path = require('path');

// Tous les endpoints requièrent admin
router.use(verifierToken, estAdmin);

// ═══════════════════════════════════════════════════════════════════
// MONITORING
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/system/health
 * Santé globale du système
 */
router.get('/health', async (req, res) => {
  try {
    const [serverHealth, dbHealth, systemResources] = await Promise.all([
      MonitoringService.getServerHealth(),
      MonitoringService.getDatabaseHealth(),
      MonitoringService.getSystemResources()
    ]);

    res.json({
      server: serverHealth,
      database: dbHealth,
      system: systemResources
    });
  } catch (error) {
    console.error('Error /system/health:', error);
    res.status(500).json({ error: 'Erreur récupération santé système', details: error.message });
  }
});

/**
 * GET /api/admin/system/metrics
 * Métriques temps réel (cache 1 min)
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await MonitoringService.getRealtimeMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error /system/metrics:', error);
    res.status(500).json({ error: 'Erreur récupération métriques', details: error.message });
  }
});

/**
 * GET /api/admin/system/database/stats
 * Statistiques tables MySQL
 */
router.get('/database/stats', async (req, res) => {
  try {
    const stats = await MonitoringService.getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error('Error /system/database/stats:', error);
    res.status(500).json({ error: 'Erreur récupération stats DB', details: error.message });
  }
});

/**
 * GET /api/admin/system/crons/status
 * Statut des cron jobs
 */
router.get('/crons/status', async (req, res) => {
  try {
    const crons = await MonitoringService.getCronJobsStatus();
    res.json(crons);
  } catch (error) {
    console.error('Error /system/crons/status:', error);
    res.status(500).json({ error: 'Erreur récupération status crons', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/system/logs
 * Liste paginée des logs avec filtres
 * Query params: niveau, categorie, dateDebut, dateFin, search, limit, offset
 */
router.get('/logs', async (req, res) => {
  try {
    const { niveau, categorie, dateDebut, dateFin, search, limit = 50, offset = 0 } = req.query;

    const filters = {};
    if (niveau) filters.niveau = niveau;
    if (categorie) filters.categorie = categorie;
    if (dateDebut) filters.dateDebut = dateDebut;
    if (dateFin) filters.dateFin = dateFin;
    if (search) filters.search = search;

    const result = await LoggingService.getLogs(
      filters,
      Math.min(parseInt(limit), 100), // Max 100
      parseInt(offset)
    );

    res.json(result);
  } catch (error) {
    console.error('Error /system/logs:', error);
    res.status(500).json({ error: 'Erreur récupération logs', details: error.message });
  }
});

/**
 * GET /api/admin/system/logs/stats
 * Statistiques agrégées des logs
 * Query params: hours (défaut 24)
 */
router.get('/logs/stats', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const stats = await LoggingService.getLogStats(hours);
    res.json(stats);
  } catch (error) {
    console.error('Error /system/logs/stats:', error);
    res.status(500).json({ error: 'Erreur récupération stats logs', details: error.message });
  }
});

/**
 * GET /api/admin/system/logs/export
 * Export CSV des logs (avec filtres)
 */
router.get('/logs/export', async (req, res) => {
  try {
    const { niveau, categorie, dateDebut, dateFin, search } = req.query;

    const filters = {};
    if (niveau) filters.niveau = niveau;
    if (categorie) filters.categorie = categorie;
    if (dateDebut) filters.dateDebut = dateDebut;
    if (dateFin) filters.dateFin = dateFin;
    if (search) filters.search = search;

    // Récupérer tous les logs correspondants (max 10000)
    const result = await LoggingService.getLogs(filters, 10000, 0);

    // Générer CSV
    const csv = generateLogsCSV(result.logs);

    // Envoyer fichier
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error /system/logs/export:', error);
    res.status(500).json({ error: 'Erreur export logs', details: error.message });
  }
});

/**
 * DELETE /api/admin/system/logs/cleanup
 * Supprime logs avant une date
 * Query param: before (date YYYY-MM-DD)
 */
router.delete('/logs/cleanup', async (req, res) => {
  try {
    const { before } = req.query;

    if (!before) {
      return res.status(400).json({ error: 'Paramètre "before" requis (YYYY-MM-DD)' });
    }

    const cutoffDate = new Date(before);
    if (isNaN(cutoffDate.getTime())) {
      return res.status(400).json({ error: 'Format de date invalide' });
    }

    // Calculer nombre de jours
    const now = new Date();
    const diffDays = Math.ceil((now - cutoffDate) / (1000 * 60 * 60 * 24));

    const deletedCount = await LoggingService.cleanOldLogs(diffDays);

    // Log l'action
    await LoggingService.logAdminAction(
      req.user.id,
      'CLEANUP_LOGS',
      'SystemLog',
      null,
      { deletedCount, before }
    );

    res.json({ message: 'Logs nettoyés', deletedCount, before });
  } catch (error) {
    console.error('Error /system/logs/cleanup:', error);
    res.status(500).json({ error: 'Erreur cleanup logs', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// BACKUPS
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/system/backups
 * Liste des backups disponibles
 */
router.get('/backups', async (req, res) => {
  try {
    const backups = await BackupService.listBackups();
    res.json(backups);
  } catch (error) {
    console.error('Error /system/backups:', error);
    res.status(500).json({ error: 'Erreur récupération backups', details: error.message });
  }
});

/**
 * POST /api/admin/system/backups
 * Créer un backup manuel
 */
router.post('/backups', async (req, res) => {
  try {
    // Vérifier dossier backups
    await BackupService.ensureBackupDirectory();

    const backup = await BackupService.createBackup(req.user.id, 'manual');

    res.status(201).json({ message: 'Backup créé avec succès', backup });
  } catch (error) {
    console.error('Error POST /system/backups:', error);
    res.status(500).json({ error: 'Erreur création backup', details: error.message });
  }
});

/**
 * GET /api/admin/system/backups/:id/download
 * Télécharger un fichier de backup
 */
router.get('/backups/:id/download', async (req, res) => {
  try {
    const { SystemBackup } = require('../../models');
    const backup = await SystemBackup.findByPk(req.params.id);

    if (!backup) {
      return res.status(404).json({ error: 'Backup non trouvé' });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ error: 'Backup non disponible (status: ' + backup.status + ')' });
    }

    // Log téléchargement
    await LoggingService.logAdminAction(
      req.user.id,
      'DOWNLOAD_BACKUP',
      'SystemBackup',
      backup.id,
      { filename: backup.filename }
    );

    // Envoyer fichier
    res.download(backup.filepath, backup.filename);
  } catch (error) {
    console.error('Error GET /system/backups/:id/download:', error);
    res.status(500).json({ error: 'Erreur téléchargement backup', details: error.message });
  }
});

/**
 * DELETE /api/admin/system/backups/:id
 * Supprimer un backup
 */
router.delete('/backups/:id', async (req, res) => {
  try {
    const backupId = parseInt(req.params.id);
    await BackupService.deleteBackup(backupId, req.user.id);

    res.json({ message: 'Backup supprimé avec succès' });
  } catch (error) {
    console.error('Error DELETE /system/backups/:id:', error);
    res.status(500).json({ error: 'Erreur suppression backup', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/system/analytics/users
 * Croissance utilisateurs et répartition par rôle
 */
router.get('/analytics/users', async (req, res) => {
  try {
    // Croissance par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await Utilisateur.findAll({
      where: {
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      attributes: ['id', 'role', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    // Grouper par mois et rôle
    const monthlyGrowth = {};
    users.forEach(user => {
      const month = user.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyGrowth[month]) {
        monthlyGrowth[month] = { admin: 0, school_admin: 0, professeur: 0, eleve: 0, standard: 0 };
      }
      monthlyGrowth[month][user.role] = (monthlyGrowth[month][user.role] || 0) + 1;
    });

    // Répartition totale par rôle
    const totalByRole = await Utilisateur.findAll({
      attributes: [
        'role',
        [Utilisateur.sequelize.fn('COUNT', Utilisateur.sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    const roleDistribution = {};
    totalByRole.forEach(row => {
      roleDistribution[row.role] = parseInt(row.getDataValue('count'));
    });

    res.json({
      monthlyGrowth,
      roleDistribution,
      total: users.length
    });
  } catch (error) {
    console.error('Error /system/analytics/users:', error);
    res.status(500).json({ error: 'Erreur analytics utilisateurs', details: error.message });
  }
});

/**
 * GET /api/admin/system/analytics/schools
 * Statistiques écoles (count, répartition par plan)
 */
router.get('/analytics/schools', async (req, res) => {
  try {
    const schools = await Ecole.findAll({
      attributes: ['id', 'plan', 'statut_abonnement', 'actif']
    });

    const stats = {
      total: schools.length,
      active: schools.filter(s => s.actif).length,
      byPlan: {},
      byStatus: {}
    };

    schools.forEach(school => {
      stats.byPlan[school.plan] = (stats.byPlan[school.plan] || 0) + 1;
      stats.byStatus[school.statut_abonnement] = (stats.byStatus[school.statut_abonnement] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error /system/analytics/schools:', error);
    res.status(500).json({ error: 'Erreur analytics écoles', details: error.message });
  }
});

/**
 * GET /api/admin/system/analytics/activity
 * Activité globale (tentatives par jour, 7 derniers jours)
 */
router.get('/analytics/activity', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tentatives = await TentativeEtape.findAll({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      },
      attributes: ['createdAt']
    });

    // Grouper par jour
    const dailyActivity = {};
    tentatives.forEach(t => {
      const day = t.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    });

    res.json({
      dailyActivity,
      total: tentatives.length
    });
  } catch (error) {
    console.error('Error /system/analytics/activity:', error);
    res.status(500).json({ error: 'Erreur analytics activité', details: error.message });
  }
});

/**
 * GET /api/admin/system/analytics/content
 * Stats contenu (figures, disciplines, progressions)
 */
router.get('/analytics/content', async (req, res) => {
  try {
    const [
      totalFigures,
      publicFigures,
      totalDisciplines,
      totalProgressions,
      totalTentatives
    ] = await Promise.all([
      Figure.count(),
      Figure.count({ where: { ecole_id: null } }),
      Discipline.count(),
      ProgressionEtape.count(),
      TentativeEtape.count()
    ]);

    res.json({
      figures: {
        total: totalFigures,
        public: publicFigures,
        schools: totalFigures - publicFigures
      },
      disciplines: totalDisciplines,
      progressions: totalProgressions,
      tentatives: totalTentatives
    });
  } catch (error) {
    console.error('Error /system/analytics/content:', error);
    res.status(500).json({ error: 'Erreur analytics contenu', details: error.message });
  }
});

/**
 * GET /api/admin/system/analytics/performance
 * Top 10 requêtes lentes et erreurs récentes
 */
router.get('/analytics/performance', async (req, res) => {
  try {
    // Récupérer logs API avec durée (24 dernières heures)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const apiLogs = await SystemLog.findAll({
      where: {
        categorie: 'API',
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      },
      attributes: ['metadata', 'message', 'niveau', 'createdAt'],
      limit: 1000
    });

    // Extraire requêtes lentes (> 1000ms)
    const slowRequests = apiLogs
      .filter(log => log.metadata?.duration_ms && log.metadata.duration_ms > 1000)
      .map(log => ({
        endpoint: log.metadata.endpoint,
        method: log.metadata.method,
        duration_ms: log.metadata.duration_ms,
        timestamp: log.createdAt
      }))
      .sort((a, b) => b.duration_ms - a.duration_ms)
      .slice(0, 10);

    // Erreurs 500 récentes
    const recentErrors = apiLogs
      .filter(log => log.metadata?.statusCode >= 500)
      .map(log => ({
        endpoint: log.metadata.endpoint,
        method: log.metadata.method,
        statusCode: log.metadata.statusCode,
        message: log.message,
        timestamp: log.createdAt
      }))
      .slice(0, 20);

    res.json({
      slowRequests,
      recentErrors
    });
  } catch (error) {
    console.error('Error /system/analytics/performance:', error);
    res.status(500).json({ error: 'Erreur analytics performance', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Génère un CSV à partir des logs
 * @param {array} logs - Liste des logs
 * @returns {string} Contenu CSV
 */
function generateLogsCSV(logs) {
  const header = 'Date,Niveau,Categorie,Message,Utilisateur_ID,IP,Endpoint,Methode\n';
  const rows = logs.map(log => {
    const date = new Date(log.createdAt).toISOString();
    const niveau = log.niveau;
    const categorie = log.categorie;
    const message = `"${(log.message || '').replace(/"/g, '""')}"`;
    const userId = log.metadata?.userId || log.metadata?.utilisateur_id || '';
    const ip = log.metadata?.ip || '';
    const endpoint = log.metadata?.endpoint || '';
    const method = log.metadata?.method || '';

    return `${date},${niveau},${categorie},${message},${userId},${ip},${endpoint},${method}`;
  }).join('\n');

  return header + rows;
}

module.exports = router;
