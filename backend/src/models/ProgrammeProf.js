/**
 * Modèle ProgrammeProf
 * Programmes personnalisés créés par les professeurs
 * Contient une liste ordonnée de figures
 * Peut être enregistré comme modèle réutilisable (est_modele=true)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const { Op } = require('sequelize'); // Import Op
const { getRequestContext } = require('../utils/requestContext'); // Import getRequestContext

const ProgrammeProf = sequelize.define('ProgrammeProf', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  professeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  est_modele: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Programme réutilisable comme template'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'ProgrammesProf',
  timestamps: true,
  indexes: [
    {
      name: 'idx_programmes_prof',
      fields: ['professeur_id', 'actif']
    }
  ],
  hooks: {
    beforeFind: (options) => {
      const userContext = getRequestContext();
      if (userContext) {
        if (userContext.role === 'admin' && userContext.ecole_id === null) {
          // Master admin sees everything, do not apply any filter
          return;
        } else if (userContext.role === 'professeur' || userContext.role === 'school_admin') {
          // Prof or School Admin should only see programs they created OR global models OR shared with them
          // Note: Programs shared with them are handled via include in the query
          options.where = {
            ...options.where,
            [Op.or]: [
              { professeur_id: userContext.id }, // Programs they created
              { est_modele: true }                // Global models (templates)
            ]
          };

          // Add subquery to include programs shared via ProgrammePartage
          // This will be handled at the route level with explicit includes
          // The hook ensures base filtering, routes add shared programs separately
        } else {
          // Eleve or standard user should only see models marked as 'est_modele: true'
          // OR programs they created themselves (personal programs)
          options.where = {
            ...options.where,
            [Op.or]: [
              { est_modele: true },
              { professeur_id: userContext.id }
            ]
          };
        }
      } else {
        // No user context (public route), only show global models
        options.where = {
          ...options.where,
          est_modele: true
        };
      }
    }
  }
});

module.exports = ProgrammeProf;
