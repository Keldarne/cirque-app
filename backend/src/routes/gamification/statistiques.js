const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middleware/auth');
const GamificationService = require('../../services/GamificationService');

/**
 * GET /api/gamification/statistiques/utilisateur/profil-gamification
 * Récupère un résumé complet du profil de gamification de l'utilisateur.
 */
router.get('/utilisateur/profil-gamification', verifierToken, async (req, res) => {
  try {
    const profil = await GamificationService.getGamificationProfile(req.user);
    res.json({ profil });
  } catch (error) {
    console.error('Erreur GET /api/gamification/statistiques/utilisateur/profil-gamification:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
