// Modèle Groupe
// Représente une classe ou un groupe d'élèves géré par un professeur
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { Op } = require('sequelize'); // Import Op
const { getRequestContext } = require('../utils/requestContext'); // Import getRequestContext

const Groupe = sequelize.define('Groupe', {
  professeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  couleur: {
    type: DataTypes.STRING(7), // Format hex
    allowNull: false,
    defaultValue: '#1976d2'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Groupes',
  timestamps: true,
  indexes: [
    {
      fields: ['professeur_id']
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
          // Prof or School Admin should only see groups they own (professeur_id matches their ID)
          options.where = {
            ...options.where,
            professeur_id: userContext.id
          };
        } else {
          // Eleve or standard user, or school admin trying to see other school's groups
          // should not see groups via this general find.
          options.where = {
            ...options.where,
            id: null // Effectively returns no groups
          };
        }
      } else {
        // No user context (public route), no groups visible
        options.where = {
          ...options.where,
          id: null // Effectively returns no groups
        };
      }
    }
  }
});

module.exports = Groupe;
