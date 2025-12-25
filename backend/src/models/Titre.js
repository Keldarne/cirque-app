// Modèle Titre
// Représente un titre déblocable (ex: "Maître de Piste", "Acrobate")
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Titre = sequelize.define('Titre', {
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  couleur: {
    type: DataTypes.STRING(7), // Format hex
    allowNull: false,
    defaultValue: '#757575'
  },
  condition_type: {
    type: DataTypes.ENUM('niveau', 'xp_total', 'badges_obtenus', 'figures_validees', 'manuel'),
    allowNull: false
  },
  condition_valeur: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  rarete: {
    type: DataTypes.ENUM('commun', 'rare', 'epique', 'legendaire'),
    allowNull: false,
    defaultValue: 'commun'
  },
  // Multi-tenant: Titre public ou spécifique à une école
  ecole_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Ecoles',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'NULL = titre public (tous), sinon ID école (privé)'
  }
}, {
  tableName: 'Titres',
  timestamps: true
});

module.exports = Titre;
