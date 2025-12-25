// Modèle Defi
// Représente un défi disponible (quotidien, hebdomadaire ou événement)
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Defi = sequelize.define('Defi', {
  titre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('quotidien', 'hebdomadaire', 'evenement'),
    allowNull: false
  },
  objectif: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  objectif_type: {
    type: DataTypes.ENUM('etapes_validees', 'xp_gagnes', 'figures_validees', 'disciplines_pratiquees', 'streak_maintenu'),
    allowNull: false
  },
  objectif_valeur: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  xp_recompense: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date_debut: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  date_fin: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Multi-tenant: Défi public ou spécifique à une école
  ecole_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Ecoles',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'NULL = défi public (tous), sinon ID école (privé)'
  }
}, {
  tableName: 'Defis',
  timestamps: true
});

module.exports = Defi;
