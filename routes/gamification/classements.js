const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middleware/auth');
const { verifierAccesGroupe } = require('../../middleware/groupeAuth');
const GamificationService = require('../../services/GamificationService');

/**
 * GET /api/gamification/classements/global
 * Classement global par XP total.
 */
router.get('/global', verifierToken, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const data = await GamificationService.getGlobalLeaderboard(req.user, limit, offset);
    res.json(data);
  } catch (error) {
    console.error('Erreur GET /api/gamification/classements/global:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/gamification/classements/hebdomadaire
 * Classement de la semaine (par XP gagnés cette semaine).
 */
router.get('/hebdomadaire', verifierToken, async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await GamificationService.getWeeklyLeaderboard(limit);
    res.json(data);
  } catch (error) {
    console.error('Erreur GET /api/gamification/classements/hebdomadaire:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/gamification/classements/groupe/:id
 * Classement d'un groupe spécifique, protégé par middleware.
 */
router.get('/groupe/:id', verifierToken, verifierAccesGroupe, async (req, res) => {
  try {
    const { id } = req.params;
    // Le middleware `verifierAccesGroupe` a déjà validé l'accès et attaché le groupe.
    const classement = await GamificationService.getGroupLeaderboard(id);

    res.json({
      groupe: {
        id: req.groupe.id,
        nom: req.groupe.nom,
        couleur: req.groupe.couleur
      },
      classement
    });
  } catch (error) {
    console.error(`Erreur GET /api/gamification/classements/groupe/${req.params.id}:`, error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
