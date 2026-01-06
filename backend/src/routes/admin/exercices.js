const express = require('express');
const router = express.Router();
const { verifierToken, estAdmin } = require('../../middleware/auth');
const { Figure, ExerciceFigure } = require('../../models');
const SuggestionService = require('../../services/SuggestionService');

/**
 * Routes pour la gestion des exercices décomposés (admins).
 * Base: /api/admin/exercices
 *
 * Fonctionnalité:
 * - CRUD des relations figure → exercices (récursif)
 * - Détection de cycles pour éviter boucles infinies
 * - Gestion des poids et ordre
 */

/**
 * POST /api/admin/figures/:figureId/exercices
 * Ajouter un exercice décomposé à une figure.
 *
 * Body:
 * - exercice_figure_id (required): ID de la figure qui sert d'exercice
 * - ordre (optional): Ordre de l'exercice (défaut: dernier)
 * - est_requis (optional): true/false (défaut: true)
 * - poids (optional): 1-3 (défaut: 1)
 *
 * Validations:
 * - Figure parente existe
 * - Figure exercice existe
 * - Pas de cycle (A → B → A)
 * - Pas de doublon (contrainte unique)
 */
router.post('/figures/:figureId/exercices', verifierToken, estAdmin, async (req, res) => {
  try {
    const figureId = parseInt(req.params.figureId);
    const { exercice_figure_id, ordre, est_requis, poids } = req.body;

    // Validation des paramètres
    if (isNaN(figureId) || !exercice_figure_id) {
      return res.status(400).json({
        error: 'figureId et exercice_figure_id sont requis',
        type: 'VALIDATION_ERROR'
      });
    }

    // Valider que les deux figures existent
    const [figureParente, figureExercice] = await Promise.all([
      Figure.findByPk(figureId, { attributes: ['id', 'nom'] }),
      Figure.findByPk(exercice_figure_id, { attributes: ['id', 'nom'] })
    ]);

    if (!figureParente) {
      return res.status(404).json({
        error: `Figure parente non trouvée (ID: ${figureId})`,
        type: 'FIGURE_NOT_FOUND'
      });
    }

    if (!figureExercice) {
      return res.status(404).json({
        error: `Figure exercice non trouvée (ID: ${exercice_figure_id})`,
        type: 'EXERCICE_FIGURE_NOT_FOUND'
      });
    }

    // Validation: éviter cycles (figure A → B → A)
    const hasCycle = await SuggestionService.detecterCycle(figureId, exercice_figure_id);
    if (hasCycle) {
      return res.status(400).json({
        error: 'Cycle détecté: un exercice ne peut pas référencer directement ou indirectement sa figure parente',
        type: 'CYCLE_DETECTED',
        details: {
          figure_parente: figureParente.nom,
          figure_exercice: figureExercice.nom
        }
      });
    }

    // Déterminer l'ordre si non fourni
    let ordreEffectif = ordre;
    if (!ordreEffectif) {
      const maxOrdre = await ExerciceFigure.max('ordre', {
        where: { figure_id: figureId }
      }) || 0;
      ordreEffectif = maxOrdre + 1;
    }

    // Créer la relation
    const exercice = await ExerciceFigure.create({
      figure_id: figureId,
      exercice_figure_id,
      ordre: ordreEffectif,
      est_requis: est_requis !== false, // default true
      poids: poids || 1
    });

    res.status(201).json({
      message: `Exercice "${figureExercice.nom}" ajouté à la figure "${figureParente.nom}"`,
      exercice: {
        id: exercice.id,
        figure_parente: figureParente.nom,
        exercice: figureExercice.nom,
        ordre: exercice.ordre,
        est_requis: exercice.est_requis,
        poids: exercice.poids
      }
    });

  } catch (error) {
    console.error('[POST /api/admin/figures/:figureId/exercices] Erreur:', error);

    // Gérer erreur contrainte unique
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Cet exercice est déjà lié à cette figure',
        type: 'DUPLICATE_EXERCICE'
      });
    }

    // Gérer erreur validation modèle
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        error: `Erreur de validation: ${messages}`,
        type: 'MODEL_VALIDATION_ERROR',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'ajout de l\'exercice',
      type: 'CREATION_ERROR'
    });
  }
});

/**
 * GET /api/admin/figures/:figureId/exercices
 * Liste les exercices d'une figure (avec détails).
 *
 * Retourne tous les exercices triés par ordre, avec:
 * - Informations de la figure exercice
 * - Ordre, poids, est_requis
 */
router.get('/figures/:figureId/exercices', verifierToken, estAdmin, async (req, res) => {
  try {
    const figureId = parseInt(req.params.figureId);

    if (isNaN(figureId)) {
      return res.status(400).json({
        error: 'figureId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    // Vérifier que la figure existe
    const figure = await Figure.findByPk(figureId, { attributes: ['id', 'nom'] });
    if (!figure) {
      return res.status(404).json({
        error: 'Figure non trouvée',
        type: 'FIGURE_NOT_FOUND'
      });
    }

    const exercices = await ExerciceFigure.findAll({
      where: { figure_id: figureId },
      include: [{
        model: Figure,
        as: 'exerciceFigure',
        attributes: ['id', 'nom', 'descriptif', 'difficulty_level', 'type']
      }],
      order: [['ordre', 'ASC']]
    });

    res.json({
      figure: {
        id: figure.id,
        nom: figure.nom
      },
      exercices: exercices.map(ex => ({
        id: ex.id,
        ordre: ex.ordre,
        est_requis: ex.est_requis,
        poids: ex.poids,
        exercice: {
          id: ex.exerciceFigure.id,
          nom: ex.exerciceFigure.nom,
          descriptif: ex.exerciceFigure.descriptif,
          difficulty_level: ex.exerciceFigure.difficulty_level,
          type: ex.exerciceFigure.type
        }
      })),
      count: exercices.length
    });

  } catch (error) {
    console.error('[GET /api/admin/figures/:figureId/exercices] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des exercices',
      type: 'FETCH_ERROR'
    });
  }
});

/**
 * PUT /api/admin/exercices/:exerciceId
 * Modifier un exercice décomposé (ordre, poids, est_requis).
 *
 * Body: (tous optionnels)
 * - ordre: nouveau numéro d'ordre
 * - poids: 1-3
 * - est_requis: true/false
 */
router.put('/exercices/:exerciceId', verifierToken, estAdmin, async (req, res) => {
  try {
    const exerciceId = parseInt(req.params.exerciceId);
    const { ordre, poids, est_requis } = req.body;

    if (isNaN(exerciceId)) {
      return res.status(400).json({
        error: 'exerciceId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    const exercice = await ExerciceFigure.findByPk(exerciceId);
    if (!exercice) {
      return res.status(404).json({
        error: 'Exercice non trouvé',
        type: 'EXERCICE_NOT_FOUND'
      });
    }

    // Mise à jour sélective
    if (ordre !== undefined) exercice.ordre = ordre;
    if (poids !== undefined) exercice.poids = poids;
    if (est_requis !== undefined) exercice.est_requis = est_requis;

    await exercice.save();

    res.json({
      message: 'Exercice mis à jour',
      exercice: {
        id: exercice.id,
        ordre: exercice.ordre,
        poids: exercice.poids,
        est_requis: exercice.est_requis
      }
    });

  } catch (error) {
    console.error('[PUT /api/admin/exercices/:exerciceId] Erreur:', error);

    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        error: `Erreur de validation: ${messages}`,
        type: 'MODEL_VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      error: 'Erreur lors de la mise à jour de l\'exercice',
      type: 'UPDATE_ERROR'
    });
  }
});

/**
 * DELETE /api/admin/exercices/:exerciceId
 * Supprimer un exercice décomposé.
 */
router.delete('/exercices/:exerciceId', verifierToken, estAdmin, async (req, res) => {
  try {
    const exerciceId = parseInt(req.params.exerciceId);

    if (isNaN(exerciceId)) {
      return res.status(400).json({
        error: 'exerciceId invalide',
        type: 'VALIDATION_ERROR'
      });
    }

    const exercice = await ExerciceFigure.findByPk(exerciceId, {
      include: [
        { model: Figure, as: 'figure', attributes: ['nom'] },
        { model: Figure, as: 'exerciceFigure', attributes: ['nom'] }
      ]
    });

    if (!exercice) {
      return res.status(404).json({
        error: 'Exercice non trouvé',
        type: 'EXERCICE_NOT_FOUND'
      });
    }

    const figureNom = exercice.figure.nom;
    const exerciceNom = exercice.exerciceFigure.nom;

    await exercice.destroy();

    res.json({
      message: `Exercice "${exerciceNom}" retiré de la figure "${figureNom}"`,
      deleted_id: exerciceId
    });

  } catch (error) {
    console.error('[DELETE /api/admin/exercices/:exerciceId] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'exercice',
      type: 'DELETE_ERROR'
    });
  }
});

module.exports = router;
