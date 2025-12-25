const {
  TentativeEtape,
  ProgressionEtape,
  EtapeProgression
} = require('../models');
const sequelize = require('../db');

class EntrainementService {

  /**
   * Enregistre une tentative sur une étape avec support des modes d'entraînement.
   * @param {number} utilisateurId - L'ID de l'utilisateur.
   * @param {number} etapeId - L'ID de l'étape sur laquelle la tentative est faite.
   * @param {Object} tentativeData - Données de la tentative
   * @param {string} tentativeData.typeSaisie - Mode: 'binaire', 'evaluation', 'duree', 'evaluation_duree'
   * @param {boolean} [tentativeData.reussite] - Pour mode binaire
   * @param {number} [tentativeData.score] - Pour modes evaluation et evaluation_duree (1-3)
   * @param {number} [tentativeData.dureeSecondes] - Pour modes duree et evaluation_duree
   * @returns {Promise<Object>} - La progression de l'étape mise à jour + la tentative créée.
   */
  static async enregistrerTentative(utilisateurId, etapeId, tentativeData) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validation des données d'entrée
      const validatedData = this._validateTentativeData(tentativeData);

      // 2. Trouver la progression de l'utilisateur sur cette étape spécifique
      const progressionEtape = await ProgressionEtape.findOne({
        where: {
          utilisateur_id: utilisateurId,
          etape_id: etapeId,
        },
        transaction
      });

      if (!progressionEtape) {
        throw new Error("L'utilisateur n'a pas commencé la progression sur cette figure/étape.");
      }

      // 3. Calculer le booléen reussie basé sur le mode
      const reussie = this._calculateReussie(validatedData);

      // 4. Créer la nouvelle tentative avec les données enrichies
      const tentative = await TentativeEtape.create({
        progression_etape_id: progressionEtape.id,
        type_saisie: validatedData.typeSaisie,
        reussie: reussie,
        score: validatedData.score || null,
        duree_secondes: validatedData.dureeSecondes || null
      }, { transaction });

      // 5. Mettre à jour le statut de progression selon la réussite
      if (reussie && progressionEtape.statut !== 'valide') {
        progressionEtape.statut = 'valide';
        progressionEtape.date_validation = new Date();
      } else if (progressionEtape.statut === 'non_commence') {
        progressionEtape.statut = 'en_cours';
      }

      await progressionEtape.save({ transaction });
      await transaction.commit();

      return {
        progressionEtape,
        tentative
      };

    } catch (error) {
      await transaction.rollback();
      console.error("Erreur dans EntrainementService.enregistrerTentative:", error);
      throw error;
    }
  }

  /**
   * Valide les données de tentative selon le mode d'entraînement.
   * @private
   */
  static _validateTentativeData(data) {
    const typeSaisie = data.typeSaisie || 'binaire';

    switch (typeSaisie) {
      case 'binaire':
        if (data.reussite == null) {
          throw new Error('reussite est requis pour le mode binaire');
        }
        if (typeof data.reussite !== 'boolean') {
          throw new Error('reussite doit être un booléen');
        }
        if (data.score != null || data.dureeSecondes != null) {
          throw new Error('Mode binaire ne peut avoir ni score ni dureeSecondes');
        }
        return {
          typeSaisie: 'binaire',
          reussite: data.reussite
        };

      case 'evaluation':
        if (data.score == null) {
          throw new Error('score est requis pour le mode evaluation');
        }
        if (!Number.isInteger(data.score) || data.score < 1 || data.score > 3) {
          throw new Error('score doit être un entier entre 1 et 3');
        }
        if (data.dureeSecondes != null) {
          throw new Error('Mode evaluation ne peut avoir de dureeSecondes');
        }
        return {
          typeSaisie: 'evaluation',
          score: data.score
        };

      case 'duree':
        if (data.dureeSecondes == null) {
          throw new Error('dureeSecondes est requis pour le mode duree');
        }
        if (!Number.isInteger(data.dureeSecondes) || data.dureeSecondes <= 0) {
          throw new Error('dureeSecondes doit être un entier positif');
        }
        if (data.score != null) {
          throw new Error('Mode duree ne peut avoir de score');
        }
        return {
          typeSaisie: 'duree',
          dureeSecondes: data.dureeSecondes
        };

      case 'evaluation_duree':
        if (data.score == null || data.dureeSecondes == null) {
          throw new Error('score ET dureeSecondes sont requis pour le mode evaluation_duree');
        }
        if (!Number.isInteger(data.score) || data.score < 1 || data.score > 3) {
          throw new Error('score doit être un entier entre 1 et 3');
        }
        if (!Number.isInteger(data.dureeSecondes) || data.dureeSecondes <= 0) {
          throw new Error('dureeSecondes doit être un entier positif');
        }
        return {
          typeSaisie: 'evaluation_duree',
          score: data.score,
          dureeSecondes: data.dureeSecondes
        };

      default:
        throw new Error(`typeSaisie invalide: ${typeSaisie}. Doit être binaire, evaluation, duree ou evaluation_duree`);
    }
  }

  /**
   * Calcule le booléen reussie basé sur les données de tentative.
   * Mapping:
   * - binaire: utilise reussite directement
   * - evaluation: score 2-3 = true, score 1 = false
   * - duree: true (toute session chrono compte comme pratique)
   * - evaluation_duree: score 2-3 = true, score 1 = false
   * @private
   */
  static _calculateReussie(validatedData) {
    switch (validatedData.typeSaisie) {
      case 'binaire':
        return validatedData.reussite;
      case 'evaluation':
      case 'evaluation_duree':
        return validatedData.score >= 2; // 2=Instable, 3=Maîtrisé → succès
      case 'duree':
        return true; // Toute session chrono est considérée comme pratique
      default:
        return false;
    }
  }
}

module.exports = EntrainementService;
