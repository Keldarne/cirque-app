const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

/**
 * Modèle SuggestionFigure
 * Cache de performance pour les suggestions de figures.
 * Stocke les suggestions calculées pour éviter de recalculer à chaque requête.
 * Rafraîchi périodiquement par cron job (3h du matin).
 */
const SuggestionFigure = sequelize.define('SuggestionFigure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Utilisateurs', key: 'id' },
    onDelete: 'CASCADE',
    comment: 'ID utilisateur (NULL si suggestion de groupe)'
  },
  groupe_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Groupes', key: 'id' },
    onDelete: 'CASCADE',
    comment: 'ID groupe (NULL si suggestion individuelle)'
  },
  figure_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Figures', key: 'id' },
    onDelete: 'CASCADE',
    comment: 'Figure suggérée'
  },
  score_preparation: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0, max: 100 },
    comment: 'Score de préparation 0-100 (% d\'exercices validés pondéré)'
  },
  nb_exercices_valides: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Nombre d\'exercices prérequis déjà validés'
  },
  nb_exercices_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Nombre total d\'exercices prérequis (requis seulement)'
  },
  date_suggestion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Date de création de la suggestion'
  },
  date_expiration: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration du cache (recalculer après)'
  },
  statut: {
    type: DataTypes.ENUM('pending', 'accepted', 'dismissed'),
    defaultValue: 'pending',
    comment: 'pending = non traitée, accepted = ajoutée au programme, dismissed = masquée'
  }
}, {
  tableName: 'SuggestionsFigure',
  timestamps: true,
  indexes: [
    {
      fields: ['utilisateur_id', 'statut', 'score_preparation'],
      name: 'idx_user_suggestions'
    },
    {
      fields: ['groupe_id', 'statut', 'score_preparation'],
      name: 'idx_groupe_suggestions'
    },
    {
      fields: ['date_expiration'],
      name: 'idx_expiration'
    }
  ],
  validate: {
    // Validation: soit utilisateur_id soit groupe_id (pas les deux)
    eitherUserOrGroup() {
      if ((this.utilisateur_id && this.groupe_id) || (!this.utilisateur_id && !this.groupe_id)) {
        throw new Error('Une suggestion doit avoir soit utilisateur_id soit groupe_id (pas les deux)');
      }
    }
  }
});

module.exports = SuggestionFigure;
