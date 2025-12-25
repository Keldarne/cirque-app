const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin } = require('../../middleware/auth');
const {
  RelationProfEleve,
  Utilisateur,
  Groupe,
  GroupeEleve,
  Streak
} = require('../../models');
const { Op } = require('sequelize');
const InteractionService = require('../../services/InteractionService');
const ProfService = require('../../services/ProfService');

router.get('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    // Récupérer tous les élèves (école-based + relations)
    const elevesResult = await ProfService.getElevesByProfId(req.user.id);
    const totalEleves = elevesResult.eleves ? elevesResult.eleves.length : 0;
    const eleveIds = elevesResult.eleves ? elevesResult.eleves.map(e => e.id) : [];

    // Nombre de groupes
    const totalGroupes = await Groupe.count({
      where: {
        professeur_id: req.user.id,
        actif: true
      }
    });

    // Activité récente (élèves actifs cette semaine)
    const uneSeMAINE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const elevesActifs = await Streak.count({
      where: {
        utilisateur_id: { [Op.in]: eleveIds },
        derniere_activite: {
          [Op.gte]: uneSeMAINE.toISOString().split('T')[0]
        }
      }
    });

    // XP total de tous les élèves
    const eleveStats = await Utilisateur.findAll({
      where: { id: { [Op.in]: eleveIds } },
      attributes: ['xp_total']
    });

    const xpTotal = eleveStats.reduce((sum, e) => sum + (e.xp_total || 0), 0);

    res.json({
      statistiques: {
        total_eleves: totalEleves,
        total_groupes: totalGroupes,
        eleves_actifs_semaine: elevesActifs,
        xp_total_eleves: xpTotal,
        moyenne_xp_par_eleve: totalEleves > 0 ? Math.round(xpTotal / totalEleves) : 0
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/prof/statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/prof/statistiques/eleves-negliges
 * Récupère la liste des élèves négligés (sans interaction depuis X jours)
 *
 * Query params:
 * - seuil_jours: Nombre de jours sans interaction (défaut: 30)
 * - limit: Nombre max de résultats (défaut: 10)
 */
router.get('/eleves-negliges', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { seuil_jours = 30, limit = 10 } = req.query;

    const stats = await InteractionService.getElevesNegliges(
      req.user.id,
      parseInt(seuil_jours)
    );

    res.json({
      total_eleves: stats.total_eleves,
      negliges_count: stats.negliges_count,
      taux_neglige: stats.taux_neglige,
      seuil_jours: parseInt(seuil_jours),
      eleves: stats.eleves.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur GET /api/prof/statistiques/eleves-negliges:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/prof/statistiques/engagement
 * Récupère les statistiques d'engagement du professeur
 */
router.get('/engagement', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const stats = await InteractionService.getEngagementStats(req.user.id);

    res.json({
      statistiques_engagement: stats
    });
  } catch (error) {
    console.error('Erreur GET /api/prof/statistiques/engagement:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/prof/statistiques/interactions/:eleveId
 * Récupère l'historique des interactions avec un élève spécifique
 *
 * Query params:
 * - limit: Nombre max de résultats (défaut: 20)
 */
router.get('/interactions/:eleveId', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { eleveId } = req.params;
    const { limit = 20 } = req.query;

    // Vérifier que l'élève appartient bien au prof
    const relation = await RelationProfEleve.findOne({
      where: {
        professeur_id: req.user.id,
        eleve_id: eleveId,
        statut: 'accepte'
      }
    });

    if (!relation) {
      return res.status(403).json({
        error: 'Vous ne pouvez consulter que les interactions avec vos élèves'
      });
    }

    const interactions = await InteractionService.getInteractionHistory(
      req.user.id,
      parseInt(eleveId),
      parseInt(limit)
    );

    res.json({
      eleve_id: parseInt(eleveId),
      total_interactions: interactions.length,
      interactions
    });
  } catch (error) {
    console.error('Erreur GET /api/prof/statistiques/interactions:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
