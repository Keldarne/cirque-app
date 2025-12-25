const sequelize = require('../db');

// Import de TOUS les modèles pour que Sequelize connaisse leur définition
require('../src/models');

(async () => {
  try {
    console.log('⚠️ Suppression et recréation de la base en cours...');

    // Désactiver les contraintes de clés étrangères
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Drop + recreate toutes les tables
    await sequelize.sync({ force: true });

    // Réactiver les contraintes de clés étrangères
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Base de données réinitialisée avec les modèles mis à jour');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la réinitialisation :', err);
    process.exit(1);
  }
})();
