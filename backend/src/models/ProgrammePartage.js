/**
 * Modèle ProgrammePartage
 * Table de jonction POLYMORPHIQUE pour partager un programme
 * Supporte: élève → prof, élève → élève (peer), prof → prof
 *
 * Architecture optimisée avec gestion du cycle de vie (annulation, détachement)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const ProgrammePartage = sequelize.define('ProgrammePartage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  programme_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ProgrammesProf',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Programme partagé'
  },

  // Polymorphique: qui partage / qui reçoit
  shared_by_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Utilisateur qui partage le programme'
  },
  shared_with_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Utilisateur qui reçoit le partage'
  },

  // Type de partage
  type: {
    type: DataTypes.ENUM('prof', 'peer'),
    allowNull: false,
    defaultValue: 'prof',
    comment: 'prof = élève→prof, peer = élève↔élève ou prof↔prof'
  },

  // Dates et état
  date_partage: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Soft delete: false si partage annulé'
  },
  date_annulation: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'annulation du partage'
  },
  annule_par: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    },
    comment: 'Utilisateur qui a annulé le partage'
  },

  // Métadonnées
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message optionnel lors du partage'
  }
}, {
  tableName: 'ProgrammesPartages',
  timestamps: true,
  indexes: [
    {
      // Unique seulement si actif (permet de re-partager après annulation)
      unique: true,
      fields: ['programme_id', 'shared_with_id', 'actif'],
      name: 'unique_programme_partage_actif',
      where: { actif: true }
    },
    {
      fields: ['shared_with_id', 'actif'],
      name: 'idx_partages_recus'
    },
    {
      fields: ['shared_by_id', 'actif'],
      name: 'idx_partages_envoyes'
    },
    {
      fields: ['programme_id', 'actif'],
      name: 'idx_programme_partages'
    },
    {
      fields: ['type', 'actif'],
      name: 'idx_type_actif'
    }
  ]
});

module.exports = ProgrammePartage;
