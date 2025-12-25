const express = require('express');
const router = express.Router();
const { Figure, Discipline } = require('../models');
const { verifierToken } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', verifierToken, async (req, res) => {
  try {
    const { discipline_id, createur_id } = req.query;
    const where = {};

    if (discipline_id) {
      where.discipline_id = discipline_id;
    }

    if (createur_id) {
      if (createur_id === 'me') {
        where.createur_id = req.user.id;
      } else {
        where.createur_id = parseInt(createur_id);
      }
    }
    
    // Filtre multi-tenant:
    // Un utilisateur voit les figures publiques (ecole_id: null) ET celles de son école.
    const userEcoleId = req.user.ecole_id;
    if (userEcoleId) {
      where[Op.or] = [
        { ecole_id: null },
        { ecole_id: userEcoleId }
      ];
    } else {
      // Si l'utilisateur n'est pas rattaché à une école (admin, solo), il ne voit que le catalogue public.
      where.ecole_id = null;
    }

    const figures = await Figure.findAll({
      where,
      include: [Discipline],
      attributes: ['id', 'nom', 'descriptif', 'image_url', 'video_url', 'discipline_id', 'createur_id', 'ecole_id', 'createdAt', 'updatedAt']
    });

    res.json(figures);
  } catch (err) {
    console.error('Erreur GET /figures:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const figure = await Figure.findByPk(id, {
      include: [Discipline]
    });

    if (!figure) {
      return res.status(404).json({ error: 'Figure non trouvée' });
    }

    res.json({ figure });
  } catch (err) {
    console.error('Erreur GET /figures/:id:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

router.get('/:id/etapes', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { EtapeProgression } = require('../models');

    const etapes = await EtapeProgression.findAll({
      where: { figure_id: id },
      order: [['ordre', 'ASC']]
    });

    res.json(etapes);
  } catch (err) {
    console.error('Erreur GET /figures/:id/etapes:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * ⚠️ ROUTE SUPPRIMÉE POUR SÉCURITÉ
 *
 * Anciennement: POST / (créer une figure sans authentification)
 *
 * Cette route a été supprimée car elle permettait à n'importe qui de créer
 * des figures sans authentification, ce qui est une faille de sécurité.
 *
 * Utiliser à la place: POST /admin/figures (avec authentification)
 * Voir: routes/admin.js:40
 *
 * Date de suppression: 2025-11-22
 * Raison: Faille de sécurité identifiée lors de l'audit de couverture des tests
 */

module.exports = router;