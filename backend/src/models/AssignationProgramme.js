/**
 * Modèle AssignationProgramme
 * Assignation d'un programme à un élève spécifique
 * Le professeur peut suivre le statut (en_cours, termine)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const AssignationProgramme = sequelize.define('AssignationProgramme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  programme_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ProgrammesProf',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  eleve_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  date_assignation: {
    type: DataTypes.DATE,
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('en_cours', 'termine'),
    defaultValue: 'en_cours'
  },
  source_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'direct',
    validate: {
      isIn: [['direct', 'groupe']]
    },
    comment: 'Indique si l\'assignation est directe ou via un groupe'
  },
  source_groupe_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Groupes',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID du groupe source si source_type = "groupe"'
  },

  // Nouveau: Traçabilité du partage source
  source_partage_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ProgrammesPartages',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID du partage source si le programme a été partagé par un élève'
  },

  // Gestion du cycle de vie (détachement)
  source_detachee: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'true si le partage source a été annulé'
  },
  note_detachement: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison du détachement (ex: "Partage annulé par l\'élève le...")'
  }
}, {
  tableName: 'AssignationsProgramme',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['programme_id', 'eleve_id'],
      name: 'unique_assignation'
    },
    {
      fields: ['eleve_id', 'statut'],
      name: 'idx_assignations_eleve'
    },
    {
      fields: ['source_type', 'source_groupe_id'],
      name: 'idx_ap_source'
    }
  ]
});

module.exports = AssignationProgramme;
