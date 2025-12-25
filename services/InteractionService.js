/**
 * InteractionService
 * Service pour gérer et analyser les interactions Professeur-Élève
 *
 * Fonctionnalités:
 * - Identifier les élèves négligés (sans interaction depuis X jours)
 * - Calculer les statistiques d'engagement prof
 * - Historique des interactions
 */

const { InteractionProfEleve, Utilisateur, RelationProfEleve } = require('../models');
const { Op } = require('sequelize');
const { differenceInDays, subDays } = require('date-fns');

class InteractionService {
  /**
   * Récupère les élèves négligés d'un professeur
   * @param {number} professeurId - ID du professeur
   * @param {number} seuilJours - Nombre de jours sans interaction pour être considéré négligé (défaut: 30)
   * @returns {Promise<Object>} Stats avec liste des élèves négligés
   */
  async getElevesNegliges(professeurId, seuilJours = 30) {
    // Récupérer tous les élèves du professeur
    const relations = await RelationProfEleve.findAll({
      where: {
        professeur_id: professeurId,
        statut: 'accepte',
        actif: true
      },
      attributes: ['eleve_id']
    });

    const eleveIds = relations.map(r => r.eleve_id);

    if (eleveIds.length === 0) {
      return {
        total_eleves: 0,
        negliges_count: 0,
        taux_neglige: 0,
        eleves: []
      };
    }

    // Pour chaque élève, trouver la dernière interaction
    const analysePromises = eleveIds.map(async (eleveId) => {
      const derniereInteraction = await InteractionProfEleve.findOne({
        where: {
          professeur_id: professeurId,
          eleve_id: eleveId
        },
        order: [['date_interaction', 'DESC']]
      });

      const eleve = await Utilisateur.findByPk(eleveId, {
        attributes: ['id', 'nom', 'prenom', 'pseudo', 'niveau', 'xp_total']
      });

      if (!derniereInteraction) {
        // Aucune interaction jamais enregistrée
        return {
          ...eleve.toJSON(),
          jours_sans_interaction: 999999, // Valeur très élevée au lieu de Infinity pour éviter problèmes de sérialisation JSON
          derniere_interaction: null,
          type_derniere_interaction: null,
          niveau_alerte: 'critique'
        };
      }

      const joursSans = differenceInDays(
        new Date(),
        new Date(derniereInteraction.date_interaction)
      );

      return {
        ...eleve.toJSON(),
        jours_sans_interaction: joursSans,
        derniere_interaction: derniereInteraction.date_interaction,
        type_derniere_interaction: derniereInteraction.type_interaction,
        niveau_alerte: joursSans > 60 ? 'critique' : joursSans > 30 ? 'warning' : 'ok'
      };
    });

    const analyses = await Promise.all(analysePromises);

    // Filtrer les élèves négligés et trier par jours sans interaction
    const negliges = analyses
      .filter(a => a.jours_sans_interaction > seuilJours)
      .sort((a, b) => b.jours_sans_interaction - a.jours_sans_interaction);

    return {
      total_eleves: eleveIds.length,
      negliges_count: negliges.length,
      taux_neglige: Math.round((negliges.length / eleveIds.length) * 100),
      eleves: negliges
    };
  }

  /**
   * Récupère l'historique des interactions entre un prof et un élève
   * @param {number} professeurId - ID du professeur
   * @param {number} eleveId - ID de l'élève
   * @param {number} limit - Nombre max de résultats (défaut: 20)
   * @returns {Promise<Array>} Liste des interactions
   */
  async getInteractionHistory(professeurId, eleveId, limit = 20) {
    return await InteractionProfEleve.findAll({
      where: {
        professeur_id: professeurId,
        eleve_id: eleveId
      },
      order: [['date_interaction', 'DESC']],
      limit
    });
  }

  /**
   * Enregistre une interaction prof-élève
   * @param {number} professeurId - ID du professeur
   * @param {number} eleveId - ID de l'élève
   * @param {string} typeInteraction - Type d'interaction (view_profile, add_comment, etc.)
   * @param {Object} contexte - Métadonnées optionnelles (route, progression_id, etc.)
   * @returns {Promise<Object>} L'interaction créée
   */
  async enregistrerInteraction(professeurId, eleveId, typeInteraction, contexte = null) {
    return await InteractionProfEleve.create({
      professeur_id: professeurId,
      eleve_id: eleveId,
      type_interaction: typeInteraction,
      date_interaction: new Date(),
      contexte
    });
  }

  /**
   * Calcule les statistiques d'engagement du professeur
   * @param {number} professeurId - ID du professeur
   * @returns {Promise<Object>} Statistiques d'engagement
   */
  async getEngagementStats(professeurId) {
    const relations = await RelationProfEleve.findAll({
      where: { professeur_id: professeurId, statut: 'accepte' },
      attributes: ['eleve_id']
    });

    const eleveIds = relations.map(r => r.eleve_id);

    if (eleveIds.length === 0) {
      return {
        total_eleves: 0,
        interactions_7j: 0,
        interactions_30j: 0,
        moyenne_interactions_par_eleve: 0
      };
    }

    const maintenant = new Date();
    const il_y_a_7j = subDays(maintenant, 7);
    const il_y_a_30j = subDays(maintenant, 30);

    const [interactions7j, interactions30j] = await Promise.all([
      InteractionProfEleve.count({
        where: {
          professeur_id: professeurId,
          date_interaction: { [Op.gte]: il_y_a_7j }
        }
      }),
      InteractionProfEleve.count({
        where: {
          professeur_id: professeurId,
          date_interaction: { [Op.gte]: il_y_a_30j }
        }
      })
    ]);

    return {
      total_eleves: eleveIds.length,
      interactions_7j: interactions7j,
      interactions_30j: interactions30j,
      moyenne_interactions_par_eleve: Math.round(interactions30j / eleveIds.length)
    };
  }
}

module.exports = new InteractionService();
