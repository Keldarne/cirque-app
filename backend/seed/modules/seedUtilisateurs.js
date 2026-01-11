const bcrypt = require('bcrypt');
const { Utilisateur } = require('../../src/models');
const logger = require('../utils/logger');
const scenarioDefinitions = require('../data/scenarios');

async function seedUtilisateurs(ecoles) {
  logger.section('Creating Users (Multi-Tenant)');
  
  const scenarioKeys = Object.keys(scenarioDefinitions);

  const users = {
    admin: null,
    schoolAdmin: null,
    voltige: { professeurs: [], eleves: [] },
    academie: { professeurs: [], eleves: [] },
    solo: []
  };

  // ========== ADMIN GLOBAL ==========
  logger.info('Creating global admin...');
  users.admin = await Utilisateur.create({
    pseudo: 'admin_cirque',
    nom: 'Admin',
    prenom: 'Global',
    email: 'admin@cirqueapp.com',
    mot_de_passe: 'Admin123!',
    role: 'admin',
    ecole_id: null,
    niveau: 10,
    xp_total: 10000,
    actif: true
  });
  logger.success(`✓ Admin: ${users.admin.email} / Admin123!`);

  // ========== SCHOOL ADMIN (École Voltige) ==========
  logger.info('Creating school admin for École Voltige...');
  users.schoolAdmin = await Utilisateur.create({
    pseudo: 'admin_voltige',
    nom: 'Admin',
    prenom: 'École',
    email: 'admin.voltige@voltige.fr',
    mot_de_passe: 'Password123!',
    role: 'school_admin',
    ecole_id: ecoles.voltige.id,
    niveau: 5,
    xp_total: 1500,
    actif: true
  });
  logger.success(`✓ School Admin: ${users.schoolAdmin.email} / Password123!`);

  // ========== ÉCOLE VOLTIGE (Basic) ==========
  logger.info('Creating users for École Voltige...');
  const profsVoltige = [
    { pseudo: 'jean_martin_voltige', nom: 'Martin', prenom: 'Jean', email: 'jean.martin@voltige.fr', specialite: 'Jonglage' },
    { pseudo: 'sophie_dubois_voltige', nom: 'Dubois', prenom: 'Sophie', email: 'sophie.dubois@voltige.fr', specialite: 'Acrobatie' }
  ];
  for (const profData of profsVoltige) {
    const prof = await Utilisateur.create({ ...profData, mot_de_passe: 'Password123!', role: 'professeur', ecole_id: ecoles.voltige.id, niveau: 5, xp_total: 2500, actif: true });
    users.voltige.professeurs.push(prof);
  }

  // Élèves Voltige avec scénarios ASSIGNÉS (pas random)
  const elevesVoltigeData = [
    { nom: 'Moreau', prenom: 'Lucas', scenario: 'at_risk', niveau: 2, xp: 300 },
    { nom: 'Bernard', prenom: 'Emma', scenario: 'stable', niveau: 3, xp: 600 },
    { nom: 'Thomas', prenom: 'Louis', scenario: 'progressing', niveau: 4, xp: 850 },
    { nom: 'Petit', prenom: 'Chloé', scenario: 'balanced', niveau: 3, xp: 550 }
  ];
  for (const eleveData of elevesVoltigeData) {
    const eleve = await Utilisateur.create({
      pseudo: `${eleveData.prenom.toLowerCase()}_${eleveData.nom.toLowerCase()}`,
      nom: eleveData.nom,
      prenom: eleveData.prenom,
      email: `${eleveData.prenom.toLowerCase()}.${eleveData.nom.toLowerCase()}@voltige.fr`,
      mot_de_passe: 'Password123!',
      role: 'eleve',
      ecole_id: ecoles.voltige.id,
      niveau: eleveData.niveau,
      xp_total: eleveData.xp,
      actif: true
    });
    eleve.scenario = eleveData.scenario; // Assigned, not random
    users.voltige.eleves.push(eleve);
  }
  logger.success(`✓ École Voltige: ${users.voltige.professeurs.length} profs, ${users.voltige.eleves.length} élèves`);

  // ========== ACADÉMIE (Premium Trial) ==========
  logger.info('Creating users for Académie des Arts du Cirque...');
  const profsAcademie = [
    { pseudo: 'marie_lefebvre_acad', nom: 'Lefebvre', prenom: 'Marie', email: 'marie.lefebvre@academie.fr', specialite: 'Aérien' },
    { pseudo: 'pierre_moreau_acad', nom: 'Moreau', prenom: 'Pierre', email: 'pierre.moreau@academie.fr', specialite: 'Équilibre' }
  ];
  for (const profData of profsAcademie) {
    const prof = await Utilisateur.create({ ...profData, mot_de_passe: 'Password123!', role: 'professeur', ecole_id: ecoles.academie.id, niveau: 6, xp_total: 3500, actif: true });
    users.academie.professeurs.push(prof);
  }

  // Élèves Académie avec scénarios ASSIGNÉS (pas random)
  const elevesAcademieData = [
    { nom: 'Garnier', prenom: 'Gabriel', scenario: 'balanced', niveau: 4, xp: 700 },
    { nom: 'Faure', prenom: 'Alice', scenario: 'specialist_juggling', niveau: 5, xp: 950 },
    { nom: 'Rousseau', prenom: 'Raphaël', scenario: 'specialist_aerial', niveau: 5, xp: 1100 },
    { nom: 'Blanc', prenom: 'Zoé', scenario: 'low_safety', niveau: 3, xp: 450 }
  ];
  for (const eleveData of elevesAcademieData) {
    const eleve = await Utilisateur.create({
      pseudo: `${eleveData.prenom.toLowerCase()}_${eleveData.nom.toLowerCase()}_acad`,
      nom: eleveData.nom,
      prenom: eleveData.prenom,
      email: `${eleveData.prenom.toLowerCase()}.${eleveData.nom.toLowerCase()}@academie.fr`,
      mot_de_passe: 'Password123!',
      role: 'eleve',
      ecole_id: ecoles.academie.id,
      niveau: eleveData.niveau,
      xp_total: eleveData.xp,
      actif: true
    });
    eleve.scenario = eleveData.scenario; // Assigned, not random
    users.academie.eleves.push(eleve);
  }
  logger.success(`✓ Académie: ${users.academie.professeurs.length} profs, ${users.academie.eleves.length} élèves`);

  // ========== UTILISATEURS SOLO (Réduit: 3→2) ==========
  logger.info('Creating solo users (no school)...');
  const soloUsers = [
    { pseudo: 'alex_mercier', nom: 'Mercier', prenom: 'Alex', email: 'alex.mercier@gmail.com', niveau: 3, xp_total: 500 },
    { pseudo: 'julie_fontaine', nom: 'Fontaine', prenom: 'Julie', email: 'julie.fontaine@gmail.com', niveau: 2, xp_total: 250 }
  ];
  for (const soloData of soloUsers) {
    const solo = await Utilisateur.create({ ...soloData, mot_de_passe: 'Password123!', role: 'eleve', ecole_id: null, actif: true });
    // Random scenario for solo users (they're for edge cases)
    solo.scenario = scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)];
    users.solo.push(solo);
  }
  logger.success(`✓ Solo users: ${users.solo.length} created`);
  
  // Summary is now in the main index.js
  return users;
}

module.exports = seedUtilisateurs;
