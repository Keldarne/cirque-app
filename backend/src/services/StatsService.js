const {
  Figure,
  Discipline,
  ProgressionEtape,
  EtapeProgression
} = require('../models');
const { Op } = require('sequelize');

class StatsService {

  // ... (previous methods)

  /**
   * Calcule le score de sécurité basé sur le ratio XP renforcement / XP total
   * @param {number} utilisateurId - ID de l'utilisateur
   * @returns {Object} Score de sécurité avec détails
   */
  async calculerScoreSecurite(utilisateurId) {
    // Récupérer toutes les progressions validées de l'utilisateur avec les détails des étapes
    const progressions = await ProgressionEtape.findAll({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'valide'
      },
      include: [{
        model: EtapeProgression,
        as: 'etape',
        attributes: ['xp'],
        include: [{
          model: Figure,
          as: 'Figure',
          attributes: ['type']  // 'renforcement' vs 'artistique'
        }]
      }]
    });

    // Calculer XP de renforcement
    const xp_renforcement = progressions
      .filter(p => p.etape?.Figure?.type === 'renforcement')
      .reduce((sum, p) => sum + (p.etape?.xp || 0), 0);

    // Calculer XP total
    const xp_total = progressions
      .reduce((sum, p) => sum + (p.etape?.xp || 0), 0);

    // Calculer le score (pourcentage de renforcement)
    const score = xp_total > 0 ? (xp_renforcement / xp_total) * 100 : 0;

    return {
      score: Math.round(score),
      xp_renforcement,
      xp_total,
      interpretation: this._interpreterScoreSecurite(Math.round(score))
    };
  }

  /**
   * Interprète le score de sécurité
   * @param {number} score - Score de sécurité (0-100)
   * @returns {string} Interprétation textuelle
   */
  _interpreterScoreSecurite(score) {
    if (score >= 70) {
      return 'Excellent équilibre - Sécurité optimale';
    } else if (score >= 50) {
      return 'Bon équilibre - Progression sécurisée';
    } else if (score >= 30) {
      return 'Attention - Renforcement insuffisant';
    } else if (score > 0) {
      return 'Risque élevé - Prioriser le renforcement';
    } else {
      return 'Aucun renforcement - Risque critique';
    }
  }

  async detecterDecrochage(utilisateurId) {
    const maintenant = new Date();
    const il_y_a_7j = new Date(maintenant - 7 * 24 * 60 * 60 * 1000);
    const il_y_a_30j = new Date(maintenant - 30 * 24 * 60 * 60 * 1000);

    const activite_7j = await ProgressionEtape.count({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'valide',
        date_validation: { [Op.gte]: il_y_a_7j }
      }
    });

    const activite_30j = await ProgressionEtape.count({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'valide',
        date_validation: { [Op.gte]: il_y_a_30j }
      }
    });

    const activite_moyenne_hebdo = activite_30j / 4;
    const ratio = activite_moyenne_hebdo > 0 ? activite_7j / activite_moyenne_hebdo : (activite_7j > 0 ? 1 : 0);
    const at_risk = ratio < 0.5 && activite_30j > 0;

    return {
      ratio: Math.round(ratio * 100) / 100,
      at_risk,
      activite_7j,
      activite_30j,
      activite_moyenne_hebdo: Math.round(activite_moyenne_hebdo * 10) / 10,
      interpretation: this._interpreterDecrochage(ratio, at_risk)
    };
  }

  _interpreterDecrochage(_ratio, _at_risk) {
    // ... (logic inchangée)
  }

  async calculerRadarPolyvalence(utilisateurId) {
    // Optimisation: une seule requête SQL avec JOIN et GROUP BY au lieu de N*2 requêtes
    const { QueryTypes } = require('sequelize');
    const sequelize = require('../../db');

    const results = await sequelize.query(`
      SELECT
        d.id,
        d.nom,
        COUNT(DISTINCT ep.id) as total_etapes,
        COUNT(DISTINCT CASE WHEN pe.statut = 'valide' THEN pe.id END) as etapes_validees
      FROM Disciplines d
      LEFT JOIN Figures f ON f.discipline_id = d.id
      LEFT JOIN EtapeProgressions ep ON ep.figure_id = f.id
      LEFT JOIN ProgressionEtapes pe ON pe.etape_id = ep.id AND pe.utilisateur_id = :userId
      GROUP BY d.id, d.nom
      ORDER BY d.nom
    `, {
      replacements: { userId: utilisateurId },
      type: QueryTypes.SELECT
    });

    return results.map(r => {
      const completion = r.total_etapes > 0 ? (r.etapes_validees / r.total_etapes * 100) : 0;
      return {
        discipline: r.nom,
        completion: Math.round(completion),
        etapes_validees: parseInt(r.etapes_validees),
        etapes_totales: parseInt(r.total_etapes)
      };
    });
  }
  
  // ... (calculerXpDynamique inchangé)

  async calculerStatistiquesProfesseur(_professeurId) {
    // ... (logic inchangée)
  }
  
  async _calculerMeteoClasse(_eleveIds) {
    // ... (logic inchangée)
  }

  async _trouverFiguresBloquantes(eleveIds) {
    if (!eleveIds || eleveIds.length === 0) {
      return [];
    }

    // A "blocking figure" is now defined as a figure where multiple students have
    // at least one step with a status of 'en_cours'.
    const inProgressEtapes = await ProgressionEtape.findAll({
      where: {
        utilisateur_id: { [Op.in]: eleveIds },
        statut: 'en_cours'
      },
      include: {
        model: EtapeProgression,
        as: 'etape',
        attributes: ['figure_id']
      }
    });

    if (inProgressEtapes.length === 0) {
      return [];
    }

    // Count how many unique students have a status of 'en_cours' for each figure.
    const figureBlockCounts = inProgressEtapes.reduce((acc, progEtape) => {
      const figureId = progEtape.etape.figure_id;
      if (!acc[figureId]) {
        acc[figureId] = new Set();
      }
      acc[figureId].add(progEtape.utilisateur_id);
      return acc;
    }, {});
    
    const figuresData = await Figure.findAll({
      where: {
        id: { [Op.in]: Object.keys(figureBlockCounts) }
      },
      attributes: ['id', 'nom', 'difficulty_level']
    });
    
    const figuresMap = new Map(figuresData.map(f => [f.id, f]));

    const result = Object.entries(figureBlockCounts)
      .map(([figureId, userSet]) => {
        const figure = figuresMap.get(parseInt(figureId));
        return {
          figure_id: parseInt(figureId),
          figure_nom: figure ? figure.nom : 'Inconnue',
          difficulty: figure ? figure.difficulty_level : 0,
          eleves_bloques: userSet.size
        };
      })
      .filter(f => f.eleves_bloques >= 3) // Only show if at least 3 students are "stuck"
      .sort((a, b) => b.eleves_bloques - a.eleves_bloques)
      .slice(0, 5); // Return top 5

    return result;
  }

  async _trouverElevesARisque(_eleveIds) {
    // ... (logic inchangée)
  }

  /**
   * Analyse la latéralité d'un utilisateur
   * @param {number} utilisateurId - ID de l'utilisateur
   * @returns {Object} Statistiques de latéralité avec interprétation
   */
  async analyserLateralite(utilisateurId) {
    const progressions = await ProgressionEtape.findAll({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'valide',
        lateralite: { [Op.ne]: 'non_applicable' }
      },
      attributes: ['lateralite', 'etape_id'],
      include: [{
        model: EtapeProgression,
        as: 'etape',
        attributes: ['titre']
      }]
    });

    const stats = {
      gauche: progressions.filter(p => p.lateralite === 'gauche').length,
      droite: progressions.filter(p => p.lateralite === 'droite').length,
      bilateral: progressions.filter(p => p.lateralite === 'bilateral').length
    };

    const total = stats.gauche + stats.droite + stats.bilateral;
    const desequilibre = total > 0
      ? Math.abs(stats.gauche - stats.droite) / total
      : 0;

    return {
      stats,
      total,
      desequilibre: Math.round(desequilibre * 100),  // % de déséquilibre
      interpretation: this._interpreterDesequilibre(desequilibre)
    };
  }

  /**
   * Interprète le déséquilibre de latéralité
   * @param {number} desequilibre - Ratio de déséquilibre (0-1)
   * @returns {string} Interprétation textuelle
   */
  _interpreterDesequilibre(desequilibre) {
    if (desequilibre > 0.3) {
      return 'Déséquilibre important - Travailler côté faible';
    } else if (desequilibre > 0.15) {
      return 'Léger déséquilibre - Maintenir équilibre';
    } else {
      return 'Équilibré - Continue ainsi!';
    }
  }
}

module.exports = new StatsService();
