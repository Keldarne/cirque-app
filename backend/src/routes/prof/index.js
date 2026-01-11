const express = require('express');
const router = express.Router();

// Sous-routeurs
router.use('/eleves', require('./eleves'));
router.use('/groupes', require('./groupes'));
router.use('/statistiques', require('./statistiques'));
router.use('/programmes', require('./programmes'));
router.use('/dashboard', require('./dashboard'));
router.use('/suggestions', require('./suggestions'));
router.use('/validation', require('./validation'));
router.use('/figures', require('./figures')); // Gestion catalogue figures

module.exports = router;
