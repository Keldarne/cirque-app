const {
  TentativeEtape,
  ProgressionEtape,
  EtapeProgression
} = require('../models');
const sequelize = require('../../db');
const { Op } = require('sequelize');

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

      // 2. Valider que l'étape existe dans EtapeProgressions
      await this._validateEtapeExists(etapeId, transaction);

      // 3. Auto-créer la progression si elle n'existe pas (pattern from ProgrammeService)
      const [progressionEtape, created] = await ProgressionEtape.findOrCreate({
        where: {
          utilisateur_id: utilisateurId,
          etape_id: etapeId
        },
        defaults: {
          statut: 'non_commence'
        },
        transaction
      });

      // Log auto-creation for monitoring
      if (created) {
        console.log(`[EntrainementService] Auto-créé progression pour user=${utilisateurId}, etape=${etapeId}`);
      }

      // 4. Calculer le booléen reussie basé sur le mode
      const reussie = this._calculateReussie(validatedData);

      // 5. Vérifier idempotence (protection double-clic)
      const existingTentative = await this._checkIdempotency(
        progressionEtape.id,
        validatedData,
        reussie,
        transaction
      );

      if (existingTentative) {
        // Tentative identique trouvée récemment, retourner l'existante
        await transaction.commit();
        console.log(`[EntrainementService] Idempotence: tentative existante retournée (ID: ${existingTentative.id})`);

        return {
          progressionEtape,
          tentative: existingTentative,
          idempotent: true
        };
      }

      // 6. Créer la nouvelle tentative avec les données enrichies
      const tentative = await TentativeEtape.create({
        progression_etape_id: progressionEtape.id,
        type_saisie: validatedData.typeSaisie,
        reussie: reussie,
        score: validatedData.score || null,
        duree_secondes: validatedData.dureeSecondes || null
      }, { transaction });

      // 7. Mettre à jour le statut de progression selon la réussite
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
        tentative,
        idempotent: false
      };

    } catch (error) {
      await transaction.rollback();
      console.error('[EntrainementService.enregistrerTentative] Erreur:', error);
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

  /**
   * Valide que l'étape existe dans EtapeProgressions.
   * @private
   * @throws {Error} Si l'étape n'existe pas
   */
  static async _validateEtapeExists(etapeId, transaction) {
    const etape = await EtapeProgression.findByPk(etapeId, {
      attributes: ['id'],
      transaction
    });

    if (!etape) {
      const error = new Error(`Étape non trouvée (ID: ${etapeId})`);
      error.name = 'EtapeNotFoundError';
      throw error;
    }

    return etape;
  }

  /**
   * Vérifie si une tentative identique existe déjà dans les dernières secondes.
   * Protection contre les double-clics.
   * @private
   * @returns {Object|null} La tentative existante ou null
   */
  static async _checkIdempotency(progressionEtapeId, tentativeData, reussie, transaction) {
    const IDEMPOTENCY_WINDOW_SECONDS = 3;
    const cutoffTime = new Date(Date.now() - IDEMPOTENCY_WINDOW_SECONDS * 1000);

    const existing = await TentativeEtape.findOne({
      where: {
        progression_etape_id: progressionEtapeId,
        type_saisie: tentativeData.typeSaisie,
        reussie: reussie,
        createdAt: { [Op.gte]: cutoffTime }
      },
      order: [['createdAt', 'DESC']],
      transaction
    });

    return existing;
  }
}

module.exports = EntrainementService;
