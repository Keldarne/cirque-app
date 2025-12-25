const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middleware/auth');
const GamificationService = require('../../services/GamificationService');

/**
 * GET /api/gamification/streaks/utilisateur
 * Récupère le statut de streak de l'utilisateur.
 */
router.get('/utilisateur', verifierToken, async (req, res) => {
  try {
    const streak = await GamificationService.getUserStreakStatus(req.user.id);
    res.json({ streak });
  } catch (error) {
    console.error('Erreur GET /api/gamification/streaks/utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
