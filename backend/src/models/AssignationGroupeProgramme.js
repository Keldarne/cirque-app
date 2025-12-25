/**
 * Modèle AssignationGroupeProgramme
 * Assignation d'un programme à un groupe entier
 * Les membres du groupe reçoivent automatiquement le programme via propagation
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const AssignationGroupeProgramme = sequelize.define('AssignationGroupeProgramme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Groupes',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  date_assignation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'AssignationsGroupeProgramme',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupe_id', 'programme_id'],
      name: 'unique_groupe_programme'
    },
    {
      fields: ['groupe_id'],
      name: 'idx_agp_groupe'
    },
    {
      fields: ['programme_id'],
      name: 'idx_agp_programme'
    }
  ]
});

module.exports = AssignationGroupeProgramme;
