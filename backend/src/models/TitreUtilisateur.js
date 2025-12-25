// Modèle TitreUtilisateur
// Représente un titre obtenu et possiblement équipé par un utilisateur
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const TitreUtilisateur = sequelize.define('TitreUtilisateur', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  titre_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Titres',
      key: 'id'
    }
  },
  date_obtention: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  equipe: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'TitreUtilisateur',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['utilisateur_id', 'titre_id']
    }
  ]
});

module.exports = TitreUtilisateur;
