const { ProgressionEtape } = require('../models');
const { isAfter, differenceInDays, addDays } = require('date-fns');
const sequelize = require('../../db');
const { Op, QueryTypes } = require('sequelize');

class MemoryDecayService {

  /**
   * Calcule le niveau de déclin mémoriel basé sur la date de validation.
   * Nouveaux seuils optimisés (2026-01):
   * - Fresh: 0-14 jours
   * - Fragile: 15-30 jours
   * - Stale: 31-60 jours
   * - Forgotten: 61+ jours
   * @param {Date} dateValidation - La date à laquelle l'étape a été validée pour la dernière fois.
   * @returns {string} - 'fresh', 'fragile', 'stale', 'forgotten'
   */
  static calculerDecayLevel(dateValidation) {
    if (!dateValidation || !(dateValidation instanceof Date) || isNaN(dateValidation.getTime())) {
      return 'forgotten'; // Date invalide ou null → oublié
    }

    const now = new Date();
    const daysSinceValidation = differenceInDays(now, dateValidation);

    // Si date future (cas limite), considérer comme fresh
    if (daysSinceValidation < 0) {
      return 'fresh';
    }

    if (daysSinceValidation <= 14) {
      return 'fresh';
    } else if (daysSinceValidation <= 30) {
      return 'fragile';
    } else if (daysSinceValidation <= 60) {
      return 'stale';
    } else {
      return 'forgotten';
    }
  }

  /**
   * Met à jour le niveau de déclin mémoriel pour toutes les ProgressionEtape validées.
   * Cette méthode est conçue pour être exécutée périodiquement (ex: via un cron job).
   * Optimisée avec une seule requête SQL bulk UPDATE pour de meilleures performances.
   * Nouveaux seuils: Fresh (0-14j), Fragile (15-30j), Stale (31-60j), Forgotten (61+j)
   * @returns {Promise<Object>} - { total, updated } Le nombre d'enregistrements traités et mis à jour.
   */
  static async updateAllDecayLevels() {
    console.log('Début de la mise à jour des niveaux de déclin mémoriel...');

    try {
      // Compter le total d'enregistrements à traiter
      const total = await ProgressionEtape.count({ where: { statut: 'valide' } });

      // Utiliser une seule requête UPDATE avec CASE pour mettre à jour tous les enregistrements
      // Optimisation majeure: passe de O(n) requêtes à 1 seule requête
      const [results] = await sequelize.query(`
        UPDATE ProgressionEtapes
        SET decay_level = CASE
          WHEN date_validation IS NULL THEN 'forgotten'
          WHEN DATEDIFF(NOW(), date_validation) < 0 THEN 'fresh'
          WHEN DATEDIFF(NOW(), date_validation) <= 14 THEN 'fresh'
          WHEN DATEDIFF(NOW(), date_validation) <= 30 THEN 'fragile'
          WHEN DATEDIFF(NOW(), date_validation) <= 60 THEN 'stale'
          ELSE 'forgotten'
        END
        WHERE statut = 'valide'
      `, {
        type: QueryTypes.UPDATE
      });

      const updatedCount = results;
      console.log(`Mise à jour des niveaux de déclin mémoriel terminée. ${updatedCount} enregistrements traités.`);
      return { total, updated: updatedCount };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des niveaux de déclin mémoriel:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de déclin mémoriel pour un utilisateur.
   * @param {number} utilisateurId - ID de l'utilisateur
   * @returns {Promise<Object>} - { fresh, fragile, stale, forgotten, total, pourcentage_* }
   */
  static async getStatsDecay(utilisateurId) {
    const progressions = await ProgressionEtape.findAll({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'valide'
      },
      attributes: ['decay_level']
    });

    const stats = {
      fresh: 0,
      fragile: 0,
      stale: 0,
      forgotten: 0,
      total: progressions.length
    };

    progressions.forEach(p => {
      const level = p.decay_level || 'forgotten';
      if (stats.hasOwnProperty(level)) {
        stats[level]++;
      }
    });

    // Calculer les pourcentages
    const total = stats.total;
    stats.pourcentage_fresh = total > 0 ? (stats.fresh / total) * 100 : 0;
    stats.pourcentage_fragile = total > 0 ? (stats.fragile / total) * 100 : 0;
    stats.pourcentage_stale = total > 0 ? (stats.stale / total) * 100 : 0;
    stats.pourcentage_forgotten = total > 0 ? (stats.forgotten / total) * 100 : 0;

    return stats;
  }
}

module.exports = MemoryDecayService;