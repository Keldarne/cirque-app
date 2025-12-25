// Modèle BadgeUtilisateur
// Représente un badge obtenu par un utilisateur
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const BadgeUtilisateur = sequelize.define('BadgeUtilisateur', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  badge_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Badges',
      key: 'id'
    }
  },
  date_obtention: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  affiche: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'BadgeUtilisateur',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['utilisateur_id', 'badge_id']
    }
  ]
});

module.exports = BadgeUtilisateur;
