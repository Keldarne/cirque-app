// Modèle TitreUtilisateur
// Représente un titre obtenu et possiblement équipé par un utilisateur
const { DataTypes, Op } = require('sequelize');
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
  ],
  hooks: {
    async beforeCreate(titreUser, options) {
      if (titreUser.equipe) {
        await TitreUtilisateur.update(
          { equipe: false },
          {
            where: {
              utilisateur_id: titreUser.utilisateur_id,
              equipe: true
            },
            transaction: options.transaction
          }
        );
      }
    },
    async beforeUpdate(titreUser, options) {
      if (titreUser.changed('equipe') && titreUser.equipe) {
        await TitreUtilisateur.update(
          { equipe: false },
          {
            where: {
              utilisateur_id: titreUser.utilisateur_id,
              equipe: true,
              id: { [Op.ne]: titreUser.id }
            },
            transaction: options.transaction
          }
        );
      }
    }
  }
});

module.exports = TitreUtilisateur;
