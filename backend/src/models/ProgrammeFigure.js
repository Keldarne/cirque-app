/**
 * Modèle ProgrammeFigure
 * Table de jonction entre Programme et Figure
 * Contient l'ordre d'affichage des figures dans un programme
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ProgrammeFigure = sequelize.define('ProgrammeFigure', {
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
  figure_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Figures',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  ordre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Position dans le programme'
  }
}, {
  tableName: 'ProgrammesFigures',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['programme_id', 'figure_id'],
      name: 'unique_programme_figure'
    }
  ]
});

module.exports = ProgrammeFigure;
