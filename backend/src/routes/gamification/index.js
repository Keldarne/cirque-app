const express = require('express');
const router = express.Router();

// Sous-routeurs gamification
router.use('/streaks', require('./streaks'));
router.use('/statistiques', require('./statistiques'));

module.exports = router;
