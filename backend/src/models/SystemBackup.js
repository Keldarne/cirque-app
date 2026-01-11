/**
 * Modèle SystemBackup
 * Gère les métadonnées des backups de base de données
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const SystemBackup = sequelize.define('SystemBackup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Nom du fichier de backup (ex: backup_20260111_143025.sql)'
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Chemin complet du fichier de backup'
  },
  size_bytes: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Taille du fichier en octets'
  },
  type: {
    type: DataTypes.ENUM('manual', 'automatic'),
    allowNull: false,
    defaultValue: 'manual',
    comment: 'Type de backup (manuel par admin ou automatique par cron)'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true, // null pour les backups automatiques
    references: {
      model: 'utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'utilisateur ayant créé le backup (null si automatique)'
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'in_progress',
    comment: 'Statut du backup'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message d\'erreur si le backup a échoué'
  }
}, {
  tableName: 'system_backups',
  timestamps: true,
  updatedAt: false, // Les backups ne sont pas modifiés après création
  indexes: [
    {
      name: 'idx_type_created',
      fields: ['type', 'createdAt']
    },
    {
      name: 'idx_status',
      fields: ['status']
    }
  ]
});

module.exports = SystemBackup;
