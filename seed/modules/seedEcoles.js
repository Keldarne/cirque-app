/**
 * Seed Module: Écoles
 * Création des écoles de test pour environnement multi-tenant
 */

const { Ecole } = require('../../models');
const logger = require('../utils/logger');

/**
 * Créer une école avec ses paramètres
 * @param {Object} ecoleData - Données de l'école
 * @returns {Promise<Object>} École créée
 */
async function creerEcole(ecoleData) {
  try {
    const ecole = await Ecole.create(ecoleData);
    logger.success(`  ✓ École créée: ${ecole.nom} (${ecole.plan})`);
    return ecole;
  } catch (error) {
    logger.error(`  ✗ Erreur création école ${ecoleData.nom}: ${error.message}`);
    throw error;
  }
}

/**
 * Seed écoles multi-tenant
 * Crée 2 écoles de test + optionnel admin global
 */
async function seedEcoles() {
  logger.section('Seeding Écoles (Multi-Tenant)');

  const ecoles = {
    voltige: null,
    academie: null
  };

  try {
    // École A - "École de Cirque Voltige" (Plan Basic, Active)
    ecoles.voltige = await creerEcole({
      nom: 'École de Cirque Voltige',
      slug: 'ecole-voltige',
      plan: 'basic',
      type_facturation: 'mensuel',
      statut_abonnement: 'actif',
      montant_mensuel: 29.00,
      max_eleves: 50,
      max_professeurs: 3,
      max_stockage_gb: 10,
      actif: true,
      config: {
        couleur_theme: '#1976d2',
        logo_url: null,
        email_contact: 'contact@voltige.fr',
        notifications_email: true,
        notifications_push: false,
        fuseau_horaire: 'Europe/Paris'
      },
      // Paiement fictif déjà effectué
      date_prochain_paiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours
    });

    // École B - "Académie des Arts du Cirque" (Plan Premium Trial, Jour 7/14)
    const dateFinTrial = new Date();
    dateFinTrial.setDate(dateFinTrial.getDate() + 7); // 7 jours restants

    ecoles.academie = await creerEcole({
      nom: 'Académie des Arts du Cirque',
      slug: 'academie-arts-cirque',
      plan: 'premium',
      type_facturation: 'annuel',
      statut_abonnement: 'trial',
      montant_mensuel: 79.00 * 0.8, // Réduction annuelle
      max_eleves: 200,
      max_professeurs: 999, // Illimité
      max_stockage_gb: 50,
      actif: true,
      date_fin_trial: dateFinTrial,
      date_prochain_paiement: dateFinTrial, // Fin du trial
      config: {
        couleur_theme: '#e91e63',
        logo_url: null,
        email_contact: 'info@academie-cirque.fr',
        notifications_email: true,
        notifications_push: true,
        fuseau_horaire: 'Europe/Paris'
      }
    });

    logger.section(`✅ ${Object.keys(ecoles).length} écoles créées`);

    return ecoles;

  } catch (error) {
    logger.error(`Erreur lors du seed des écoles: ${error.message}`);
    throw error;
  }
}

module.exports = seedEcoles;
