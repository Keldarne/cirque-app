// Modèle Figure
// Représente une figure / exercice dans une discipline
// Champs clés :
// - nom, descriptif : informations textuelles
// - image_url, video_url : médias optionnels pour démonstration
// - discipline_id : clé étrangère vers Discipline
// - createur_id : clé étrangère vers Utilisateur (professeur qui a créé la figure)
// Relations : définies ensuite dans models/index.js (Figure.belongsTo Discipline, a des EtapeProgression...)
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const { Op } = require('sequelize'); // Import Op for OR conditions
const { getRequestContext } = require('../utils/requestContext'); // Import for multi-tenancy context

const Figure = sequelize.define('Figure', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descriptif: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  video_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discipline_id: {   // <- clé étrangère vers Discipline
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createur_id: {     // <- clé étrangère vers Utilisateur (professeur créateur)
    type: DataTypes.INTEGER,
    allowNull: true  // Null pour les figures existantes créées avant ce système
  },
  difficulty_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Difficulté de 1 (très facile) à 5 (très difficile)'
  },
  type: {
    type: DataTypes.ENUM('artistique', 'renforcement'),
    allowNull: false,
    defaultValue: 'artistique',
    comment: 'Type: artistique (figure/mouvement) ou renforcement (conditionnement)'
  },
  // Multi-tenant: Catalogue public vs figures d'école
  ecole_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Ecoles',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'NULL = catalogue public (visible par tous), sinon ID de l\'école (privé)'
  },
  visibilite: {
    type: DataTypes.ENUM('public', 'ecole'),
    allowNull: false,
    defaultValue: 'public',
    comment: 'public = catalogue partagé, ecole = privé à l\'école'
  },
  lateralite_requise: {
    type: DataTypes.ENUM('unilateral', 'bilateral', 'non_applicable'),
    allowNull: false,
    defaultValue: 'non_applicable',
    comment: 'Défini si la figure nécessite validation gauche/droite séparée'
  }
}, {
  tableName: 'Figures',
  timestamps: true,
  indexes: [
    {
      name: 'idx_discipline_ecole_visibilite',
      fields: ['discipline_id', 'ecole_id', 'visibilite']
    },
    {
      name: 'idx_createur',
      fields: ['createur_id']
    }
  ]
});

module.exports = Figure;