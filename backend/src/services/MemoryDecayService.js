const { ProgressionEtape } = require('../models');
const { isAfter, differenceInDays, addDays } = require('date-fns');
const sequelize = require('../../db');
const { Op } = require('sequelize');

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
   * @returns {Promise<number>} - Le nombre d'enregistrements mis à jour.
   */
  static async updateAllDecayLevels() {
    console.log('Début de la mise à jour des niveaux de déclin mémoriel...');
    let updatedCount = 0;

    const progressions = await ProgressionEtape.findAll({
      where: {
        date_validation: { [Op.ne]: null } // Seulement les étapes qui ont été validées
      }
    });

    const transaction = await sequelize.transaction();

    try {
      for (const prog of progressions) {
        const currentDecayLevel = prog.decay_level;
        const newDecayLevel = MemoryDecayService.calculateDecayLevel(prog.date_validation);

        if (currentDecayLevel !== newDecayLevel) {
          prog.decay_level = newDecayLevel;
          await prog.save({ transaction });
          updatedCount++;
        }
      }

      await transaction.commit();
      console.log(`Mise à jour des niveaux de déclin mémoriel terminée. ${updatedCount} enregistrements modifiés.`);
      return updatedCount;
    } catch (error) {
      await transaction.rollback();
      console.error('Erreur lors de la mise à jour des niveaux de déclin mémoriel:', error);
      throw error;
    }
  }
}

module.exports = MemoryDecayService;