// Modèle DefiUtilisateur
// Représente la participation d'un utilisateur à un défi
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const DefiUtilisateur = sequelize.define('DefiUtilisateur', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  defi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Defis',
      key: 'id'
    }
  },
  progression: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  complete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date_completion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'DefiUtilisateur',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['utilisateur_id', 'defi_id']
    },
    {
      name: 'idx_complete_date',
      fields: ['complete', 'date_completion']
    }
  ]
});

module.exports = DefiUtilisateur;
