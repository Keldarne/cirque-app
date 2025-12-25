/**
 * TentativeService
 * Service pour gérer les tentatives (réussies/échouées) et calculer le Grit Score
 */

const { TentativeEtape, ProgressionEtape, EtapeProgression, Utilisateur, Figure } = require('../models');
const { Op } = require('sequelize');
const StatsService = require('./StatsService');

class TentativeService {
  /**
   * Enregistre une tentative (réussie ou échouée)
   */
  async enregistrerTentative(userId, etapeId, progressionId, reussie, commentaire = null) {
    const tentative = await TentativeEtape.create({
      utilisateur_id: userId,
      etape_id: etapeId,
      progression_id: progressionId,
      reussie,
      date_tentative: new Date(),
      commentaire,
      partage_prof: false
    });

    if (reussie) {
      await this.creerValidation(userId, etapeId, progressionId);
    }

    const echecsTotal = await TentativeEtape.count({
      where: {
        utilisateur_id: userId,
        etape_id: etapeId,
        reussie: false
      }
    });

    const etape = await EtapeProgression.findByPk(etapeId, {
      include: [Figure]
    });

    const isBloque = echecsTotal >= etape.seuil_echecs_critique && !reussie;

    return {
      tentative,
      echecs_total: echecsTotal,
      seuil_critique: etape.seuil_echecs_critique,
      is_bloque: isBloque
    };
  }

  /**
   * Crée une validation d'étape après une tentative réussie
   */
  async creerValidation(userId, etapeId, progressionId) {
    let validation = await ProgressionEtape.findOne({
      where: {
        utilisateur_id: userId,
        etape_id: etapeId,
        progression_id: progressionId
      }
    });

    if (!validation) {
      validation = await ProgressionEtape.create({
        utilisateur_id: userId,
        etape_id: etapeId,
        progression_id: progressionId,
        valide: true,
        date_validation: new Date(),
        lateralite: 'non_applicable'
      });
    }

    return validation;
  }

  // ... (le reste du service reste inchangé)
  
}

module.exports = new TentativeService();
