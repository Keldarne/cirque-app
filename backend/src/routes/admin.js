/**
 * Routes d'administration
 * Gère les opérations CRUD pour les disciplines et figures
 * Requiert une authentification avec le rôle approprié
 */
const express = require('express');
const router = express.Router();
const { Discipline, Figure, EtapeProgression, ProgressionEtape, Ecole } = require('../models');
const { verifierToken, estAdmin, estAdminOuSchoolAdmin, estPersonnelAutorise, peutModifierFigure } = require('../middleware/auth');
const FigureService = require('../services/FigureService'); // Import FigureService
const DisciplineAvailabilityService = require('../services/DisciplineAvailabilityService');

/**
 * GET /admin/ecoles
 * Récupère la liste de toutes les écoles.
 * Permissions: masteradmin uniquement
 */
router.get('/ecoles', verifierToken, estAdmin, async (req, res) => {
  try {
    const ecoles = await Ecole.findAll({ order: [['nom', 'ASC']] });
    res.json(ecoles);
  } catch (err) {
    console.error('Erreur GET /admin/ecoles:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * GET /admin/figures
 * Récupère les figures par école ou les figures publiques.
 * Permissions: masteradmin uniquement
 */
router.get('/figures', verifierToken, estAdmin, async (req, res) => {
  try {
    const { ecole_id } = req.query;
    const where = {};
    
    if (ecole_id && ecole_id !== 'null') {
      where.ecole_id = ecole_id;
    } else {
      where.ecole_id = null;
    }

    const figures = await Figure.findAll({ where, include: [Discipline] });
    res.json(figures);
  } catch (err) {
    console.error('Erreur GET /admin/figures:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});


/**
 * POST /admin/disciplines
 * Crée une nouvelle discipline de cirque
 * Permissions: admin uniquement
 */

// ... (routes pour /disciplines inchangées)

/**
 * POST /admin/figures
 * Crée une nouvelle figure avec ses étapes de progression et ses prérequis
 */
router.post('/figures', verifierToken, estAdminOuSchoolAdmin, async (req, res) => {
  try {
    const { nom, descriptif, image_url, video_url, discipline_id, etapes, ecole_id, prerequis } = req.body;

    if (!nom || !discipline_id) {
      return res.status(400).json({ error: 'Le nom et la discipline sont requis' });
    }

    const figureData = {
      nom, descriptif, image_url, video_url, discipline_id,
      createur_id: req.user.id
    };

    if (req.user.role === 'school_admin') {
      figureData.ecole_id = req.user.ecole_id;
    } else if (req.user.role === 'admin') {
      figureData.ecole_id = ecole_id || null;
    }

    // Passer les prérequis au service (tableau d'IDs)
    const figureComplete = await FigureService.createFigureWithEtapes(figureData, etapes, prerequis);

    res.status(201).json(figureComplete);
  } catch (err) {
    console.error('Erreur POST /admin/figures:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// ... (GET /figures/:figureId/etapes inchangé)

/**
 * PUT /admin/figures/:id
 * Modifie une figure existante, ses étapes et ses prérequis
 */
router.put('/figures/:id', verifierToken, estPersonnelAutorise, peutModifierFigure, async (req, res) => {
  try {
    // Le middleware peutModifierFigure a déjà vérifié les droits et attaché la figure
    const figure = req.figure; // The Figure instance is passed from the middleware
    const { nom, descriptif, image_url, video_url, discipline_id, etapes, ecole_id, prerequis } = req.body;

    if (!nom || !discipline_id) {
      return res.status(400).json({ error: 'Le nom et la discipline sont requis' });
    }

    const updateData = { nom, descriptif, image_url, video_url, discipline_id };

    // Gérer l'ecole_id en fonction du rôle
    if (req.user.role === 'school_admin') {
      updateData.ecole_id = req.user.ecole_id;
    } else if (req.user.role === 'admin') {
      updateData.ecole_id = ecole_id;
    }

    // Passer les prérequis au service (tableau d'IDs, ou undefined si non fourni)
    const figureComplete = await FigureService.updateFigureWithEtapes(figure, updateData, etapes, prerequis);

    res.json(figureComplete);
  } catch (err) {
    console.error('Erreur PUT /admin/figures/:id:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * GET /admin/figures/:id/exercices
 * Récupère les exercices (prérequis) d'une figure
 */
router.get('/figures/:id/exercices', verifierToken, async (req, res) => {
  try {
    const figureId = parseInt(req.params.id);
    const { ExerciceFigure } = require('../models');

    if (isNaN(figureId)) {
      return res.status(400).json({ error: 'ID de figure invalide' });
    }

    // Vérifier que la figure existe
    const figure = await Figure.findByPk(figureId, { attributes: ['id', 'nom'] });
    if (!figure) {
      return res.status(404).json({ error: 'Figure non trouvée' });
    }

    // Récupérer les exercices avec les détails des figures prérequises
    const exercices = await ExerciceFigure.findAll({
      where: { figure_id: figureId },
      include: [{
        model: Figure,
        as: 'exerciceFigure',
        attributes: ['id', 'nom', 'descriptif', 'difficulty_level', 'type', 'discipline_id']
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
          type: ex.exerciceFigure.type,
          discipline_id: ex.exerciceFigure.discipline_id
        }
      })),
      count: exercices.length
    });

  } catch (err) {
    console.error('Erreur GET /admin/figures/:id/exercices:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * DELETE /admin/figures/:id
 * Supprime une figure et toutes ses données associées
 */
router.delete('/figures/:id', verifierToken, estPersonnelAutorise, peutModifierFigure, async (req, res) => {
  try {
    const figure = req.figure; // Attaché par peutModifierFigure
    const figureId = figure.id;

    // 1. Récupérer les IDs des étapes de cette figure
    const etapes = await EtapeProgression.findAll({
      where: { figure_id: figureId },
      attributes: ['id']
    });
    const etapeIds = etapes.map(e => e.id);

    if (etapeIds.length > 0) {
      // La suppression des ProgressionEtape déclenchera la suppression en cascade des TentativeEtape
      await ProgressionEtape.destroy({ where: { etape_id: etapeIds } });
    }

    await EtapeProgression.destroy({ where: { figure_id: figureId } });
    await figure.destroy();

    res.json({ message: 'Figure supprimée avec succès' });
  } catch (err) {
    console.error('Erreur DELETE /admin/figures/:id:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// ... (routes /disciplines inchangées mais on doit s'assurer qu'elles sont après pour la lisibilité)

router.post('/disciplines', verifierToken, estAdmin, async (req, res) => {
    // ...
});
router.put('/disciplines/:id', verifierToken, estAdmin, async (req, res) => {
    // ...
});
router.delete('/disciplines/:id', verifierToken, estAdmin, async (req, res) => {
    // ...
});

// ═══════════════════════════════════════════════════════════════════
// Routes Discipline Availability (Per-School Configuration)
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /admin/ecoles/:ecoleId/disciplines
 * Liste les disciplines configurées pour une école
 * Permissions: master admin ou school admin de l'école concernée
 */
router.get('/ecoles/:ecoleId/disciplines',
  verifierToken,
  estAdminOuSchoolAdmin,
  async (req, res) => {
    try {
      const { ecoleId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      // Vérifier permission (master admin ou school admin de cette école)
      if (req.user.role !== 'admin' && req.user.ecole_id !== parseInt(ecoleId)) {
        return res.status(403).json({ message: 'Accès interdit' });
      }

      const disciplines = await DisciplineAvailabilityService
        .getDisciplinesForEcole(ecoleId, includeInactive);

      res.json(disciplines);
    } catch (error) {
      console.error('Erreur get disciplines école:', error);
      res.status(500).json({ message: 'Erreur serveur', details: error.message });
    }
  }
);

/**
 * POST /admin/ecoles/:ecoleId/disciplines
 * Activer/désactiver une discipline pour une école
 * Permissions: master admin ou school admin de l'école concernée
 */
router.post('/ecoles/:ecoleId/disciplines',
  verifierToken,
  estAdminOuSchoolAdmin,
  async (req, res) => {
    try {
      const { ecoleId } = req.params;
      const { discipline_id, actif } = req.body;

      if (!discipline_id || actif === undefined) {
        return res.status(400).json({ message: 'discipline_id et actif sont requis' });
      }

      // Vérifier permission
      if (req.user.role !== 'admin' && req.user.ecole_id !== parseInt(ecoleId)) {
        return res.status(403).json({ message: 'Accès interdit' });
      }

      const record = await DisciplineAvailabilityService
        .toggleDiscipline(ecoleId, discipline_id, actif);

      res.json(record);
    } catch (error) {
      console.error('Erreur toggle discipline:', error);
      res.status(500).json({ message: 'Erreur serveur', details: error.message });
    }
  }
);

/**
 * PUT /admin/ecoles/:ecoleId/disciplines/bulk
 * Mise à jour en masse des disciplines d'une école
 * Permissions: master admin ou school admin de l'école concernée
 */
router.put('/ecoles/:ecoleId/disciplines/bulk',
  verifierToken,
  estAdminOuSchoolAdmin,
  async (req, res) => {
    try {
      const { ecoleId } = req.params;
      const { disciplines } = req.body; // [{ discipline_id, actif, ordre }]

      if (!Array.isArray(disciplines)) {
        return res.status(400).json({ message: 'disciplines doit être un tableau' });
      }

      // Vérifier permission
      if (req.user.role !== 'admin' && req.user.ecole_id !== parseInt(ecoleId)) {
        return res.status(403).json({ message: 'Accès interdit' });
      }

      await DisciplineAvailabilityService.bulkUpdateDisciplines(ecoleId, disciplines);

      res.json({ message: 'Disciplines mises à jour' });
    } catch (error) {
      console.error('Erreur bulk update disciplines:', error);
      res.status(500).json({ message: 'Erreur serveur', details: error.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// Routes Exercices Décomposés (Suggestions System)
// ═══════════════════════════════════════════════════════════════════
router.use('/exercices', require('./admin/exercices'));

module.exports = router;
