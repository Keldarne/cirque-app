/**
 * Modèle InteractionProfEleve
 * Track toutes les interactions entre un professeur et ses élèves
 * Utilisé pour identifier les élèves négligés (sans interaction depuis X jours)
 *
 * Types d'interactions:
 * - view_profile: Consultation du profil élève
 * - add_comment: Ajout d'un commentaire
 * - validate_step: Validation d'une étape
 * - send_message: Envoi d'un message
 * - update_notes: Modification des notes prof
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const InteractionProfEleve = sequelize.define('InteractionProfEleve', {
  professeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    },
    comment: 'ID du professeur'
  },
  eleve_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    },
    comment: 'ID de l\'élève'
  },
  type_interaction: {
    type: DataTypes.ENUM(
      'view_profile',
      'add_comment',
      'validate_step',
      'send_message',
      'update_notes'
    ),
    allowNull: false,
    comment: 'Type d\'interaction entre le prof et l\'élève'
  },
  date_interaction: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de l\'interaction'
  },
  contexte: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Métadonnées: route, method, progression_id, etape_id'
  }
}, {
  timestamps: true,
  updatedAt: false, // Pas besoin de updatedAt, on utilise createdAt uniquement
  indexes: [
    {
      fields: ['professeur_id', 'date_interaction'],
      name: 'idx_interactions_prof_date'
    },
    {
      fields: ['eleve_id', 'date_interaction'],
      name: 'idx_interactions_eleve_date'
    }
  ]
});

module.exports = InteractionProfEleve;
