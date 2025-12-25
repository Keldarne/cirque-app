const express = require('express');
const router = express.Router();
const { verifierToken } = require('../../middleware/auth');
const GamificationService = require('../../services/GamificationService');

/**
 * GET /api/gamification/badges
 * Récupère tous les badges et leur statut d'obtention pour l'utilisateur connecté.
 * Accepte les filtres `categorie` and `rarete`.
 */
router.get('', verifierToken, async (req, res) => {
  try {
    const { categorie, rarete } = req.query;
    const badges = await GamificationService.getAllBadges(req.user.id, { categorie, rarete });
    res.json({ badges });
  } catch (error) {
    console.error('Erreur GET /api/gamification/badges:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/gamification/badges/utilisateur
 * Lister les badges spécifiquement obtenus par l'utilisateur connecté.
 * NOTE: Le chemin a été changé de `/utilisateur/badges` à `/badges/utilisateur` pour
 * une meilleure cohérence RESTful sous le préfixe `/gamification`.
 */
router.get('/utilisateur', verifierToken, async (req, res) => {
  try {
    const badges = await GamificationService.getObtainedBadges(req.user.id);
    res.json({ badges });
  } catch (error) {
    console.error('Erreur GET /api/gamification/badges/utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * PUT /api/gamification/badges/:id/afficher
 * Mettre en avant ou masquer un badge pour l'utilisateur connecté.
 */
router.put('/:id/afficher', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { affiche } = req.body;

    const updatedBadge = await GamificationService.setBadgeDisplay(req.user.id, id, affiche);

    res.json({
      message: affiche ? 'Badge affiché avec succès' : 'Badge masqué avec succès',
      badge: updatedBadge
    });
  } catch (error)
   {
    console.error(`Erreur PUT /api/gamification/badges/${req.params.id}/afficher:`, error);
    // Gérer l'erreur spécifique si le badge n'est pas trouvé
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
