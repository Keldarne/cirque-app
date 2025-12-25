const express = require('express');
const router = express.Router();
const { verifierToken } = require('../middleware/auth');
const EntrainementService = require('../services/EntrainementService');

/**
 * @route   GET /api/entrainement/test
 * @desc    Route de test pour vérifier que le module est bien monté.
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.status(200).json({ message: 'Le module entrainement fonctionne !' });
});

/**
 * @route   POST /api/entrainement/tentatives
 * @desc    Enregistre une tentative sur une étape avec 4 modes supportés
 * @access  Private
 * @body    {
 *            etapeId: number (required),
 *            typeSaisie: 'binaire' | 'evaluation' | 'duree' | 'evaluation_duree' (required),
 *            reussite: boolean (requis si typeSaisie='binaire'),
 *            score: number 1-3 (requis si typeSaisie='evaluation' ou 'evaluation_duree'),
 *            dureeSecondes: number (requis si typeSaisie='duree' ou 'evaluation_duree')
 *          }
 */
router.post('/tentatives', verifierToken, async (req, res) => {
  const { etapeId, typeSaisie, reussite, score, dureeSecondes } = req.body;
  const utilisateurId = req.user.id;

  // Validation de base
  if (etapeId == null) {
    return res.status(400).json({ error: 'Le champ etapeId est requis.' });
  }

  if (!typeSaisie) {
    return res.status(400).json({
      error: 'Le champ typeSaisie est requis (binaire, evaluation, duree ou evaluation_duree).'
    });
  }

  try {
    const tentativeData = {
      typeSaisie,
      reussite,
      score,
      dureeSecondes
    };

    const result = await EntrainementService.enregistrerTentative(
      utilisateurId,
      etapeId,
      tentativeData
    );

    res.status(201).json({
      message: 'Tentative enregistrée avec succès',
      progressionEtape: result.progressionEtape,
      tentative: result.tentative
    });

  } catch (error) {
    console.error(`Erreur sur POST /api/entrainement/tentatives: ${error.message}`);

    // Erreurs de validation (400)
    if (error.message.includes('requis') ||
        error.message.includes('doit être') ||
        error.message.includes('invalide') ||
        error.message.includes('ne peut')) {
      return res.status(400).json({ error: error.message });
    }

    // Progression non trouvée (404)
    if (error.message.includes("n'a pas commencé") || error.message.includes("n'existe pas")) {
      return res.status(404).json({ error: error.message });
    }

    // Autres erreurs (500)
    res.status(500).json({
      error: 'Une erreur est survenue lors de l\'enregistrement de la tentative.'
    });
  }
});

/**
 * @route   GET /api/entrainement/tentatives/:etapeId
 * @desc    Récupère l'historique paginé des tentatives pour une étape spécifique
 * @access  Private
 * @query   {string} [mode] - Filtrer par type_saisie (binaire|evaluation|duree|evaluation_duree)
 * @query   {number} [limit=20] - Nombre de résultats (max 100)
 * @query   {number} [offset=0] - Décalage pour pagination
 */
router.get('/tentatives/:etapeId', verifierToken, async (req, res) => {
  const { etapeId } = req.params;
  const { mode, limit, offset } = req.query;
  const utilisateurId = req.user.id;

  // Parser et valider pagination
  const limitInt = parseInt(limit) || 20;     // Default: 20
  const offsetInt = parseInt(offset) || 0;    // Default: 0

  // Validation
  if (limitInt < 1 || limitInt > 100) {
    return res.status(400).json({
      error: 'Le paramètre limit doit être entre 1 et 100'
    });
  }
  if (offsetInt < 0) {
    return res.status(400).json({
      error: 'Le paramètre offset ne peut être négatif'
    });
  }

  try {
    const { TentativeEtape, ProgressionEtape } = require('../models');

    // Trouver la progression de l'utilisateur
    const progressionEtape = await ProgressionEtape.findOne({
      where: {
        utilisateur_id: utilisateurId,
        etape_id: etapeId
      }
    });

    if (!progressionEtape) {
      // Ce n'est pas une erreur, c'est juste qu'il n'y a pas encore d'historique
      return res.status(200).json([]);
    }

    // Construire les conditions de recherche
    const whereClause = {
      progression_etape_id: progressionEtape.id
    };

    // Filtrer par mode si spécifié
    if (mode && ['binaire', 'evaluation', 'duree', 'evaluation_duree'].includes(mode)) {
      whereClause.type_saisie = mode;
    }

    const tentatives = await TentativeEtape.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: limitInt,
      offset: offsetInt
    });

    res.status(200).json(tentatives);

  } catch (error) {
    console.error(`Erreur sur GET /api/entrainement/tentatives/${etapeId}:`, error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des tentatives'
    });
  }
});

/**
 * @route   GET /api/entrainement/historique/utilisateur/:utilisateurId
 * @desc    Récupère l'historique global des tentatives d'un utilisateur (toutes figures)
 * @access  Private (Professeur/Admin pour voir les élèves, Élève pour lui-même)
 * @query   {number} [limit=20] - Nombre de résultats (max 100)
 * @query   {number} [offset=0] - Pagination
 * @query   {string} [mode] - Filtrer par type_saisie
 */
router.get('/historique/utilisateur/:utilisateurId', verifierToken, async (req, res) => {
  const { utilisateurId } = req.params;
  const { mode, limit, offset } = req.query;
  const requesterUserId = req.user.id;
  const requesterRole = req.user.role;

  // Vérification des autorisations
  const isOwnData = parseInt(utilisateurId) === requesterUserId;
  const canViewOthers = ['professeur', 'admin'].includes(requesterRole);

  if (!isOwnData && !canViewOthers) {
    return res.status(403).json({
      error: 'Vous n\'avez pas l\'autorisation de voir cet historique'
    });
  }

  // Parser pagination
  const limitInt = parseInt(limit) || 20;
  const offsetInt = parseInt(offset) || 0;

  if (limitInt < 1 || limitInt > 100) {
    return res.status(400).json({
      error: 'Le paramètre limit doit être entre 1 et 100'
    });
  }
  if (offsetInt < 0) {
    return res.status(400).json({
      error: 'Le paramètre offset ne peut être négatif'
    });
  }

  try {
    const { TentativeEtape, ProgressionEtape, Etape, Figure } = require('../models');

    // Construire le filtre
    const whereClauseTentative = {};
    if (mode && ['binaire', 'evaluation', 'duree', 'evaluation_duree'].includes(mode)) {
      whereClauseTentative.type_saisie = mode;
    }

    // Récupérer tentatives avec jointures pour contexte
    const tentatives = await TentativeEtape.findAll({
      where: whereClauseTentative,
      include: [{
        model: ProgressionEtape,
        required: true,
        where: { utilisateur_id: utilisateurId },
        include: [{
          model: Etape,
          required: true,
          attributes: ['id', 'nom', 'ordre', 'figure_id'],
          include: [{
            model: Figure,
            required: true,
            attributes: ['id', 'nom', 'image_url']
          }]
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: limitInt,
      offset: offsetInt
    });

    // Formater la réponse avec contexte
    const formattedTentatives = tentatives.map(t => ({
      id: t.id,
      progression_etape_id: t.progression_etape_id,
      type_saisie: t.type_saisie,
      reussie: t.reussie,
      score: t.score,
      duree_secondes: t.duree_secondes,
      createdAt: t.createdAt,
      etape: {
        id: t.ProgressionEtape.Etape.id,
        nom: t.ProgressionEtape.Etape.nom,
        ordre: t.ProgressionEtape.Etape.ordre
      },
      figure: {
        id: t.ProgressionEtape.Etape.Figure.id,
        nom: t.ProgressionEtape.Etape.Figure.nom,
        image_url: t.ProgressionEtape.Etape.Figure.image_url
      }
    }));

    res.status(200).json(formattedTentatives);

  } catch (error) {
    console.error(`Erreur sur GET /api/entrainement/historique/utilisateur/${utilisateurId}:`, error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

module.exports = router;
