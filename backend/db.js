const { Sequelize } = require('sequelize');

// Charger dotenv uniquement si DB_HOST n'est pas déjà défini (développement local)
if (!process.env.DB_HOST) {
  require('dotenv').config();
}

// Configuration depuis les variables d'environnement
const sequelize = new Sequelize(
  process.env.DB_NAME || 'cirque_app_dev',
  process.env.DB_USER || 'cirque_user',
  process.env.DB_PASSWORD || 'motdepassefort',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: parseInt(process.env.DB_PORT) || 3306,
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);


module.exports = sequelize;