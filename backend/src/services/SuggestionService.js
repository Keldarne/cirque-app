const {
  Figure,
  ExerciceFigure,
  ProgressionEtape,
  EtapeProgression,
  SuggestionFigure,
  Utilisateur,
  ProgrammeFigure,
  AssignationProgramme,
  Groupe,
  GroupeEleve
} = require('../models');
const sequelize = require('../../db');
const { Op } = require('sequelize');

/**
 * Service de gestion des suggestions de figures basées sur les exercices prérequis validés.
 *
 * Architecture:
 * - Calcul dynamique du score de préparation (% d'exercices validés pondéré)
 * - Cache dans SuggestionsFigure pour performance
 * - Support suggestions individuelles (élève) et collectives (groupe)
 *
 * Formule du score: (Σ exercices validés × poids) / (Σ total exercices requis × poids) × 100
 */
class SuggestionService {

  /**
   * Calcule les suggestions personnalisées pour un élève.
   * @param {number} utilisateurId
   * @param {number} seuilMinimum - Score minimum pour afficher (défaut: 60%)
   * @param {number} limite - Nombre max de suggestions (défaut: 5)
   * @returns {Promise<Array>} Suggestions triées par score décroissant
   */
  static async calculerSuggestionsEleve(utilisateurId, seuilMinimum = 60, limite = 5) {
    try {
      // 1. Récupérer toutes les figures qui ont des exercices définis
      const figuresAvecExercices = await Figure.findAll({
        include: [{
          model: ExerciceFigure,
          as: 'relationsExercices', // FIX: utiliser le nouvel alias (pas 'exercices' qui est réservé pour belongsToMany)
          where: { est_requis: true }, // Seulement les exercices obligatoires
          required: true // Inner join: seulement figures avec exercices
        }],
        attributes: ['id', 'nom', 'descriptif', 'difficulty_level', 'type']
      });

      if (figuresAvecExercices.length === 0) {
        return [];
      }

      // 2. Récupérer les figures déjà dans les programmes de l'utilisateur (à exclure)
      const figuresAssignees = await this._getFiguresAssignees(utilisateurId);

      // 3. Récupérer les figures déjà 100% validées (à exclure)
      const figuresValidees = await this._getFiguresValidees(utilisateurId);

      // 4. Pour chaque figure, calculer le score de préparation
      const suggestions = [];

      for (const figure of figuresAvecExercices) {
        // Exclure si déjà assignée ou validée
        if (figuresAssignees.includes(figure.id) || figuresValidees.includes(figure.id)) {
          continue;
        }

        const scoreData = await this.calculerScorePreparation(utilisateurId, figure.id);

        // Filtrer par seuil minimum
        if (scoreData.score >= seuilMinimum) {
          suggestions.push({
            figure_id: figure.id,
            nom: figure.nom,
            descriptif: figure.descriptif,
            difficulty_level: figure.difficulty_level,
            type: figure.type,
            score_preparation: scoreData.score,
            nb_exercices_valides: scoreData.exercices_valides,
            nb_exercices_total: scoreData.exercices_total,
            details_exercices: scoreData.details
          });
        }
      }

      // 5. Trier par score décroissant et limiter
      suggestions.sort((a, b) => b.score_preparation - a.score_preparation);
      return suggestions.slice(0, limite);

    } catch (error) {
      console.error('[SuggestionService.calculerSuggestionsEleve] Erreur:', error);
      throw error;
    }
  }

  /**
   * Calcule les suggestions pour un groupe (agrégation des élèves).
   * @param {number} groupeId
   * @param {number} seuilMinimum - % minimum d'élèves prêts (défaut: 50%)
   * @param {number} limite - Nombre max de suggestions (défaut: 5)
   * @returns {Promise<Array>} Suggestions triées par % du groupe prêt
   */
  static async calculerSuggestionsGroupe(groupeId, seuilMinimum = 50, limite = 5) {
    try {
      // 1. Récupérer tous les élèves du groupe
      const eleves = await GroupeEleve.findAll({
        where: { groupe_id: groupeId },
        include: [{
          model: Utilisateur,
          as: 'eleve',
          attributes: ['id', 'pseudo']
        }]
      });

      if (eleves.length === 0) {
        return [];
      }

      const eleveIds = eleves.map(ge => ge.eleve.id);

      // 2. Pour chaque élève, calculer ses suggestions
      const suggestionsParEleve = await Promise.all(
        eleveIds.map(eleveId => this.calculerSuggestionsEleve(eleveId, 80, 100)) // Score ≥ 80% = "prêt"
      );

      // 3. Agréger: compter combien d'élèves sont prêts pour chaque figure
      const figuresCompteur = {};

      suggestionsParEleve.forEach((suggestions, index) => {
        suggestions.forEach(suggestion => {
          if (!figuresCompteur[suggestion.figure_id]) {
            figuresCompteur[suggestion.figure_id] = {
              ...suggestion,
              nb_eleves_prets: 0,
              eleves_prets: []
            };
          }

          if (suggestion.score_preparation >= 80) {
            figuresCompteur[suggestion.figure_id].nb_eleves_prets++;
            figuresCompteur[suggestion.figure_id].eleves_prets.push(eleves[index].eleve.pseudo);
          }
        });
      });

      // 4. Calculer le % du groupe prêt et filtrer par seuil
      const suggestions = Object.values(figuresCompteur).map(item => ({
        ...item,
        nb_eleves_total: eleves.length,
        pourcentage_groupe_pret: Math.round((item.nb_eleves_prets / eleves.length) * 100)
      })).filter(item => item.pourcentage_groupe_pret >= seuilMinimum);

      // 5. Trier par % du groupe prêt décroissant et limiter
      suggestions.sort((a, b) => b.pourcentage_groupe_pret - a.pourcentage_groupe_pret);
      return suggestions.slice(0, limite);

    } catch (error) {
      console.error('[SuggestionService.calculerSuggestionsGroupe] Erreur:', error);
      throw error;
    }
  }

  /**
   * Calcule le score de préparation pour une figure donnée et un utilisateur.
   * @param {number} utilisateurId
   * @param {number} figureId
   * @returns {Promise<Object>} { score, exercices_valides, exercices_total, details }
   */
  static async calculerScorePreparation(utilisateurId, figureId) {
    try {
      // 1. Récupérer exercices REQUIS de la figure avec poids
      const exercices = await ExerciceFigure.findAll({
        where: {
          figure_id: figureId,
          est_requis: true
        },
        include: [{
          model: Figure,
          as: 'exerciceFigure',
          attributes: ['id', 'nom'],
          include: [{
            model: EtapeProgression,
            as: 'etapes',
            attributes: ['id']
          }]
        }],
        order: [['ordre', 'ASC']]
      });

      if (exercices.length === 0) {
        return {
          score: 0,
          exercices_valides: 0,
          exercices_total: 0,
          details: []
        };
      }

      // 2. Pour chaque exercice, vérifier si toutes les étapes sont validées
      let poidsTotal = 0;
      let poidsValides = 0;
      const details = [];

      for (const exercice of exercices) {
        const etapeIds = exercice.exerciceFigure.etapes.map(e => e.id);

        // Compter combien d'étapes sont validées
        const nbEtapesValidees = await ProgressionEtape.count({
          where: {
            utilisateur_id: utilisateurId,
            etape_id: { [Op.in]: etapeIds },
            statut: 'valide'
          }
        });

        const estValide = nbEtapesValidees === etapeIds.length;
        const poids = exercice.poids;

        poidsTotal += poids;
        if (estValide) {
          poidsValides += poids;
        }

        details.push({
          exercice_nom: exercice.exerciceFigure.nom,
          ordre: exercice.ordre,
          poids,
          est_valide: estValide,
          progression: `${nbEtapesValidees}/${etapeIds.length} étapes`
        });
      }

      // 3. Calculer le score pondéré
      const score = poidsTotal > 0 ? Math.round((poidsValides / poidsTotal) * 100) : 0;

      return {
        score,
        exercices_valides: details.filter(d => d.est_valide).length,
        exercices_total: exercices.length,
        details
      };

    } catch (error) {
      console.error('[SuggestionService.calculerScorePreparation] Erreur:', error);
      throw error;
    }
  }

  /**
   * Rafraîchit le cache de suggestions (à exécuter périodiquement par cron).
   * @param {string} type - 'eleve' ou 'groupe'
   * @param {number} targetId - utilisateurId ou groupeId
   */
  static async rafraichirCacheSuggestions(type, targetId) {
    const transaction = await sequelize.transaction();

    try {
      let suggestions;

      if (type === 'eleve') {
        suggestions = await this.calculerSuggestionsEleve(targetId, 60, 10);
      } else if (type === 'groupe') {
        suggestions = await this.calculerSuggestionsGroupe(targetId, 50, 10);
      } else {
        throw new Error(`Type invalide: ${type}. Doit être 'eleve' ou 'groupe'`);
      }

      // Supprimer anciennes suggestions
      const whereClause = type === 'eleve'
        ? { utilisateur_id: targetId }
        : { groupe_id: targetId };

      await SuggestionFigure.destroy({
        where: whereClause,
        transaction
      });

      // Insérer nouvelles suggestions
      const dateExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

      for (const suggestion of suggestions) {
        await SuggestionFigure.create({
          utilisateur_id: type === 'eleve' ? targetId : null,
          groupe_id: type === 'groupe' ? targetId : null,
          figure_id: suggestion.figure_id,
          score_preparation: suggestion.score_preparation,
          nb_exercices_valides: suggestion.nb_exercices_valides,
          nb_exercices_total: suggestion.nb_exercices_total,
          date_expiration: dateExpiration,
          statut: 'pending'
        }, { transaction });
      }

      await transaction.commit();
      console.log(`[SuggestionService] Cache rafraîchi pour ${type} ID=${targetId}: ${suggestions.length} suggestions`);

    } catch (error) {
      await transaction.rollback();
      console.error('[SuggestionService.rafraichirCacheSuggestions] Erreur:', error);
      throw error;
    }
  }

  /**
   * Accepte une suggestion = ajoute la figure au programme personnel de l'élève.
   * @param {number} utilisateurId
   * @param {number} figureId
   * @returns {Promise<Object>} Le programme mis à jour
   */
  static async accepterSuggestion(utilisateurId, figureId) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Récupérer ou créer le programme personnel de l'élève
      const ProgrammeProf = require('../models').ProgrammeProf;
      let programmePerso = await ProgrammeProf.findOne({
        where: {
          professeur_id: utilisateurId, // Programme personnel: l'élève est son propre "prof"
          nom: 'Programme Personnel',
          actif: true
        }
      });

      if (!programmePerso) {
        programmePerso = await ProgrammeProf.create({
          professeur_id: utilisateurId,
          nom: 'Programme Personnel',
          description: 'Mes figures personnelles',
          est_modele: false,
          actif: true
        }, { transaction });
      }

      // 2. Ajouter la figure au programme (si pas déjà présente)
      const ProgrammeFigure = require('../models').ProgrammeFigure;
      const existeDeja = await ProgrammeFigure.findOne({
        where: {
          programme_id: programmePerso.id,
          figure_id: figureId
        }
      });

      if (!existeDeja) {
        // Trouver le prochain ordre
        const maxOrdre = await ProgrammeFigure.max('ordre', {
          where: { programme_id: programmePerso.id }
        }) || 0;

        await ProgrammeFigure.create({
          programme_id: programmePerso.id,
          figure_id: figureId,
          ordre: maxOrdre + 1
        }, { transaction });
      }

      // 3. Marquer la suggestion comme 'accepted' (si existe dans le cache)
      await SuggestionFigure.update(
        { statut: 'accepted' },
        {
          where: {
            utilisateur_id: utilisateurId,
            figure_id: figureId
          },
          transaction
        }
      );

      await transaction.commit();

      return programmePerso;

    } catch (error) {
      await transaction.rollback();
      console.error('[SuggestionService.accepterSuggestion] Erreur:', error);
      throw error;
    }
  }

  /**
   * Récupère les figures déjà assignées à un utilisateur (programmes assignés + personnel).
   * @private
   */
  static async _getFiguresAssignees(utilisateurId) {
    const assignations = await AssignationProgramme.findAll({
      where: { eleve_id: utilisateurId },
      include: [{
        model: require('../models').ProgrammeProf,
        as: 'Programme',
        include: [{
          model: ProgrammeFigure,
          as: 'ProgrammesFigures',
          attributes: ['figure_id']
        }]
      }]
    });

    const figureIds = assignations.flatMap(a =>
      a.Programme.ProgrammesFigures.map(pf => pf.figure_id)
    );

    return [...new Set(figureIds)]; // Unique
  }

  /**
   * Récupère les figures déjà 100% validées par un utilisateur.
   * @private
   */
  static async _getFiguresValidees(utilisateurId) {
    // Une figure est validée si TOUTES ses étapes sont validées
    const progressions = await ProgressionEtape.findAll({
      where: {
        utilisateur_id: utilisateurId,
        statut: 'valide'
      },
      include: [{
        model: EtapeProgression,
        as: 'etape',
        attributes: ['figure_id']
      }]
    });

    // Grouper par figure_id
    const etapesParFigure = {};
    progressions.forEach(p => {
      const figureId = p.etape.figure_id;
      if (!etapesParFigure[figureId]) {
        etapesParFigure[figureId] = [];
      }
      etapesParFigure[figureId].push(p.etape_id);
    });

    // Pour chaque figure, vérifier si toutes les étapes sont validées
    const figuresValidees = [];

    for (const figureId in etapesParFigure) {
      const totalEtapes = await EtapeProgression.count({
        where: { figure_id: figureId }
      });

      if (etapesParFigure[figureId].length === totalEtapes) {
        figuresValidees.push(parseInt(figureId));
      }
    }

    return figuresValidees;
  }

  /**
   * Détecte les cycles dans les relations d'exercices (figure A → B → A).
   * @param {number} figureId - Figure parente
   * @param {number} exerciceFigureId - Figure exercice à ajouter
   * @returns {Promise<boolean>} true si cycle détecté
   */
  static async detecterCycle(figureId, exerciceFigureId) {
    // Si on veut ajouter une figure comme exercice d'elle-même, c'est un cycle direct
    if (figureId === exerciceFigureId) {
      return true;
    }

    // Parcours en profondeur pour détecter les cycles
    const visites = new Set();

    async function parcourir(currentId, targetId) {
      if (currentId === targetId) {
        return true; // Cycle détecté
      }

      if (visites.has(currentId)) {
        return false; // Déjà visité
      }

      visites.add(currentId);

      // Récupérer les exercices de cette figure
      const exercices = await ExerciceFigure.findAll({
        where: { figure_id: currentId },
        attributes: ['exercice_figure_id']
      });

      for (const ex of exercices) {
        if (await parcourir(ex.exercice_figure_id, targetId)) {
          return true;
        }
      }

      return false;
    }

    // Démarrer le parcours depuis exerciceFigureId vers figureId
    return await parcourir(exerciceFigureId, figureId);
  }
}

module.exports = SuggestionService;
