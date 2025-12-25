const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middleware/auth');
const GamificationService = require('../../services/GamificationService');

/**
 * GET /api/gamification/defis/actifs
 * Récupère les défis actifs avec la progression de l'utilisateur.
 */
router.get('/actifs', verifierToken, async (req, res) => {
  try {
    const defis = await GamificationService.getActiveChallenges(req.user.id);
    res.json({ defis });
  } catch (error) {
    console.error('Erreur GET /api/gamification/defis/actifs:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/gamification/defis/utilisateur
 * Historique des défis de l'utilisateur ('en_cours' ou 'completes').
 */
router.get('/utilisateur', verifierToken, async (req, res) => {
  try {
    const { statut } = req.query;
    const defis = await GamificationService.getUserChallengeHistory(req.user.id, statut);
    res.json({ defis });
  } catch (error) {
    console.error('Erreur GET /api/gamification/defis/utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/gamification/defis/utilisateur/statistiques
 * Statistiques des défis de l'utilisateur.
 */
router.get('/utilisateur/statistiques', verifierToken, async (req, res) => {
  try {
    const statistiques = await GamificationService.getUserChallengeStats(req.user.id);
    res.json({ statistiques });
  } catch (error) {
    console.error('Erreur GET /api/gamification/defis/utilisateur/statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
