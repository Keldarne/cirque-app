// Modèle ProgressionEtape (Refactorisé)
// Représente l'état d'une étape pour un utilisateur. C'est la source de vérité.
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const ProgressionEtape = sequelize.define('ProgressionEtape', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Utilisateurs', key: 'id' }
  },
  etape_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'EtapeProgressions', key: 'id' }
  },
  statut: {
    type: DataTypes.ENUM('non_commence', 'en_cours', 'valide'),
    defaultValue: 'non_commence',
    allowNull: false,
    comment: 'Statut de la progression de l\'utilisateur sur cette étape spécifique.'
  },
  date_validation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lateralite: {
    type: DataTypes.ENUM('gauche', 'droite', 'bilateral', 'non_applicable'),
    defaultValue: 'non_applicable',
    allowNull: false,
    comment: 'Côté validé pour cette étape, si applicable.'
  },
  valide_par_prof_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Utilisateurs', key: 'id' },
    comment: 'ID du professeur qui a validé l\'étape.'
  },
  decay_level: {
    type: DataTypes.ENUM('fresh', 'warning', 'critical', 'forgotten'),
    allowNull: false,
    defaultValue: 'fresh',
    comment: 'Niveau de dégradation de la mémoire pour cette étape'
  }
}, {
  tableName: 'ProgressionEtapes',
  indexes: [
    {
      unique: true,
      fields: ['utilisateur_id', 'etape_id'],
      name: 'unique_user_etape'
    },
    {
      name: 'idx_utilisateur_statut',
      fields: ['utilisateur_id', 'statut']
    },
    {
      name: 'idx_statut_validation',
      fields: ['statut', 'date_validation']
    },
    {
      name: 'idx_decay_level',
      fields: ['decay_level']
    }
  ]
});

module.exports = ProgressionEtape;