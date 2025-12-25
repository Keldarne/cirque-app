const express = require('express');
const router = express.Router();

// Import des sous-routes (chacune doit exporter un router Express)
const utilisateurRoutes = require('./utilisateurs');
const figureRoutes = require('./figures');
const progressionRoutes = require('./progression');
const disciplineRoutes = require('./disciplines');
const adminRoutes = require('./admin');
const profRoutes = require('./prof');
const gamificationRoutes = require('./gamification');
const statistiquesRoutes = require('./statistiques');
const entrainementRoutes = require('./entrainement');


// Montage des routes
router.use('/utilisateurs', utilisateurRoutes);
router.use('/figures', figureRoutes);
router.use('/progression', progressionRoutes);
router.use('/disciplines', disciplineRoutes);
router.use('/admin', adminRoutes);
router.use('/prof', profRoutes);
router.use('/statistiques', statistiquesRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/entrainement', entrainementRoutes);


// Export du router principal
module.exports = router;