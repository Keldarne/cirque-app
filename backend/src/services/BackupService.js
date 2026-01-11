/**
 * Service de Backup de Base de Données
 * Gère la création, la liste et la suppression des backups MySQL
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { SystemBackup } = require('../models');
const LoggingService = require('./LoggingService');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
  }

  /**
   * Créer un backup de la base de données
   * @param {number|null} userId - ID utilisateur (null si automatique)
   * @param {string} type - 'manual' ou 'automatic'
   * @returns {object} Informations du backup créé
   */
  async createBackup(userId = null, type = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    const dateStr = timestamp[0]; // YYYY-MM-DD
    const timeStr = timestamp[1].substring(0, 8); // HHMMSS
    const filename = `backup_${dateStr}_${timeStr}.sql`;
    const filepath = path.join(this.backupDir, filename);

    // Créer enregistrement avec status 'in_progress'
    const backup = await SystemBackup.create({
      filename,
      filepath,
      size_bytes: 0, // Sera mis à jour après création
      type,
      created_by: userId,
      status: 'in_progress'
    });

    try {
      // Log début backup
      await LoggingService.info('ADMIN_ACTION', `Backup ${type} started`, {
        userId,
        backupId: backup.id,
        filename
      });

      // Construire commande mysqldump
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cirque_app_dev'
      };

      // Commande mysqldump (compatible Windows et Unix)
      let dumpCommand;
      if (process.platform === 'win32') {
        // Windows
        dumpCommand = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} > "${filepath}"`;
      } else {
        // Unix/Linux/Mac
        dumpCommand = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ''} ${dbConfig.database} > "${filepath}"`;
      }

      // Exécuter mysqldump
      await this.executeCommand(dumpCommand);

      // Vérifier taille du fichier
      const stats = await fs.stat(filepath);
      const sizeBytes = stats.size;

      // Mettre à jour backup
      await backup.update({
        size_bytes: sizeBytes,
        status: 'completed'
      });

      // Log succès
      await LoggingService.info('ADMIN_ACTION', `Backup ${type} completed`, {
        userId,
        backupId: backup.id,
        filename,
        size_bytes: sizeBytes
      });

      return {
        id: backup.id,
        filename,
        size_bytes: sizeBytes,
        type,
        status: 'completed',
        createdAt: backup.createdAt
      };

    } catch (error) {
      // Mettre à jour backup en 'failed'
      await backup.update({
        status: 'failed',
        error_message: error.message
      });

      // Log erreur
      await LoggingService.error('ADMIN_ACTION', `Backup ${type} failed: ${error.message}`, {
        userId,
        backupId: backup.id,
        error: error.message,
        stack: error.stack
      });

      // Tenter de supprimer fichier partiel
      try {
        await fs.unlink(filepath);
      } catch (unlinkError) {
        // Ignorer si fichier n'existe pas
      }

      throw error;
    }
  }

  /**
   * Exécute une commande shell
   * @param {string} command - Commande à exécuter
   * @returns {Promise<string>} Sortie de la commande
   */
  executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}\n${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Lister tous les backups disponibles
   * @returns {array} Liste des backups avec métadonnées
   */
  async listBackups() {
    const backups = await SystemBackup.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          association: 'creator',
          attributes: ['id', 'pseudo', 'nom', 'prenom']
        }
      ]
    });

    return backups;
  }

  /**
   * Supprimer un backup
   * @param {number} backupId - ID du backup
   * @param {number} userId - ID utilisateur effectuant la suppression
   * @returns {boolean} Succès
   */
  async deleteBackup(backupId, userId) {
    const backup = await SystemBackup.findByPk(backupId);

    if (!backup) {
      throw new Error('Backup non trouvé');
    }

    try {
      // Supprimer fichier physique
      await fs.unlink(backup.filepath);
    } catch (error) {
      // Log warning si fichier déjà supprimé
      await LoggingService.warn('ADMIN_ACTION', `Fichier backup déjà supprimé: ${backup.filename}`, {
        userId,
        backupId,
        error: error.message
      });
    }

    // Supprimer enregistrement DB
    await backup.destroy();

    // Log suppression
    await LoggingService.info('ADMIN_ACTION', `Backup deleted: ${backup.filename}`, {
      userId,
      backupId,
      filename: backup.filename
    });

    return true;
  }

  /**
   * Rotation des backups automatiques (garder seulement les N derniers)
   * @param {number} keepLast - Nombre de backups à conserver
   * @returns {number} Nombre de backups supprimés
   */
  async rotateBackups(keepLast = 7) {
    // Récupérer backups automatiques triés par date
    const automaticBackups = await SystemBackup.findAll({
      where: {
        type: 'automatic',
        status: 'completed'
      },
      order: [['createdAt', 'DESC']]
    });

    // Si moins que keepLast, rien à faire
    if (automaticBackups.length <= keepLast) {
      return 0;
    }

    // Garder les N premiers, supprimer le reste
    const toDelete = automaticBackups.slice(keepLast);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        await this.deleteBackup(backup.id, null); // null = système
        deletedCount++;
      } catch (error) {
        await LoggingService.error('CRON', `Erreur rotation backup ${backup.filename}: ${error.message}`, {
          backupId: backup.id,
          error: error.message
        });
      }
    }

    await LoggingService.info('CRON', `Rotation backups: ${deletedCount} supprimés (conservés: ${keepLast})`, {
      deletedCount,
      kept: keepLast,
      total: automaticBackups.length
    });

    return deletedCount;
  }

  /**
   * Vérifier l'existence du dossier backups et le créer si nécessaire
   */
  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      // Dossier n'existe pas, le créer
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`[BackupService] Dossier backups créé: ${this.backupDir}`);
    }
  }
}

module.exports = new BackupService();
