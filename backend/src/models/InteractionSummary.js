// Modèle InteractionSummary
// Représente un résumé mensuel des interactions prof-élève pour archivage
// Permet de nettoyer les anciennes interactions tout en gardant les statistiques
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const InteractionSummary = sequelize.define('InteractionSummary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  professeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  eleve_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  annee: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mois: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_interactions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  derniere_interaction_type: {
    type: DataTypes.ENUM(
      'view_profile',
      'add_comment',
      'validate_step',
      'send_message',
      'update_notes'
    ),
    allowNull: true
  }
}, {
  tableName: 'InteractionSummaries',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['professeur_id', 'eleve_id', 'annee', 'mois']
    },
    {
      fields: ['eleve_id', 'annee', 'mois']
    }
  ]
});

module.exports = InteractionSummary;
