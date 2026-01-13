const { ProgressionEtape, EtapeProgression, Figure, Discipline, TentativeEtape, Utilisateur, Groupe, GroupeEleve } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const ProfService = require('./ProfService');

/**
 * Service pour le tableau de bord professeur
 * Centralise la logique métier pour les endpoints d'optimisation
 */
class DashboardService {
  /**
   * Récupère la matrice de progression pour tous les élèves d'un professeur
   * @param {number} professeurId - ID du professeur
   * @param {number|null} groupeId - ID du groupe (optionnel)
   * @returns {Promise<Object>} - Matrice { studentId: { figureId: status } }
   */
  static async getProgressionMatrix(professeurId, groupeId = null) {
    // 1. Récupérer les élèves (filtrés par groupe si spécifié)
    let eleves;
    if (groupeId) {
      // Élèves d'un groupe spécifique
      const groupe = await Groupe.findOne({
        where: { id: groupeId, professeur_id: professeurId },
        include: [{
          model: GroupeEleve,
          as: 'membres',
          include: [{
            model: Utilisateur,
            as: 'eleve',
            attributes: ['id']
          }]
        }]
      });

      if (!groupe) {
        throw new Error('Groupe non trouvé');
      }

      eleves = groupe.membres.map(ge => ge.eleve);
    } else {
      // Tous les élèves du prof
      const elevesData = await ProfService.getElevesByProfId(professeurId);
      eleves = elevesData.map(e => ({ id: e.id }));
    }

    if (eleves.length === 0) {
      return {};
    }

    const eleveIds = eleves.map(e => e.id);

    // 2. Récupérer TOUTES les progressions de TOUS les élèves en 1 requête
    const progressions = await ProgressionEtape.findAll({
      where: { utilisateur_id: { [Op.in]: eleveIds } },
      include: [{
        model: EtapeProgression,
        as: 'etape',
        attributes: ['id', 'figure_id', 'ordre'],
        include: [{
          model: Figure,
          attributes: ['id']
        }]
      }],
      attributes: ['utilisateur_id', 'etape_id', 'statut']
    });

    // 3. Pour chaque figure, récupérer le nombre total d'étapes
    const figureIds = [...new Set(progressions.map(p => p.etape.figure_id))];
    const etapesParFigure = await EtapeProgression.findAll({
      where: { figure_id: { [Op.in]: figureIds } },
      attributes: ['figure_id', 'id']
    });

    // Créer un map: figure_id => nombre d'étapes
    const totalEtapesParFigure = etapesParFigure.reduce((acc, etape) => {
      if (!acc[etape.figure_id]) acc[etape.figure_id] = 0;
      acc[etape.figure_id]++;
      return acc;
    }, {});

    // 4. Construire la matrice
    const matrix = {};

    // Initialiser la structure pour chaque élève
    eleveIds.forEach(eleveId => {
      matrix[eleveId] = {};
    });

    // Grouper les progressions par élève et par figure
    const progressionsParEleve = {};
    progressions.forEach(prog => {
      const eleveId = prog.utilisateur_id;
      const figureId = prog.etape.figure_id;

      if (!progressionsParEleve[eleveId]) {
        progressionsParEleve[eleveId] = {};
      }
      if (!progressionsParEleve[eleveId][figureId]) {
        progressionsParEleve[eleveId][figureId] = [];
      }

      progressionsParEleve[eleveId][figureId].push(prog);
    });

    // Calculer le statut global pour chaque (élève, figure)
    Object.keys(progressionsParEleve).forEach(eleveId => {
      Object.keys(progressionsParEleve[eleveId]).forEach(figureId => {
        const etapes = progressionsParEleve[eleveId][figureId];
        const totalSteps = totalEtapesParFigure[figureId] || 0;
        const validSteps = etapes.filter(e => e.statut === 'valide').length;
        const inProgressSteps = etapes.filter(e => e.statut === 'en_cours').length;

        let status = 'non_commence';
        if (validSteps === totalSteps && totalSteps > 0) {
          status = 'valide';
        } else if (validSteps > 0 || inProgressSteps > 0) {
          status = 'en_cours';
        }

        matrix[eleveId][figureId] = status;
      });
    });

    return matrix;
  }

  /**
   * Récupère les statistiques globales pour les graphiques du dashboard
   * @param {number} professeurId - ID du professeur
   * @returns {Promise<Object>} - { moyennes_par_discipline, activite_hebdomadaire }
   */
  static async getStatsGlobales(professeurId) {
    // 1. Récupérer les ID des élèves concernés
    let eleveIds = [];

    if (professeurId) {
        // Cas Professeur: Ses élèves uniquement
        const elevesData = await ProfService.getElevesByProfId(professeurId);
        eleveIds = elevesData.map(e => e.id);
    } else {
        // Cas Admin: TOUS les élèves du système
        const allEleves = await Utilisateur.findAll({
            where: { role: 'eleve' },
            attributes: ['id']
        });
        eleveIds = allEleves.map(e => e.id);
    }

    if (eleveIds.length === 0) {
      return {
        moyennes_par_discipline: [],
        activite_hebdomadaire: []
      };
    }

    // 2. Calculer les moyennes par discipline
    // Stratégie: Pour chaque discipline, calculer le % de figures validées
    const progressionsParDiscipline = await sequelize.query(`
      SELECT
        d.id as discipline_id,
        d.nom as discipline,
        COUNT(DISTINCT ep.figure_id) as total_figures,
        COUNT(DISTINCT CASE
          WHEN pe.statut = 'valide'
          THEN CONCAT(pe.utilisateur_id, '-', ep.figure_id)
        END) as figures_validees
      FROM Disciplines d
      INNER JOIN Figures f ON f.discipline_id = d.id
      INNER JOIN EtapeProgressions ep ON ep.figure_id = f.id
      LEFT JOIN ProgressionEtapes pe ON pe.etape_id = ep.id
        AND pe.utilisateur_id IN (:eleveIds)
      GROUP BY d.id, d.nom
      ORDER BY d.nom
    `, {
      replacements: { eleveIds },
      type: sequelize.QueryTypes.SELECT
    });

    const moyennes_par_discipline = progressionsParDiscipline.map(row => {
      const scoreBase = row.total_figures > 0
        ? (row.figures_validees / (row.total_figures * eleveIds.length)) * 100
        : 0;

      // Normaliser le score sur 100 (considérant qu'une classe complète à 100% = 100)
      const score_moyen = Math.round(scoreBase);

      return {
        discipline: row.discipline,
        score_moyen: score_moyen
      };
    });

    // 3. Calculer l'activité hebdomadaire (7 derniers jours)
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - 6); // 7 jours en incluant aujourd'hui
    dateDebut.setHours(0, 0, 0, 0);

    const tentativesParJour = await sequelize.query(`
      SELECT
        DAYOFWEEK(te.createdAt) as jour_numero,
        CASE DAYOFWEEK(te.createdAt)
          WHEN 1 THEN 'Dimanche'
          WHEN 2 THEN 'Lundi'
          WHEN 3 THEN 'Mardi'
          WHEN 4 THEN 'Mercredi'
          WHEN 5 THEN 'Jeudi'
          WHEN 6 THEN 'Vendredi'
          WHEN 7 THEN 'Samedi'
        END as jour,
        COUNT(*) as tentatives
      FROM TentativeEtapes te
      INNER JOIN ProgressionEtapes pe ON pe.id = te.progression_etape_id
      WHERE pe.utilisateur_id IN (:eleveIds)
        AND te.createdAt >= :dateDebut
      GROUP BY jour_numero, jour
      ORDER BY jour_numero
    `, {
      replacements: { eleveIds, dateDebut },
      type: sequelize.QueryTypes.SELECT
    });

    const activite_hebdomadaire = tentativesParJour.map(row => ({
      jour: row.jour,
      tentatives: parseInt(row.tentatives)
    }));

    return {
      moyennes_par_discipline,
      activite_hebdomadaire
    };
  }
}

module.exports = DashboardService;
