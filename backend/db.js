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
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // Configuration du pool de connexions pour production
    pool: process.env.NODE_ENV === 'production' ? {
      max: 10,        // Maximum de connexions
      min: 2,         // Minimum de connexions
      acquire: 30000, // Timeout acquisition (30s)
      idle: 10000     // Timeout idle (10s)
    } : {
      max: 5,         // Moins de connexions en dev
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);


module.exports = sequelize;