// Modèle GroupeEleve
// Représente l'appartenance d'un élève à un groupe
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const GroupeEleve = sequelize.define('GroupeEleve', {
  groupe_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Groupes',
      key: 'id'
    }
  },
  eleve_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  date_ajout: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'GroupeEleve',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupe_id', 'eleve_id']
    }
  ]
});

module.exports = GroupeEleve;
