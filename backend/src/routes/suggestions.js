const express = require('express');
const router = express.Router();
const { verifierToken } = require('../middleware/auth');
const SuggestionService = require('../services/SuggestionService');
const { SuggestionFigure } = require('../models');

/**
 * Routes pour les suggestions de figures (élèves).
 * Base: /api/suggestions
 *
 * Fonctionnalité:
 * - Recommandations personnalisées basées sur les exercices validés
 * - Top 5 suggestions (score ≥ 60%)
 * - Exclusion: figures assignées, programme personnel, figures validées
 */

/**
 * GET /api/suggestions
 * Récupère les suggestions personnalisées pour l'élève connecté.
 *
 * Retourne les top 5 figures recommandées avec:
 * - Score de préparation (% d'exercices validés)
 * - Détails des exercices validés/total
 * - Badge (≥80% = "prêt", 60-79% = "bientôt prêt")
 */
router.get('/', verifierToken, async (req, res) => {
  try {
    const utilisateurId = req.user.id;

    // Calcul dynamique (pas de cache lecture ici pour avoir les données les plus fraîches)
    const suggestions = await SuggestionService.calculerSuggestionsEleve(utilisateurId);

    res.json({
      suggestions,
      count: suggestions.length,
      message: suggestions.length > 0
        ? `${suggestions.length} suggestions disponibles`
        : 'Aucune suggestion pour le moment. Continue à progresser sur tes exercices !'
    });

  } catch (error) {
    console.error('[GET /api/suggestions] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors du calcul des suggestions',
      type: 'SUGGESTION_CALCUL_ERROR'
    });
  }
});

/**
 * GET /api/suggestions/:figureId/details
 * Récupère les détails de préparation pour une figure spécifique.
 *
 * Permet à l'élève de voir exactement quels exercices il a validés
 * et lesquels lui restent pour être prêt.
 */
router.get('/:figureId/details', verifierToken, async (req, res) => {
  try {
    const utilisateurId = req.user.id;
    const figureId = parseInt(req.params.figureId);

    if (isNaN(figureId)) {
      return res.status(400).json({
        error: 'figureId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    const scoreData = await SuggestionService.calculerScorePreparation(utilisateurId, figureId);

    res.json({
      figure_id: figureId,
      score_preparation: scoreData.score,
      exercices_valides: scoreData.exercices_valides,
      exercices_total: scoreData.exercices_total,
      details: scoreData.details,
      message: scoreData.score >= 80
        ? 'Tu es prêt pour cette figure !'
        : scoreData.score >= 60
          ? 'Tu seras bientôt prêt, continue comme ça !'
          : `Il te reste ${scoreData.exercices_total - scoreData.exercices_valides} exercices à valider`
    });

  } catch (error) {
    console.error('[GET /api/suggestions/:figureId/details] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors du calcul du score de préparation',
      type: 'SCORE_CALCUL_ERROR'
    });
  }
});

/**
 * POST /api/suggestions/:figureId/accepter
 * L'élève accepte une suggestion = ajoute la figure à son programme personnel.
 *
 * Comportement:
 * - Crée ou récupère le programme "Programme Personnel" de l'élève
 * - Ajoute la figure au programme
 * - Marque la suggestion comme 'accepted' dans le cache
 */
router.post('/:figureId/accepter', verifierToken, async (req, res) => {
  try {
    const utilisateurId = req.user.id;
    const figureId = parseInt(req.params.figureId);

    if (isNaN(figureId)) {
      return res.status(400).json({
        error: 'figureId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    const programme = await SuggestionService.accepterSuggestion(utilisateurId, figureId);

    res.status(201).json({
      message: 'Figure ajoutée à ton programme personnel',
      programme: {
        id: programme.id,
        nom: programme.nom
      }
    });

  } catch (error) {
    console.error('[POST /api/suggestions/:figureId/accepter] Erreur:', error);

    // Gérer les erreurs spécifiques
    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        error: 'Figure non trouvée',
        type: 'FIGURE_NOT_FOUND'
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'acceptation de la suggestion',
      type: 'ACCEPTATION_ERROR'
    });
  }
});

/**
 * POST /api/suggestions/:figureId/dismisser
 * L'élève rejette une suggestion (ne plus l'afficher).
 *
 * Marque la suggestion comme 'dismissed' dans le cache.
 * Note: Sera recalculée lors du prochain rafraîchissement nocturne.
 */
router.post('/:figureId/dismisser', verifierToken, async (req, res) => {
  try {
    const utilisateurId = req.user.id;
    const figureId = parseInt(req.params.figureId);

    if (isNaN(figureId)) {
      return res.status(400).json({
        error: 'figureId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    const nbUpdated = await SuggestionFigure.update(
      { statut: 'dismissed' },
      {
        where: {
          utilisateur_id: utilisateurId,
          figure_id: figureId
        }
      }
    );

    // Même si aucune suggestion n'existe en cache, on retourne succès
    // (l'élève veut juste ne plus voir cette figure)
    res.json({
      message: 'Suggestion masquée',
      updated: nbUpdated[0] > 0
    });

  } catch (error) {
    console.error('[POST /api/suggestions/:figureId/dismisser] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors du rejet de la suggestion',
      type: 'DISMISSAL_ERROR'
    });
  }
});

module.exports = router;
