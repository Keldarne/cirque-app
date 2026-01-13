/**
 * Routes professeur pour gestion des figures
 * Permet aux professeurs de gérer le catalogue de leur école
 */
const express = require('express');
const router = express.Router();

const { Figure, Discipline, EtapeProgression, ProgressionEtape } = require('../../models');
const { verifierToken, estProfesseurOuAdmin, peutModifierFigure } = require('../../middleware/auth');
const FigureService = require('../../services/FigureService');
const { Op } = require('sequelize');

/**
 * GET /api/prof/figures
 * Récupère les figures du catalogue de l'école du professeur
 * Permissions: professeur, school_admin, admin
 */
router.get('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const where = {};

    // Admin peut spécifier une école, sinon voit tout
    if (req.user.role === 'admin') {
      const { ecole_id } = req.query;
      if (ecole_id && ecole_id !== 'null') {
        where.ecole_id = ecole_id;
      } else if (ecole_id === 'null') {
        where.ecole_id = null;
      }
      // Pas de filtre = voit tout
    } else {
      // Professeurs voient les figures de leur école ET le catalogue public
      if (!req.user.ecole_id) {
        return res.status(400).json({
          error: 'Vous devez être rattaché à une école pour accéder au catalogue'
        });
      }
      where[Op.or] = [
        { ecole_id: req.user.ecole_id },
        { ecole_id: null }
      ];
    }

    const figures = await Figure.findAll({
      where,
      include: [
        {
          model: Discipline,
          attributes: ['id', 'nom']
        },
        {
          model: EtapeProgression,
          as: 'etapes',
          required: false
        }
      ],
      order: [['nom', 'ASC']]
    });

    res.json(figures);
  } catch (err) {
    console.error('Erreur GET /prof/figures:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * POST /api/prof/figures
 * Crée une nouvelle figure dans le catalogue de l'école
 * Permissions: professeur, school_admin, admin
 */
router.post('/', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { nom, descriptif, image_url, video_url, discipline_id, etapes, prerequis, metadata } = req.body;

    if (!nom || !discipline_id) {
      return res.status(400).json({ error: 'Le nom et la discipline sont requis' });
    }

    const figureData = {
      nom,
      descriptif,
      image_url,
      video_url,
      discipline_id,
      metadata,
      createur_id: req.user.id
    };

    // Force l'ecole_id selon le rôle
    if (req.user.role === 'admin') {
      // Admin peut choisir: public (null) ou école spécifique
      figureData.ecole_id = req.body.ecole_id !== undefined ? req.body.ecole_id : null;
      figureData.visibilite = figureData.ecole_id === null ? 'public' : 'ecole';
    } else {
      // Professeurs: DOIT utiliser leur école
      if (!req.user.ecole_id) {
        return res.status(400).json({
          error: 'Vous devez être rattaché à une école pour créer des figures'
        });
      }
      figureData.ecole_id = req.user.ecole_id;
      figureData.visibilite = 'ecole';

      // Log si tentative de créer avec mauvais ecole_id
      if (req.body.ecole_id && req.body.ecole_id !== req.user.ecole_id) {
        console.warn(`[SECURITY] User ${req.user.id} attempted to create figure with wrong ecole_id ${req.body.ecole_id}`);
      }
    }

    // Créer la figure avec étapes et prérequis
    const figureComplete = await FigureService.createFigureWithEtapes(
      figureData,
      etapes,
      prerequis
    );

    res.status(201).json(figureComplete);
  } catch (err) {
    console.error('Erreur POST /prof/figures:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * PUT /api/prof/figures/:id
 * Modifie une figure existante
 * Permissions: créateur de la figure, school_admin de l'école, ou admin
 */
router.put('/:id', verifierToken, estProfesseurOuAdmin, peutModifierFigure, async (req, res) => {
  try {
    const { nom, descriptif, image_url, video_url, discipline_id, etapes, prerequis, metadata } = req.body;
    const figure = req.figure; // Attaché par middleware peutModifierFigure

    const updateData = {
      nom: nom !== undefined ? nom : figure.nom,
      descriptif: descriptif !== undefined ? descriptif : figure.descriptif,
      image_url: image_url !== undefined ? image_url : figure.image_url,
      video_url: video_url !== undefined ? video_url : figure.video_url,
      discipline_id: discipline_id !== undefined ? discipline_id : figure.discipline_id,
      metadata: metadata !== undefined ? metadata : figure.metadata
    };

    // Mise à jour via le service
    const updatedFigure = await FigureService.updateFigureWithEtapes(
      figure,
      updateData,
      etapes,
      prerequis
    );

    res.json(updatedFigure);
  } catch (err) {
    console.error('Erreur PUT /prof/figures/:id:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * DELETE /api/prof/figures/:id
 * Supprime une figure
 * Permissions: créateur de la figure, school_admin de l'école, ou admin
 */
router.delete('/:id', verifierToken, estProfesseurOuAdmin, peutModifierFigure, async (req, res) => {
  try {
    const figure = req.figure;

    // Vérifier qu'il n'y a pas de progressions associées
    const progressionCount = await ProgressionEtape.count({
      include: [{
        model: EtapeProgression,
        where: { figure_id: figure.id },
        required: true
      }]
    });

    if (progressionCount > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer une figure avec des progressions élèves',
        progressions: progressionCount
      });
    }

    await figure.destroy();
    res.json({ message: 'Figure supprimée avec succès' });
  } catch (err) {
    console.error('Erreur DELETE /prof/figures/:id:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * GET /api/prof/figures/:id
 * Récupère les détails d'une figure
 * Permissions: professeur, admin
 */
router.get('/:id', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const figure = await Figure.findByPk(id, {
      include: [
        {
          model: Discipline,
          attributes: ['id', 'nom']
        },
        {
          model: EtapeProgression,
          as: 'etapes'
        }
      ]
    });

    if (!figure) {
      return res.status(404).json({ error: 'Figure non trouvée' });
    }

    // Vérifier que le professeur a accès à cette figure
    if (req.user.role !== 'admin' && figure.ecole_id !== null && figure.ecole_id !== req.user.ecole_id) {
      return res.status(403).json({ error: 'Accès refusé à cette figure' });
    }

    res.json(figure);
  } catch (err) {
    console.error('Erreur GET /prof/figures/:id:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
