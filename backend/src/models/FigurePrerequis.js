const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

/**
 * Modèle FigurePrerequis (anciennement ExerciceFigure)
 * Représente la relation many-to-many entre Figures (prérequis décomposés).
 * Permet à une figure d'avoir d'autres figures comme prérequis.
 *
 * Exemple: Figure "ATR mur" requiert "Gainage planche" et "Équilibre sur mains" comme prérequis.
 */
const FigurePrerequis = sequelize.define('FigurePrerequis', {
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
    comment: 'La figure principale (celle qui a des prérequis)'
  },
  exercice_figure_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Figures',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'La figure qui sert de prérequis'
  },
  ordre: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1 },
    comment: 'Ordre du prérequis dans la séquence d\'apprentissage'
  },
  est_requis: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'true = obligatoire pour le score de préparation, false = optionnel'
  },
  poids: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: { min: 1, max: 3 },
    comment: 'Poids du prérequis pour le calcul du score (1=faible, 3=élevé)'
  }
}, {
  tableName: 'ExercicesFigure', // Table name conservé pour compatibilité DB
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

module.exports = FigurePrerequis;
