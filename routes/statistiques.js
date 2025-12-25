const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin } = require('../middleware/auth');
const StatsService = require('../services/StatsService');

/**
 * GET /api/statistiques/eleve/:id/securite
 * Obtenir le score de sécurité pour un élève
 */
router.get('/eleve/:id/securite', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Sécurité: Les utilisateurs ne peuvent voir que leurs propres stats (sauf admin/prof)
    if (req.user.role !== 'admin' &&
        req.user.role !== 'professeur' &&
        req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const score = await StatsService.calculerScoreSecurite(parseInt(id));
    res.json(score);
  } catch (error) {
    console.error('Erreur calcul score sécurité:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/statistiques/eleve/:id/decrochage
 * Obtenir la prédiction de décrochage pour un élève
 */
router.get('/eleve/:id/decrochage', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' &&
        req.user.role !== 'professeur' &&
        req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const decrochage = await StatsService.detecterDecrochage(parseInt(id));
    res.json(decrochage);
  } catch (error) {
    console.error('Erreur détection décrochage:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/statistiques/eleve/:id/polyvalence
 * Obtenir le radar de polyvalence pour un élève
 */
router.get('/eleve/:id/polyvalence', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' &&
        req.user.role !== 'professeur' &&
        req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const radar = await StatsService.calculerRadarPolyvalence(parseInt(id));
    res.json(radar);
  } catch (error) {
    console.error('Erreur calcul polyvalence:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/statistiques/eleve/:id/dashboard
 * Obtenir TOUTES les stats élève en un seul appel (optimisé pour page profil)
 */
router.get('/eleve/:id/dashboard', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin' &&
        req.user.role !== 'professeur' &&
        req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    // Exécuter les 3 KPIs en parallèle pour performance optimale
    const [securite, decrochage, polyvalence] = await Promise.all([
      StatsService.calculerScoreSecurite(parseInt(id)),
      StatsService.detecterDecrochage(parseInt(id)),
      StatsService.calculerRadarPolyvalence(parseInt(id))
    ]);

    res.json({
      securite,
      decrochage,
      polyvalence
    });
  } catch (error) {
    console.error('Erreur chargement dashboard élève:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/statistiques/prof/analytics
 * Obtenir les analytics complètes pour un professeur
 * (météo classe, figures bloquantes, élèves à risque)
 */
router.get('/prof/analytics', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const analytics = await StatsService.calculerStatistiquesProfesseur(req.user.id);
    res.json(analytics);
  } catch (error) {
    console.error('Erreur analytics professeur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
