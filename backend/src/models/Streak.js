// Modèle Streak
// Représente la série de connexions/activités consécutives d'un utilisateur
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Streak = sequelize.define('Streak', {
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Utilisateurs',
      key: 'id'
    }
  },
  jours_consecutifs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  record_personnel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  derniere_activite: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  streak_freeze_disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Streaks',
  timestamps: true,
  indexes: [
    {
      name: 'idx_derniere_activite',
      fields: ['derniere_activite']
    }
  ]
});

// Méthode pour vérifier et mettre à jour le streak
Streak.prototype.verifierEtMettreAJour = async function() {
  const aujourdhui = new Date().toISOString().split('T')[0];
  const hier = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!this.derniere_activite) {
    // Première activité
    this.jours_consecutifs = 1;
    this.derniere_activite = aujourdhui;
  } else if (this.derniere_activite === aujourdhui) {
    // Déjà compté aujourd'hui
    return false;
  } else if (this.derniere_activite === hier) {
    // Consécutif !
    this.jours_consecutifs += 1;
    this.derniere_activite = aujourdhui;
    if (this.jours_consecutifs > this.record_personnel) {
      this.record_personnel = this.jours_consecutifs;
    }
  } else {
    // Streak cassé
    this.jours_consecutifs = 1;
    this.derniere_activite = aujourdhui;
  }

  await this.save();
  return true;
};

module.exports = Streak;
