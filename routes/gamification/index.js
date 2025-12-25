const express = require('express');
const router = express.Router();

// Sous-routeurs gamification
router.use('/badges', require('./badges'));
router.use('/titres', require('./titres'));
router.use('/defis', require('./defis'));
router.use('/streaks', require('./streaks'));
router.use('/classements', require('./classements'));
router.use('/statistiques', require('./statistiques'));

module.exports = router;
