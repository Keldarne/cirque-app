// Modèle RelationProfEleve
// Représente la relation entre un professeur et un élève
// Gère le système d'invitation et le suivi pédagogique
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const RelationProfEleve = sequelize.define('RelationProfEleve', {
  professeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
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
  statut: {
    type: DataTypes.ENUM('en_attente', 'accepte', 'refuse', 'bloque'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  code_invitation: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true
  },
  date_invitation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  date_acceptation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes_prof: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'RelationProfEleve',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['professeur_id', 'eleve_id']
    },
    {
      unique: true,
      fields: ['code_invitation'],
      where: {
        code_invitation: { [sequelize.Sequelize.Op.ne]: null }
      }
    }
  ]
});

// Méthode statique pour générer un code d'invitation unique
RelationProfEleve.genererCodeInvitation = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CIRQUE-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = RelationProfEleve;
