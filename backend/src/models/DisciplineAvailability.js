// Table de jonction école-discipline avec configuration
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const DisciplineAvailability = sequelize.define('DisciplineAvailability', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ecole_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Ecoles', key: 'id' }
    },
    discipline_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Disciplines', key: 'id' }
    },
    actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,  // OPT-IN: désactivé par défaut
      allowNull: false
    },
    ordre: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Ordre d\'affichage pour cette école'
    },
    config: {
      type: DataTypes.JSON,
      defaultValue: null,
      comment: 'Configuration spécifique école (future extension)'
    }
  }, {
    tableName: 'discipline_availability',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['ecole_id', 'discipline_id'] },
      { fields: ['ecole_id'] },
      { fields: ['discipline_id'] }
    ]
  });

module.exports = DisciplineAvailability;
