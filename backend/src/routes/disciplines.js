const express = require('express');
const router = express.Router();
const { Discipline, Figure } = require('../models');
const { verifierToken } = require('../middleware/auth');

router.get('/', verifierToken, async (req, res) => {
  try {
    const disciplines = await Discipline.findAll();
    res.json(disciplines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', verifierToken, async (req, res) => {
  try {
    const discipline = await Discipline.findByPk(req.params.id, {
      include: [Figure]
    });
    res.json(discipline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ⚠️ ROUTE SUPPRIMÉE POUR SÉCURITÉ
 *
 * Anciennement: POST / (créer une discipline sans authentification)
 *
 * Cette route a été supprimée car elle permettait à n'importe qui de créer
 * des disciplines sans authentification, ce qui est une faille de sécurité.
 *
 * Utiliser à la place: POST /admin/disciplines (avec authentification admin)
 * Voir: routes/admin.js:18
 *
 * Date de suppression: 2025-11-22
 * Raison: Faille de sécurité identifiée lors de l'audit de couverture des tests
 */

module.exports = router;