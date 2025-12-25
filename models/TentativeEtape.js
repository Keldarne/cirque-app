// Modèle TentativeEtape (Refactorisé)
// Enregistre une tentative (réussie ou échouée) pour une étape de progression.
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TentativeEtape = sequelize.define('TentativeEtape', {
  progression_etape_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ProgressionEtapes',
      key: 'id'
    }
  },
  reussie: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: 'Indique si la tentative a été un succès ou un échec. Dérivé de score/duree pour compatibilité.'
  },
  type_saisie: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'binaire',
    validate: {
      isIn: {
        args: [['binaire', 'evaluation', 'duree', 'evaluation_duree']],
        msg: 'type_saisie doit être binaire, evaluation, duree ou evaluation_duree'
      }
    },
    comment: 'Mode d\'entraînement utilisé pour cette tentative'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 3
    },
    comment: 'Score auto-évaluation: 1=Échec, 2=Instable, 3=Maîtrisé (pour modes evaluation et evaluation_duree)'
  },
  duree_secondes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Durée de pratique en secondes (pour modes duree et evaluation_duree)'
  }
}, {
  tableName: 'TentativeEtapes',
  comment: 'Table pour le suivi du "Grit Score" avec support de modes d\'entraînement enrichis',
  validate: {
    dataIntegrity() {
      if (this.type_saisie === 'evaluation') {
        if (this.score == null || this.duree_secondes != null) {
          throw new Error('Mode evaluation requiert score (1-3) sans duree_secondes');
        }
      } else if (this.type_saisie === 'duree') {
        if (this.duree_secondes == null || this.score != null) {
          throw new Error('Mode duree requiert duree_secondes sans score');
        }
      } else if (this.type_saisie === 'evaluation_duree') {
        if (this.score == null || this.duree_secondes == null) {
          throw new Error('Mode evaluation_duree requiert BOTH score ET duree_secondes');
        }
      } else if (this.type_saisie === 'binaire') {
        if (this.score != null || this.duree_secondes != null) {
          throw new Error('Mode binaire ne peut avoir ni score ni duree_secondes');
        }
      }
    }
  }
});

module.exports = TentativeEtape;