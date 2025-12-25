const {
  Figure,
  Discipline,
  ProgressionEtape,
  EtapeProgression
} = require('../models');
const { Op } = require('sequelize');

class StatsService {

  // ... (previous methods)

  // TODO: Re-implement this logic based on new XP model.
  // This KPI is broken because `xp_gagne` was removed from the progression model.
  async calculerScoreSecurite(_utilisateurId) {
    return {
      score: 50,
      xp_renforcement: 0,
      xp_total: 0,
      interpretation: this._interpreterScoreSecurite(50)
    };
  }

  _interpreterScoreSecurite(_score) {
    // ... (logic inchangée)
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
    const disciplines = await Discipline.findAll();
    const radar = [];

    for (const discipline of disciplines) {
      // Compter le nombre total d'étapes définies pour la discipline
      const etapes_totales = await EtapeProgression.count({
        include: [{
          model: Figure,
          where: { discipline_id: discipline.id },
          attributes: []
        }]
      });

      // Compter le nombre d'étapes validées par l'utilisateur dans cette discipline
      const etapes_validees = await ProgressionEtape.count({
        where: {
          utilisateur_id: utilisateurId,
          statut: 'valide'
        },
        include: [{
          model: EtapeProgression,
          as: 'etape',
          required: true,
          attributes: [],
          include: [{
            model: Figure,
            where: { discipline_id: discipline.id },
            attributes: []
          }]
        }]
      });

      const completion = etapes_totales > 0 ? (etapes_validees / etapes_totales) * 100 : 0;
      radar.push({
        discipline: discipline.nom,
        completion: Math.round(completion),
        etapes_validees,
        etapes_totales
      });
    }
    return radar;
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
}

module.exports = new StatsService();
