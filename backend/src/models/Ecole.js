// Modèle École
// Représente une école de cirque ou un compte solo dans le système multi-tenant
// Champs principaux:
// - nom, slug: identification de l'école
// - plan: 'solo', 'basic', 'premium'
// - statut_abonnement: gestion du lifecycle de l'abonnement
// - max_eleves, max_professeurs: limites par plan
// - config: paramètres personnalisables (branding, notifications)
// - Stripe IDs: intégration paiement (Phase 2)
const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Ecole = sequelize.define('Ecole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { len: [3, 100] }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      is: /^[a-z0-9-]+$/  // Slug format: lowercase, numbers, hyphens
    }
  },

  // Plan et facturation
  plan: {
    type: DataTypes.ENUM('solo', 'basic', 'premium'),
    allowNull: false,
    defaultValue: 'basic'
  },
  type_facturation: {
    type: DataTypes.ENUM('mensuel', 'annuel'),
    allowNull: false,
    defaultValue: 'mensuel'
  },
  statut_abonnement: {
    type: DataTypes.ENUM('trial', 'actif', 'suspendu', 'annule', 'impaye'),
    allowNull: false,
    defaultValue: 'trial'
  },

  // Dates importantes
  date_fin_trial: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fin de la période d\'essai (14 jours)'
  },
  date_prochain_paiement: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date du prochain prélèvement'
  },

  // Montants et limites
  montant_mensuel: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Montant mensuel en euros'
  },
  max_eleves: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Nombre maximum d\'élèves autorisés'
  },
  max_professeurs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Nombre maximum de professeurs autorisés'
  },
  max_stockage_gb: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Stockage maximum en GB (kDrive)'
  },

  // État et activation
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'École active ou suspendue'
  },
  raison_suspension: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Raison de la suspension si statut = suspendu'
  },

  // Intégration Stripe (Phase 2)
  stripe_customer_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID client Stripe'
  },
  stripe_subscription_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID abonnement Stripe'
  },

  // Configuration personnalisable (JSON)
  config: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      couleur_theme: '#1976d2',
      logo_url: null,
      email_contact: null,
      notifications_email: true,
      notifications_push: false,
      fuseau_horaire: 'Europe/Paris'
    },
    comment: 'Paramètres personnalisables de l\'école'
  }
}, {
  tableName: 'Ecoles',
  timestamps: true,
  hooks: {
    beforeCreate(ecole) {
      // Définir les limites par plan si c'est un nouvel enregistrement
      if (ecole.isNewRecord) {
        switch (ecole.plan) {
          case 'solo':
            ecole.max_eleves = 1;  // Solo = utilisateur unique
            ecole.max_professeurs = 0;
            ecole.max_stockage_gb = 5;
            ecole.montant_mensuel = 9.00;
            break;
          case 'basic':
            ecole.max_eleves = 50;
            ecole.max_professeurs = 3;
            ecole.max_stockage_gb = 10;
            ecole.montant_mensuel = 29.00;
            break;
          case 'premium':
            ecole.max_eleves = 200;
            ecole.max_professeurs = 999;  // Illimité
            ecole.max_stockage_gb = 50;
            ecole.montant_mensuel = 79.00;
            break;
        }
      }

      // Appliquer réduction annuelle (-20%)
      if (ecole.type_facturation === 'annuel') {
        ecole.montant_mensuel = ecole.montant_mensuel * 0.8;
      }

      // Définir date fin trial (14 jours) si nouveau
      if (!ecole.date_fin_trial && ecole.statut_abonnement === 'trial') {
        const dateFin = new Date();
        dateFin.setDate(dateFin.getDate() + 14);
        ecole.date_fin_trial = dateFin;
      }

      // Définir date prochain paiement
      if (!ecole.date_prochain_paiement) {
        const dateProchain = new Date();
        if (ecole.statut_abonnement === 'trial') {
          dateProchain.setDate(dateProchain.getDate() + 14);
        } else {
          dateProchain.setMonth(dateProchain.getMonth() + (ecole.type_facturation === 'mensuel' ? 1 : 12));
        }
        ecole.date_prochain_paiement = dateProchain;
      }
    }
  }
});

// Méthode d'instance : Vérifier si le trial est expiré
Ecole.prototype.isTrialExpire = function() {
  if (this.statut_abonnement !== 'trial') return false;
  if (!this.date_fin_trial) return false;
  return new Date() > this.date_fin_trial;
};

// Méthode d'instance : Vérifier si l'école a atteint ses limites
Ecole.prototype.limiteAtteinte = async function(type) {
  const Utilisateur = require('./Utilisateur');

  switch (type) {
    case 'eleves':
      const countEleves = await Utilisateur.count({
        where: {
          ecole_id: this.id,
          role: 'eleve'
        }
      });
      return countEleves >= this.max_eleves;

    case 'professeurs':
      const countProfs = await Utilisateur.count({
        where: {
          ecole_id: this.id,
          role: 'professeur'
        }
      });
      return countProfs >= this.max_professeurs;

    default:
      return false;
  }
};

// Méthode d'instance : Obtenir le nombre de jours restants en trial
Ecole.prototype.joursRestantsTrial = function() {
  if (this.statut_abonnement !== 'trial' || !this.date_fin_trial) return 0;
  const now = new Date();
  const diff = this.date_fin_trial - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

module.exports = Ecole;
