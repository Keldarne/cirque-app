const { Sequelize } = require('sequelize');

// ⚠️ Remplace par tes infos Infomaniak
const sequelize = new Sequelize(
    'cirque_app_dev',     // nom de la base
  'cirque_user',        // utilisateur
  'motdepassefort',    // mot de passe
  {
    host: 'localhost', // ou l'adresse du serveur Infomaniak
    dialect: 'mysql',
    port: 3306,
    logging: false
  }
);


module.exports = sequelize;