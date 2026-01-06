const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin } = require('../../middleware/auth');
const DashboardService = require('../../services/DashboardService');

/**
 * GET /api/prof/dashboard/matrix
 * Récupère la matrice de progression (bulk) pour tous les élèves du prof
 * Query params:
 *   - groupe_id (optionnel): Filtrer par groupe spécifique
 *
 * Performance: 1 seule requête SQL au lieu de N requêtes (1 par élève)
 */
router.get('/matrix', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { groupe_id } = req.query;
    const professeurId = req.user.id;

    const matrix = await DashboardService.getProgressionMatrix(
      professeurId,
      groupe_id ? parseInt(groupe_id) : null
    );

    res.json({ matrix });

  } catch (err) {
    console.error('Erreur GET /prof/dashboard/matrix:', err);

    if (err.message === 'Groupe non trouvé') {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * GET /api/prof/dashboard/stats-globales
 * Récupère les statistiques globales pour alimenter les graphiques
 *
 * Retourne:
 *   - moyennes_par_discipline: Score moyen (% de réussite) par discipline
 *   - activite_hebdomadaire: Nombre de tentatives par jour de la semaine
 */
router.get('/stats-globales', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const professeurId = req.user.id;

    const stats = await DashboardService.getStatsGlobales(professeurId);

    res.json(stats);

  } catch (err) {
    console.error('Erreur GET /prof/dashboard/stats-globales:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

module.exports = router;
