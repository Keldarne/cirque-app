const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

/**
 * Modèle ExerciceFigure
 * Représente la relation many-to-many entre Figures (exercices décomposés).
 * Permet à une figure d'avoir d'autres figures comme exercices prérequis.
 */
const ExerciceFigure = sequelize.define('ExerciceFigure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  figure_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Figures',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'La figure composite (celle qui contient les exercices)'
  },
  exercice_figure_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Figures',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'La figure qui sert d\'exercice prérequis'
  },
  ordre: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1 },
    comment: 'Ordre de l\'exercice dans la séquence d\'apprentissage'
  },
  est_requis: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'true = obligatoire pour le score, false = optionnel'
  },
  poids: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1, max: 3 },
    comment: 'Poids de l\'exercice pour le calcul du score (1=faible, 3=élevé)'
  }
}, {
  tableName: 'ExercicesFigure',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['figure_id', 'exercice_figure_id'],
      name: 'unique_exercice'
    },
    {
      fields: ['figure_id', 'ordre'],
      name: 'idx_figure_ordre'
    }
  ]
});

module.exports = ExerciceFigure;
