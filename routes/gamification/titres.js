const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middleware/auth');
const GamificationService = require('../../services/GamificationService');

/**
 * GET /api/gamification/titres
 * Récupère tous les titres et leur statut d'obtention pour l'utilisateur.
 */
router.get('', verifierToken, async (req, res) => {
  try {
    const titres = await GamificationService.getAllTitles(req.user.id);
    res.json({ titres });
  } catch (error) {
    console.error('Erreur GET /api/gamification/titres:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/gamification/titres/utilisateur
 * Lister les titres obtenus par l'utilisateur.
 */
router.get('/utilisateur', verifierToken, async (req, res) => {
  try {
    const titres = await GamificationService.getObtainedTitles(req.user.id);
    res.json({ titres });
  } catch (error) {
    console.error('Erreur GET /api/gamification/titres/utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * PUT /api/gamification/titres/:id/equiper
 * Équiper un titre.
 */
router.put('/:id/equiper', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const titreEquipe = await GamificationService.equipTitle(req.user.id, id);
    res.json({
      message: `Titre "${titreEquipe.Titre.nom}" équipé`,
      titre: titreEquipe
    });
  } catch (error) {
    console.error(`Erreur PUT /api/gamification/titres/${req.params.id}/equiper:`, error);
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * PUT /api/gamification/titres/desequiper
 * Déséquiper le titre actuel.
 */
router.put('/desequiper', verifierToken, async (req, res) => {
  try {
    await GamificationService.unequipAllTitles(req.user.id);
    res.json({ message: 'Titre déséquipé' });
  } catch (error) {
    console.error('Erreur PUT /api/gamification/titres/desequiper:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
