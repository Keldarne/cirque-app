# Architecture Système de Paiement - Cirque App

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend React                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Dashboard Admin - Gestion Abonnements               │  │
│  │  • Liste écoles/utilisateurs                         │  │
│  │  • Statuts paiements                                  │  │
│  │  • Actions (suspendre, réactiver, changer plan)      │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓ API Calls                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend Node.js/Express                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Routes /admin/paiements/*                           │  │
│  │  • GET /abonnements - Liste tous les abonnements     │  │
│  │  │  GET /abonnements/:id - Détails abonnement        │  │
│  │  • POST /abonnements/:id/suspendre                   │  │
│  │  • POST /abonnements/:id/reactiver                   │  │
│  │  • GET /factures - Liste factures                    │  │
│  │  • GET /factures/:id/pdf - Télécharger PDF          │  │
│  │  • GET /dashboard/metrics - KPIs MRR, churn, etc    │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Services Layer                                       │  │
│  │  • paiementService.js - Logique abonnements         │  │
│  │  • stripeService.js - Intégration Stripe (Phase 2)  │  │
│  │  • factureService.js - Génération PDF               │  │
│  │  • notificationService.js - Emails paiement         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                            │
│  Tables:                                                     │
│  • Ecoles (avec champs paiement)                            │
│  • Abonnements (historique)                                 │
│  • Factures                                                  │
│  • TransactionsPaiement (logs Stripe)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           Stripe API (Phase 2+)                              │
│  • Subscriptions                                             │
│  • Invoices                                                  │
│  • Payment Methods                                           │
│  • Webhooks (payment success/failed)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Modèles de Données

### 1. Table `Ecoles` (Modifiée)

```javascript
// models/Ecole.js
const Ecole = sequelize.define('Ecole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  // === PAIEMENT ET ABONNEMENT ===
  plan: {
    type: DataTypes.ENUM('solo', 'basic', 'premium'),
    allowNull: false,
    defaultValue: 'basic'
  },
  type_facturation: {
    type: DataTypes.ENUM('mensuel', 'annuel'),
    defaultValue: 'mensuel'
  },
  statut_abonnement: {
    type: DataTypes.ENUM('trial', 'actif', 'suspendu', 'annule', 'impaye'),
    defaultValue: 'trial'
  },
  date_debut_trial: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_fin_trial: {
    type: DataTypes.DATE,
    allowNull: true
    // Calculé : date_debut_trial + 14 jours
  },
  date_debut_abonnement: {
    type: DataTypes.DATE,
    allowNull: true
    // Date de conversion trial → actif
  },
  date_prochain_paiement: {
    type: DataTypes.DATE,
    allowNull: true
  },
  montant_mensuel: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
    // 9.00, 29.00, ou 79.00 selon plan
  },

  // === LIMITES PLAN ===
  max_eleves: {
    type: DataTypes.INTEGER,
    defaultValue: 50
    // Solo: 0, Basic: 50, Premium: 200
  },
  max_professeurs: {
    type: DataTypes.INTEGER,
    defaultValue: 3
    // Solo: 1, Basic: 3, Premium: null (illimité)
  },
  max_stockage_gb: {
    type: DataTypes.INTEGER,
    defaultValue: 20
    // Solo: 5, Basic: 20, Premium: 50
  },

  // === STRIPE (Phase 2) ===
  stripe_customer_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripe_subscription_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripe_payment_method_id: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // === CONFIGURATION ===
  config: {
    type: DataTypes.JSON,
    defaultValue: {
      branding: {
        couleur_theme: '#1976d2',
        logo_url: null
      },
      notifications: {
        email_facturation: null,
        rappels_paiement: true
      }
    }
  },

  // === ADMIN ===
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes_admin: {
    type: DataTypes.TEXT,
    allowNull: true
    // Notes internes pour gestion client
  }
}, {
  tableName: 'Ecoles',
  timestamps: true
});
```

### 2. Nouvelle Table `Factures`

```javascript
// models/Facture.js
const Facture = sequelize.define('Facture', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_facture: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
    // Format: FACT-2025-0001
  },
  ecole_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Ecoles', key: 'id' }
    // NULL pour utilisateurs solo
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Utilisateurs', key: 'id' }
    // Pour utilisateurs solo
  },

  // === MONTANTS ===
  montant_ht: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  montant_tva: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
    // 20% en France
  },
  montant_ttc: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  // === PÉRIODE ===
  date_emission: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  date_echeance: {
    type: DataTypes.DATE,
    allowNull: false
    // date_emission + 30 jours
  },
  periode_debut: {
    type: DataTypes.DATE,
    allowNull: false
    // Ex: 01/01/2025
  },
  periode_fin: {
    type: DataTypes.DATE,
    allowNull: false
    // Ex: 31/01/2025 (mensuel) ou 31/12/2025 (annuel)
  },

  // === STATUT ===
  statut: {
    type: DataTypes.ENUM('brouillon', 'emise', 'payee', 'annulee'),
    defaultValue: 'brouillon'
  },
  date_paiement: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // === DÉTAILS ===
  description: {
    type: DataTypes.STRING,
    allowNull: false
    // Ex: "Abonnement Plan Premium - Janvier 2025"
  },
  plan: {
    type: DataTypes.STRING,
    allowNull: false
    // "solo", "basic", "premium"
  },
  type_facturation: {
    type: DataTypes.STRING
    // "mensuel", "annuel"
  },

  // === FICHIERS ===
  pdf_url: {
    type: DataTypes.STRING,
    allowNull: true
    // URL kDrive du PDF généré
  },

  // === STRIPE (Phase 2) ===
  stripe_invoice_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripe_charge_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Factures',
  timestamps: true
});
```

### 3. Nouvelle Table `TransactionsPaiement` (Logs)

```javascript
// models/TransactionPaiement.js
const TransactionPaiement = sequelize.define('TransactionPaiement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ecole_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Ecoles', key: 'id' }
  },
  utilisateur_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Utilisateurs', key: 'id' }
  },
  facture_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Factures', key: 'id' }
  },

  // === TYPE TRANSACTION ===
  type: {
    type: DataTypes.ENUM(
      'paiement',
      'remboursement',
      'echec_paiement',
      'tentative_paiement'
    ),
    allowNull: false
  },

  // === MONTANT ===
  montant: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  // === STATUT ===
  statut: {
    type: DataTypes.ENUM('en_cours', 'reussi', 'echec'),
    defaultValue: 'en_cours'
  },

  // === DÉTAILS ===
  methode_paiement: {
    type: DataTypes.STRING
    // "carte", "sepa", "virement", "manuel"
  },
  message_erreur: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // === STRIPE ===
  stripe_payment_intent_id: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // === METADATA ===
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
    // Logs additionnels, détails techniques
  }
}, {
  tableName: 'TransactionsPaiement',
  timestamps: true
});
```

### 4. Table `Utilisateurs` (Pour Solo)

Ajouter champs pour utilisateurs solo :

```javascript
// Dans models/Utilisateur.js, ajouter:
{
  // ... champs existants

  // Pour utilisateurs solo (ecole_id = NULL)
  plan_solo: {
    type: DataTypes.ENUM('solo'),
    allowNull: true
    // NULL si utilisateur fait partie d'une école
  },
  statut_abonnement_solo: {
    type: DataTypes.ENUM('trial', 'actif', 'suspendu', 'annule'),
    allowNull: true
  },
  date_prochain_paiement_solo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  stripe_customer_id_solo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}
```

---

## Services Backend

### 1. Service Paiement `services/paiementService.js`

```javascript
const { Ecole, Facture, TransactionPaiement, Utilisateur } = require('../models');
const { Op } = require('sequelize');

class PaiementService {

  /**
   * Calculer montant selon plan et facturation
   */
  calculerMontant(plan, typeFacturation) {
    const tarifs = {
      solo: { mensuel: 9.00, annuel: 90.00 },
      basic: { mensuel: 29.00, annuel: 290.00 },
      premium: { mensuel: 79.00, annuel: 790.00 }
    };

    return tarifs[plan][typeFacturation];
  }

  /**
   * Créer facture mensuelle/annuelle
   */
  async creerFacture(ecoleId, utilisateurId = null) {
    const isEcole = ecoleId !== null;

    let entity, plan, typeFacturation;

    if (isEcole) {
      entity = await Ecole.findByPk(ecoleId);
      plan = entity.plan;
      typeFacturation = entity.type_facturation;
    } else {
      entity = await Utilisateur.findByPk(utilisateurId);
      plan = 'solo';
      typeFacturation = entity.type_facturation_solo || 'mensuel';
    }

    const montantHT = this.calculerMontant(plan, typeFacturation);
    const montantTVA = montantHT * 0.20;
    const montantTTC = montantHT + montantTVA;

    // Générer numéro facture
    const annee = new Date().getFullYear();
    const derniere = await Facture.findOne({
      where: {
        numero_facture: { [Op.like]: `FACT-${annee}-%` }
      },
      order: [['numero_facture', 'DESC']]
    });

    let numero = 1;
    if (derniere) {
      const match = derniere.numero_facture.match(/FACT-\d{4}-(\d+)/);
      numero = parseInt(match[1]) + 1;
    }

    const numeroFacture = `FACT-${annee}-${String(numero).padStart(4, '0')}`;

    // Période facturée
    const periodeDebut = new Date();
    const periodeFin = new Date();
    if (typeFacturation === 'mensuel') {
      periodeFin.setMonth(periodeFin.getMonth() + 1);
    } else {
      periodeFin.setFullYear(periodeFin.getFullYear() + 1);
    }

    const facture = await Facture.create({
      numero_facture: numeroFacture,
      ecole_id: ecoleId,
      utilisateur_id: utilisateurId,
      montant_ht: montantHT,
      montant_tva: montantTVA,
      montant_ttc: montantTTC,
      date_emission: new Date(),
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      periode_debut: periodeDebut,
      periode_fin: periodeFin,
      description: `Abonnement Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} - ${periodeDebut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
      plan,
      type_facturation: typeFacturation,
      statut: 'emise'
    });

    return facture;
  }

  /**
   * Marquer facture comme payée
   */
  async marquerPayee(factureId, transactionId = null) {
    const facture = await Facture.findByPk(factureId);

    await facture.update({
      statut: 'payee',
      date_paiement: new Date()
    });

    // Mettre à jour statut école/utilisateur
    if (facture.ecole_id) {
      const ecole = await Ecole.findByPk(facture.ecole_id);
      await ecole.update({
        statut_abonnement: 'actif',
        date_prochain_paiement: this.calculerProchainPaiement(ecole.type_facturation)
      });
    } else {
      const user = await Utilisateur.findByPk(facture.utilisateur_id);
      await user.update({
        statut_abonnement_solo: 'actif',
        date_prochain_paiement_solo: this.calculerProchainPaiement('mensuel')
      });
    }

    return facture;
  }

  /**
   * Calculer date prochain paiement
   */
  calculerProchainPaiement(typeFacturation) {
    const date = new Date();
    if (typeFacturation === 'mensuel') {
      date.setMonth(date.getMonth() + 1);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date;
  }

  /**
   * Suspendre compte pour non-paiement
   */
  async suspendreCompte(ecoleId, raison) {
    const ecole = await Ecole.findByPk(ecoleId);

    await ecole.update({
      statut_abonnement: 'suspendu',
      notes_admin: `Suspendu: ${raison} - ${new Date().toISOString()}`
    });

    // TODO: Envoyer email notification

    return ecole;
  }

  /**
   * Réactiver compte après paiement
   */
  async reactiverCompte(ecoleId) {
    const ecole = await Ecole.findByPk(ecoleId);

    await ecole.update({
      statut_abonnement: 'actif',
      date_prochain_paiement: this.calculerProchainPaiement(ecole.type_facturation)
    });

    return ecole;
  }

  /**
   * Obtenir métriques dashboard admin
   */
  async obtenirMetriques() {
    // MRR (Monthly Recurring Revenue)
    const ecolesActives = await Ecole.findAll({
      where: {
        statut_abonnement: 'actif',
        plan: { [Op.ne]: 'solo' }
      }
    });

    const utilisateursSolo = await Utilisateur.count({
      where: {
        ecole_id: null,
        statut_abonnement_solo: 'actif',
        plan_solo: 'solo'
      }
    });

    let mrr = 0;
    ecolesActives.forEach(ecole => {
      const montant = ecole.type_facturation === 'mensuel'
        ? ecole.montant_mensuel
        : ecole.montant_mensuel / 12;
      mrr += parseFloat(montant);
    });
    mrr += utilisateursSolo * 9;

    // Répartition par plan
    const repartition = {
      solo: utilisateursSolo * 9,
      basic: 0,
      premium: 0
    };

    ecolesActives.forEach(ecole => {
      const montant = ecole.type_facturation === 'mensuel'
        ? parseFloat(ecole.montant_mensuel)
        : parseFloat(ecole.montant_mensuel) / 12;
      repartition[ecole.plan] += montant;
    });

    // Alertes
    const paymentsEchoues = await Ecole.count({
      where: { statut_abonnement: 'impaye' }
    });

    const trialBientotFini = await Ecole.count({
      where: {
        statut_abonnement: 'trial',
        date_fin_trial: {
          [Op.between]: [new Date(), new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)]
        }
      }
    });

    return {
      mrr: Math.round(mrr * 100) / 100,
      repartition,
      alertes: {
        payments_echoues: paymentsEchoues,
        trials_bientot_finis: trialBientotFini
      }
    };
  }

  /**
   * Liste tous les abonnements (pour dashboard admin)
   */
  async listerAbonnements(filtres = {}) {
    const where = {};

    if (filtres.statut) {
      where.statut_abonnement = filtres.statut;
    }

    if (filtres.plan) {
      where.plan = filtres.plan;
    }

    const ecoles = await Ecole.findAll({
      where,
      include: [{
        model: Utilisateur,
        where: { role: 'eleve' },
        required: false,
        attributes: ['id']
      }],
      order: [['date_prochain_paiement', 'ASC']]
    });

    return ecoles.map(ecole => ({
      id: ecole.id,
      nom: ecole.nom,
      plan: ecole.plan,
      statut: ecole.statut_abonnement,
      nb_eleves: ecole.Utilisateurs?.length || 0,
      max_eleves: ecole.max_eleves,
      date_prochain_paiement: ecole.date_prochain_paiement,
      montant: ecole.montant_mensuel,
      type_facturation: ecole.type_facturation
    }));
  }
}

module.exports = new PaiementService();
```

### 2. Service Génération PDF `services/factureService.js`

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const kdriveService = require('./kdriveService');

class FactureService {

  /**
   * Générer PDF facture
   */
  async genererPDF(factureId) {
    const facture = await Facture.findByPk(factureId, {
      include: [
        { model: Ecole },
        { model: Utilisateur }
      ]
    });

    const doc = new PDFDocument({ margin: 50 });
    const filename = `facture-${facture.numero_facture}.pdf`;
    const tmpPath = path.join('/tmp', filename);

    // Créer stream fichier
    const stream = fs.createWriteStream(tmpPath);
    doc.pipe(stream);

    // === EN-TÊTE ===
    doc.fontSize(20).text('FACTURE', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Numéro: ${facture.numero_facture}`, { align: 'right' });
    doc.text(`Date: ${facture.date_emission.toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown();

    // === ÉMETTEUR (Votre entreprise) ===
    doc.fontSize(12).text('Cirque App', 50, 150);
    doc.fontSize(10);
    doc.text('123 Rue de la Performance');
    doc.text('75000 Paris, France');
    doc.text('SIRET: 123 456 789 00012');
    doc.text('TVA: FR12345678901');
    doc.moveDown();

    // === CLIENT ===
    doc.text('Facturé à:', 300, 150);
    if (facture.Ecole) {
      doc.text(facture.Ecole.nom);
      // TODO: Ajouter adresse école si disponible
    } else {
      doc.text(`${facture.Utilisateur.nom} ${facture.Utilisateur.prenom}`);
      doc.text(facture.Utilisateur.email);
    }
    doc.moveDown(3);

    // === TABLEAU DÉTAILS ===
    const tableTop = 300;
    doc.fontSize(10);

    // Header
    doc.text('Description', 50, tableTop);
    doc.text('Période', 250, tableTop);
    doc.text('Montant HT', 400, tableTop, { width: 90, align: 'right' });

    // Ligne
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Contenu
    const itemY = tableTop + 25;
    doc.text(facture.description, 50, itemY);
    doc.text(
      `${facture.periode_debut.toLocaleDateString('fr-FR')} - ${facture.periode_fin.toLocaleDateString('fr-FR')}`,
      250,
      itemY
    );
    doc.text(`${facture.montant_ht.toFixed(2)} €`, 400, itemY, { width: 90, align: 'right' });

    // === TOTAUX ===
    const totalsY = itemY + 50;
    doc.text('Total HT:', 350, totalsY);
    doc.text(`${facture.montant_ht.toFixed(2)} €`, 400, totalsY, { width: 90, align: 'right' });

    doc.text('TVA (20%):', 350, totalsY + 20);
    doc.text(`${facture.montant_tva.toFixed(2)} €`, 400, totalsY + 20, { width: 90, align: 'right' });

    doc.fontSize(12).text('Total TTC:', 350, totalsY + 50);
    doc.text(`${facture.montant_ttc.toFixed(2)} €`, 400, totalsY + 50, { width: 90, align: 'right' });

    // === PIED DE PAGE ===
    doc.fontSize(8);
    doc.text(
      'Conditions de paiement: 30 jours. En cas de retard, pénalités de 10% applicables.',
      50,
      700,
      { align: 'center', width: 500 }
    );

    doc.end();

    // Attendre fin écriture
    await new Promise(resolve => stream.on('finish', resolve));

    // Upload vers kDrive
    const fileBuffer = fs.readFileSync(tmpPath);
    const remotePath = `/factures/${facture.numero_facture}.pdf`;
    const publicUrl = await kdriveService.uploadFile(fileBuffer, remotePath);

    // Mettre à jour facture avec URL
    await facture.update({ pdf_url: publicUrl });

    // Nettoyer fichier temp
    fs.unlinkSync(tmpPath);

    return publicUrl;
  }
}

module.exports = new FactureService();
```

---

## Routes Admin `/routes/admin/paiements.js`

```javascript
const express = require('express');
const router = express.Router();
const { verifierToken, estAdmin } = require('../../middleware/auth');
const paiementService = require('../../services/paiementService');
const factureService = require('../../services/factureService');
const { Ecole, Facture } = require('../../models');

/**
 * GET /admin/paiements/dashboard
 * Métriques pour dashboard admin
 */
router.get('/dashboard', verifierToken, estAdmin, async (req, res) => {
  try {
    const metriques = await paiementService.obtenirMetriques();
    res.json(metriques);
  } catch (error) {
    console.error('Erreur métriques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /admin/paiements/abonnements
 * Liste tous les abonnements
 */
router.get('/abonnements', verifierToken, estAdmin, async (req, res) => {
  try {
    const { statut, plan } = req.query;
    const abonnements = await paiementService.listerAbonnements({ statut, plan });
    res.json({ abonnements });
  } catch (error) {
    console.error('Erreur liste abonnements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /admin/paiements/abonnements/:id
 * Détails d'un abonnement
 */
router.get('/abonnements/:id', verifierToken, estAdmin, async (req, res) => {
  try {
    const ecole = await Ecole.findByPk(req.params.id, {
      include: [
        { model: Utilisateur, where: { role: 'eleve' }, required: false },
        { model: Facture, order: [['date_emission', 'DESC']], limit: 10 }
      ]
    });

    if (!ecole) {
      return res.status(404).json({ error: 'École non trouvée' });
    }

    res.json({
      ecole: {
        id: ecole.id,
        nom: ecole.nom,
        plan: ecole.plan,
        statut: ecole.statut_abonnement,
        type_facturation: ecole.type_facturation,
        montant_mensuel: ecole.montant_mensuel,
        date_prochain_paiement: ecole.date_prochain_paiement,
        nb_eleves: ecole.Utilisateurs.length,
        max_eleves: ecole.max_eleves,
        notes_admin: ecole.notes_admin
      },
      factures: ecole.Factures
    });
  } catch (error) {
    console.error('Erreur détails abonnement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /admin/paiements/abonnements/:id/suspendre
 * Suspendre un abonnement
 */
router.post('/abonnements/:id/suspendre', verifierToken, estAdmin, async (req, res) => {
  try {
    const { raison } = req.body;
    const ecole = await paiementService.suspendreCompte(req.params.id, raison);
    res.json({ message: 'Abonnement suspendu', ecole });
  } catch (error) {
    console.error('Erreur suspension:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /admin/paiements/abonnements/:id/reactiver
 * Réactiver un abonnement
 */
router.post('/abonnements/:id/reactiver', verifierToken, estAdmin, async (req, res) => {
  try {
    const ecole = await paiementService.reactiverCompte(req.params.id);
    res.json({ message: 'Abonnement réactivé', ecole });
  } catch (error) {
    console.error('Erreur réactivation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /admin/paiements/factures
 * Liste toutes les factures
 */
router.get('/factures', verifierToken, estAdmin, async (req, res) => {
  try {
    const factures = await Facture.findAll({
      include: [
        { model: Ecole, attributes: ['nom'] },
        { model: Utilisateur, attributes: ['nom', 'prenom', 'email'] }
      ],
      order: [['date_emission', 'DESC']],
      limit: 100
    });

    res.json({ factures });
  } catch (error) {
    console.error('Erreur liste factures:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /admin/paiements/factures/:id/pdf
 * Télécharger PDF facture
 */
router.get('/factures/:id/pdf', verifierToken, estAdmin, async (req, res) => {
  try {
    const facture = await Facture.findByPk(req.params.id);

    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Générer PDF si pas déjà fait
    if (!facture.pdf_url) {
      await factureService.genererPDF(facture.id);
      await facture.reload();
    }

    res.json({ pdf_url: facture.pdf_url });
  } catch (error) {
    console.error('Erreur PDF facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /admin/paiements/factures/:id/marquer-payee
 * Marquer facture comme payée (paiement manuel)
 */
router.post('/factures/:id/marquer-payee', verifierToken, estAdmin, async (req, res) => {
  try {
    const facture = await paiementService.marquerPayee(req.params.id);
    res.json({ message: 'Facture marquée comme payée', facture });
  } catch (error) {
    console.error('Erreur marquer payée:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
```

---

## Composant React Dashboard Admin

```javascript
// frontend/src/pages/admin/PaiementsDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PaiementsDashboard() {
  const [metriques, setMetriques] = useState(null);
  const [abonnements, setAbonnements] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, [filtreStatut]);

  const chargerDonnees = async () => {
    const token = localStorage.getItem('token');

    // Métriques
    const metriquesRes = await axios.get('/admin/paiements/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMetriques(metriquesRes.data);

    // Abonnements
    const params = filtreStatut ? `?statut=${filtreStatut}` : '';
    const abonnementsRes = await axios.get(`/admin/paiements/abonnements${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setAbonnements(abonnementsRes.data.abonnements);
  };

  const suspendreAbonnement = async (id) => {
    if (!confirm('Suspendre cet abonnement ?')) return;

    const raison = prompt('Raison de la suspension:');
    const token = localStorage.getItem('token');

    await axios.post(`/admin/paiements/abonnements/${id}/suspendre`,
      { raison },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    chargerDonnees();
  };

  return (
    <div className="paiements-dashboard">
      <h1>Gestion des Paiements</h1>

      {/* Métriques */}
      {metriques && (
        <div className="metrics-cards">
          <div className="card">
            <h3>MRR (Revenus Récurrents)</h3>
            <p className="big-number">{metriques.mrr}€/mois</p>
          </div>

          <div className="card">
            <h3>Répartition</h3>
            <ul>
              <li>Solo: {metriques.repartition.solo}€</li>
              <li>Basic: {metriques.repartition.basic}€</li>
              <li>Premium: {metriques.repartition.premium}€</li>
            </ul>
          </div>

          <div className="card alerts">
            <h3>Alertes</h3>
            <ul>
              <li>⚠️ {metriques.alertes.payments_echoues} paiements échoués</li>
              <li>🔔 {metriques.alertes.trials_bientot_finis} trials se terminent bientôt</li>
            </ul>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filters">
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="trial">Trial</option>
          <option value="suspendu">Suspendu</option>
          <option value="impaye">Impayé</option>
        </select>
      </div>

      {/* Table Abonnements */}
      <table className="abonnements-table">
        <thead>
          <tr>
            <th>École</th>
            <th>Plan</th>
            <th>Statut</th>
            <th>Élèves</th>
            <th>Prochain Paiement</th>
            <th>Montant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {abonnements.map(abo => (
            <tr key={abo.id}>
              <td>{abo.nom}</td>
              <td>{abo.plan}</td>
              <td>
                <span className={`badge badge-${abo.statut}`}>
                  {abo.statut}
                </span>
              </td>
              <td>{abo.nb_eleves}/{abo.max_eleves}</td>
              <td>{new Date(abo.date_prochain_paiement).toLocaleDateString('fr-FR')}</td>
              <td>{abo.montant}€/{abo.type_facturation === 'mensuel' ? 'mois' : 'an'}</td>
              <td>
                <button onClick={() => window.location.href = `/admin/paiements/${abo.id}`}>
                  Détails
                </button>
                {abo.statut === 'actif' && (
                  <button className="btn-danger" onClick={() => suspendreAbonnement(abo.id)}>
                    Suspendre
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PaiementsDashboard;
```

---

## Phase d'Implémentation

### Phase 1 (MVP - Manuel) - Semaines 1-2
- ✅ Créer modèles (Ecole, Facture, TransactionPaiement)
- ✅ Service paiementService basique
- ✅ Routes admin paiements
- ✅ Dashboard admin React simple
- ✅ Génération factures PDF basique
- **Paiement:** Admin crée facture manuellement, client paie par virement, admin marque "payée"

### Phase 2 (Stripe) - Semaines 3-4
- ✅ Intégration Stripe SDK
- ✅ Webhooks Stripe (payment.succeeded, payment.failed)
- ✅ Service stripeService
- ✅ Checkout Stripe pour cartes bancaires
- ✅ Gestion erreurs paiement
- **Paiement:** Automatique via Stripe

### Phase 3 (Automatisation) - Semaines 5-6
- ✅ Cron jobs pour factures récurrentes
- ✅ Emails transactionnels (SendGrid/Mailgun)
- ✅ Gestion trials automatique
- ✅ Suspension automatique après échecs paiement
- **Paiement:** Entièrement automatisé

---

## Checklist Sécurité

- [ ] Validation montants côté serveur (jamais côté client)
- [ ] Logs toutes transactions (audit trail)
- [ ] Chiffrement données sensibles (cartes via Stripe)
- [ ] Rate limiting sur routes paiement
- [ ] Vérification signatures webhooks Stripe
- [ ] Tests isolation données (école A ne voit pas école B)
- [ ] Conformité RGPD pour données paiement
- [ ] Backup quotidiens base données

---

## Dépendances NPM

```json
{
  "dependencies": {
    "pdfkit": "^0.13.0",
    "stripe": "^12.0.0"
  }
}
```

```bash
npm install pdfkit stripe
```
