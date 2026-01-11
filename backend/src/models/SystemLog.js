/**
 * Modèle SystemLog
 * Stocke les logs système structurés pour l'administration
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  niveau: {
    type: DataTypes.ENUM('INFO', 'WARN', 'ERROR', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'INFO',
    comment: 'Niveau de sévérité du log'
  },
  categorie: {
    type: DataTypes.ENUM('API', 'AUTH', 'DATABASE', 'CRON', 'ADMIN_ACTION', 'SECURITY'),
    allowNull: false,
    comment: 'Catégorie du log pour filtrage'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Message descriptif du log'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Métadonnées additionnelles (utilisateur_id, ip, endpoint, method, error_stack, etc.)'
  }
}, {
  tableName: 'system_logs',
  timestamps: true,
  updatedAt: false, // Les logs ne sont jamais modifiés après création
  indexes: [
    {
      name: 'idx_niveau_created',
      fields: ['niveau', 'createdAt']
    },
    {
      name: 'idx_categorie_created',
      fields: ['categorie', 'createdAt']
    },
    {
      name: 'idx_created',
      fields: ['createdAt']
    }
  ]
});

module.exports = SystemLog;
