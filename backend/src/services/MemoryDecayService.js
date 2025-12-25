const { ProgressionEtape } = require('../models');
const { isAfter, differenceInDays, addDays } = require('date-fns');
const sequelize = require('../../db');
const { Op, QueryTypes } = require('sequelize');

class MemoryDecayService {

  /**
   * Calcule le niveau de déclin mémoriel basé sur la date de validation.
   * @param {Date} dateValidation - La date à laquelle l'étape a été validée pour la dernière fois.
   * @returns {string} - 'fresh', 'warning', 'critical', 'forgotten'
   */
  static calculateDecayLevel(dateValidation) {
    if (!dateValidation) {
      return 'fresh'; // Si pas encore validé, ou pas de date, considéré comme "frais" par défaut.
    }

    const now = new Date();
    const daysSinceValidation = differenceInDays(now, dateValidation);

    if (daysSinceValidation <= 30) {
      return 'fresh';
    } else if (daysSinceValidation <= 90) {
      return 'warning';
    } else if (daysSinceValidation <= 180) {
      return 'critical';
    } else {
      return 'forgotten';
    }
  }

  /**
   * Met à jour le niveau de déclin mémoriel pour toutes les ProgressionEtape validées.
   * Cette méthode est conçue pour être exécutée périodiquement (ex: via un cron job).
   * Optimisée avec une seule requête SQL bulk UPDATE pour de meilleures performances.
   * @returns {Promise<number>} - Le nombre d'enregistrements mis à jour.
   */
  static async updateAllDecayLevels() {
    console.log('Début de la mise à jour des niveaux de déclin mémoriel...');

    try {
      // Utiliser une seule requête UPDATE avec CASE pour mettre à jour tous les enregistrements
      // Optimisation majeure: passe de O(n) requêtes à 1 seule requête
      const [results] = await sequelize.query(`
        UPDATE ProgressionEtapes
        SET decay_level = CASE
          WHEN date_validation IS NULL THEN decay_level
          WHEN DATEDIFF(NOW(), date_validation) <= 30 THEN 'fresh'
          WHEN DATEDIFF(NOW(), date_validation) <= 90 THEN 'warning'
          WHEN DATEDIFF(NOW(), date_validation) <= 180 THEN 'critical'
          ELSE 'forgotten'
        END
        WHERE statut = 'valide'
      `, {
        type: QueryTypes.UPDATE
      });

      const updatedCount = results;
      console.log(`Mise à jour des niveaux de déclin mémoriel terminée. ${updatedCount} enregistrements traités.`);
      return updatedCount;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des niveaux de déclin mémoriel:', error);
      throw error;
    }
  }
}

module.exports = MemoryDecayService;