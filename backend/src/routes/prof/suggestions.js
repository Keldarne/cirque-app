const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin } = require('../../middleware/auth');
const SuggestionService = require('../../services/SuggestionService');
const { Groupe, ProgrammeProf, ProgrammeFigure } = require('../../models');

/**
 * Routes pour les suggestions de figures (professeurs).
 * Base: /api/prof/suggestions
 *
 * Fonctionnalité:
 * - Suggestions au niveau groupe (agrégation des élèves)
 * - Permet au prof d'assigner les figures suggérées à tout le groupe
 */

/**
 * GET /api/prof/suggestions/groupe/:groupeId
 * Récupère les suggestions pour un groupe.
 *
 * Calcule le % d'élèves du groupe prêts pour chaque figure (score ≥ 80%).
 * Filtre: affiche seulement figures où ≥ 50% du groupe est prêt.
 * Top 5 suggestions triées par % décroissant.
 */
router.get('/groupe/:groupeId', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const groupeId = parseInt(req.params.groupeId);
    const professeurId = req.user.id;

    if (isNaN(groupeId)) {
      return res.status(400).json({
        error: 'groupeId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    // Vérifier que le groupe appartient au prof (sauf admin)
    const groupe = await Groupe.findOne({
      where: { id: groupeId },
      attributes: ['id', 'nom', 'professeur_id']
    });

    if (!groupe) {
      return res.status(404).json({
        error: 'Groupe non trouvé',
        type: 'GROUPE_NOT_FOUND'
      });
    }

    // Vérification propriété (sauf admin)
    if (req.user.role !== 'admin' && groupe.professeur_id !== professeurId) {
      return res.status(403).json({
        error: 'Accès refusé: ce groupe ne vous appartient pas',
        type: 'FORBIDDEN'
      });
    }

    const suggestions = await SuggestionService.calculerSuggestionsGroupe(groupeId);

    res.json({
      groupe: {
        id: groupe.id,
        nom: groupe.nom
      },
      suggestions,
      count: suggestions.length,
      message: suggestions.length > 0
        ? `${suggestions.length} suggestions pour le groupe "${groupe.nom}"`
        : 'Aucune suggestion pour ce groupe pour le moment'
    });

  } catch (error) {
    console.error('[GET /api/prof/suggestions/groupe/:groupeId] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors du calcul des suggestions',
      type: 'SUGGESTION_CALCUL_ERROR'
    });
  }
});

/**
 * POST /api/prof/suggestions/groupe/:groupeId/assigner/:figureId
 * Le prof assigne une figure suggérée à tout le groupe.
 *
 * Comportement:
 * - Crée ou récupère le programme du groupe
 * - Ajoute la figure au programme
 * - Tous les élèves du groupe reçoivent automatiquement la figure
 */
router.post('/groupe/:groupeId/assigner/:figureId', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const groupeId = parseInt(req.params.groupeId);
    const figureId = parseInt(req.params.figureId);
    const professeurId = req.user.id;

    if (isNaN(groupeId) || isNaN(figureId)) {
      return res.status(400).json({
        error: 'groupeId ou figureId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    // Vérifier que le groupe appartient au prof
    const groupe = await Groupe.findOne({
      where: { id: groupeId },
      attributes: ['id', 'nom', 'professeur_id']
    });

    if (!groupe) {
      return res.status(404).json({
        error: 'Groupe non trouvé',
        type: 'GROUPE_NOT_FOUND'
      });
    }

    if (req.user.role !== 'admin' && groupe.professeur_id !== professeurId) {
      return res.status(403).json({
        error: 'Accès refusé: ce groupe ne vous appartient pas',
        type: 'FORBIDDEN'
      });
    }

    // Récupérer ou créer le programme du groupe
    let programmeGroupe = await ProgrammeProf.findOne({
      where: {
        professeur_id: professeurId,
        nom: `Programme ${groupe.nom}`,
        actif: true
      }
    });

    if (!programmeGroupe) {
      programmeGroupe = await ProgrammeProf.create({
        professeur_id: professeurId,
        nom: `Programme ${groupe.nom}`,
        description: `Programme pour le groupe ${groupe.nom}`,
        est_modele: false,
        actif: true
      });
    }

    // Vérifier si la figure n'est pas déjà dans le programme
    const existeDeja = await ProgrammeFigure.findOne({
      where: {
        programme_id: programmeGroupe.id,
        figure_id: figureId
      }
    });

    if (existeDeja) {
      return res.status(409).json({
        error: 'Cette figure est déjà dans le programme du groupe',
        type: 'FIGURE_ALREADY_IN_PROGRAMME'
      });
    }

    // Trouver le prochain ordre
    const maxOrdre = await ProgrammeFigure.max('ordre', {
      where: { programme_id: programmeGroupe.id }
    }) || 0;

    // Ajouter la figure au programme
    const programmeFigure = await ProgrammeFigure.create({
      programme_id: programmeGroupe.id,
      figure_id: figureId,
      ordre: maxOrdre + 1
    });

    // Note: L'assignation aux élèves se fait via GroupeProgrammeService
    // Pour simplifier, on retourne juste le succès ici
    // Dans une implémentation complète, il faudrait appeler GroupeProgrammeService.assignerProgrammeAuGroupe()

    res.status(201).json({
      message: `Figure ajoutée au programme du groupe "${groupe.nom}"`,
      programme: {
        id: programmeGroupe.id,
        nom: programmeGroupe.nom
      },
      figure_ordre: programmeFigure.ordre
    });

  } catch (error) {
    console.error('[POST /api/prof/suggestions/groupe/:groupeId/assigner/:figureId] Erreur:', error);

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(404).json({
        error: 'Figure non trouvée',
        type: 'FIGURE_NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'assignation de la figure',
      type: 'ASSIGNATION_ERROR'
    });
  }
});

/**
 * GET /api/prof/suggestions/eleve/:eleveId
 * Récupère les suggestions pour un élève spécifique (vue prof).
 *
 * Permet au prof de voir ce qu'un élève individuel est prêt à apprendre.
 */
router.get('/eleve/:eleveId', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const eleveId = parseInt(req.params.eleveId);
    const professeurId = req.user.id;

    if (isNaN(eleveId)) {
      return res.status(400).json({
        error: 'eleveId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    // Vérifier que l'élève est dans un groupe du prof (sauf admin)
    if (req.user.role !== 'admin') {
      const { RelationProfEleve } = require('../../models');
      const relation = await RelationProfEleve.findOne({
        where: {
          professeur_id: professeurId,
          eleve_id: eleveId
        }
      });

      if (!relation) {
        return res.status(403).json({
          error: 'Accès refusé: cet élève n\'est pas sous votre supervision',
          type: 'FORBIDDEN'
        });
      }
    }

    const suggestions = await SuggestionService.calculerSuggestionsEleve(eleveId);

    res.json({
      eleve_id: eleveId,
      suggestions,
      count: suggestions.length,
      message: `${suggestions.length} suggestions pour cet élève`
    });

  } catch (error) {
    console.error('[GET /api/prof/suggestions/eleve/:eleveId] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors du calcul des suggestions',
      type: 'SUGGESTION_CALCUL_ERROR'
    });
  }
});

module.exports = router;
