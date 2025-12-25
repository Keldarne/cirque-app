// Modèle Badge
// Représente un badge/récompense déblocable par les utilisateurs
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Badge = sequelize.define('Badge', {
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  icone: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  couleur: {
    type: DataTypes.STRING(7), // Format hex: #RRGGBB
    allowNull: false,
    defaultValue: '#1976d2'
  },
  categorie: {
    type: DataTypes.ENUM('progression', 'streak', 'social', 'maitrise', 'defi', 'special'),
    allowNull: false
  },
  condition_type: {
    type: DataTypes.ENUM(
      'xp_total',
      'figures_validees',
      'streak_jours',
      'etapes_jour',
      'perfectionniste',
      'discipline_complete',
      'premiere_fois',
      'manuel'
    ),
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
  xp_bonus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // Multi-tenant: Badge public ou spécifique à une école
  ecole_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Ecoles',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'NULL = badge public (tous), sinon ID école (privé)'
  }
}, {
  tableName: 'Badges',
  timestamps: true,
  indexes: [
    {
      name: 'idx_ecole',
      fields: ['ecole_id']
    },
    {
      name: 'idx_categorie',
      fields: ['categorie']
    }
  ]
});

module.exports = Badge;
