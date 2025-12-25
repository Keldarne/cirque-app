// Modèle Utilisateur
// Représente un utilisateur de l'application
// Champs principaux:
// - pseudo: identifiant public unique
// - email: unique
// - mot_de_passe: hashé via hooks beforeCreate/beforeUpdate
// - role: 'standard', 'professeur' ou 'admin'
// - xp, niveau: pour système de progression
//
// Hooks:
// - beforeCreate / beforeUpdate : hash le mot de passe si nécessaire (bcrypt)
// Scopes:
// - defaultScope : exclut le champ mot_de_passe pour les requêtes par défaut
// - withPassword : inclut mot_de_passe quand on en a besoin (ex: authentification)
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize'); // Import Op
const { getRequestContext } = require('../utils/requestContext'); // Import getRequestContext

const Utilisateur = sequelize.define('Utilisateur', {
  pseudo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { len: [3, 50] }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false
    // stockage hashé via hooks ci-dessous
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: true
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('standard', 'professeur', 'admin', 'school_admin', 'eleve'),
    allowNull: false,
    defaultValue: 'standard'
  },
  xp_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  niveau: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  // Multi-tenant: Lien vers l'école (NULL pour solo users et admins globaux)
  ecole_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Ecoles',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'NULL = solo user ou admin global, sinon ID de l\'école'
  }
}, {
  tableName: 'Utilisateurs',
  timestamps: true,
  hooks: {
    async beforeCreate(user) {
      // Hash le mot de passe s'il est en clair (ne commence pas par $2b$ qui est le préfixe bcrypt)
      if (user.mot_de_passe && !user.mot_de_passe.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, salt);
      }
    },
    async beforeUpdate(user) {
      // Ne re-hash que si le mot de passe a changé et qu'il est en clair
      if (user.changed('mot_de_passe') && user.mot_de_passe && !user.mot_de_passe.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, salt);
      }
    },
    beforeFind: (options) => {
      const userContext = getRequestContext();
      // IMPORTANT: Si pas de contexte (seed, scripts), ne pas filtrer
      if (!userContext) {
        return; // Pas de filtrage si pas de contexte
      }

      if (userContext.role === 'admin' && userContext.ecole_id === null) {
        // Master admin sees everything, do not apply any filter
        return;
      } else if (userContext.ecole_id) {
        // User belongs to a school (prof, school_admin, eleve from a school)
        // They see users from their own school OR solo users (ecole_id: null)
        options.where = {
          ...options.where,
          [Op.or]: [
            { ecole_id: userContext.ecole_id },
            { ecole_id: null }
          ]
        };
      } else {
        // Solo user (ecole_id: null, not admin)
        // They should only see themselves and other solo users (ecole_id: null)
        options.where = {
          ...options.where,
          ecole_id: null
        };
      }
    }
  },
  defaultScope: {
    attributes: { exclude: ['mot_de_passe'] }
  },
  scopes: {
    withPassword: {
      attributes: {
        include: ['mot_de_passe']
      }
    }
  }
});

// Méthode d’instance pour vérifier le mot de passe
Utilisateur.prototype.verifierMotDePasse = async function(plainPassword) {
  return bcrypt.compare(plainPassword, this.mot_de_passe);
};

module.exports = Utilisateur;