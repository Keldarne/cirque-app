// Modèle EtapeProgression
// Représente une étape structurée (titre, description, xp, ordre, vidéo) appartenant à une Figure.
// Champs importants:
// - figure_id : clé étrangère vers la table Figures
// - titre, description : contenu de l'étape
// - xp : valeur en XP gagnés à la validation
// - ordre : position de l'étape dans la séquence
// Les associations (hasMany/belongsTo) sont définies dans models/index.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const EtapeProgression = sequelize.define('EtapeProgression', {
  figure_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Figures',
      key: 'id'
    }
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('theorique', 'pratique'),
    allowNull: false,
    defaultValue: 'pratique',
    comment: 'Définit si l\'étape est théorique (à lire) ou pratique (à faire).'
  },
  xp: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  video_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ordre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  seuil_echecs_critique: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Nombre d\'échecs consécutifs avant alerte prof (configurable par figure)'
  }
}, {
  tableName: 'EtapeProgressions',
  indexes: [
    {
      name: 'idx_figure_ordre',
      fields: ['figure_id', 'ordre']
    }
  ]
});

module.exports = EtapeProgression;
