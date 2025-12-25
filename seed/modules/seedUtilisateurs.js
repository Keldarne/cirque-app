const bcrypt = require('bcrypt');
const { Utilisateur } = require('../../models');
const logger = require('../utils/logger');
const scenarioDefinitions = require('../data/scenarios');

async function seedUtilisateurs(ecoles) {
  logger.section('Creating Users (Multi-Tenant)');
  
  const scenarioKeys = Object.keys(scenarioDefinitions);

  const users = {
    admin: null,
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

  const nomsEleves = ['Moreau', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Leroy', 'Simon', 'Laurent'];
  const prenomsEleves = ['Lucas', 'Emma', 'Louis', 'Chloé', 'Hugo', 'Léa', 'Arthur', 'Manon', 'Jules', 'Camille'];
  for (let i = 0; i < 10; i++) {
    const eleve = await Utilisateur.create({
      pseudo: `${prenomsEleves[i].toLowerCase()}_${nomsEleves[i].toLowerCase()}`,
      nom: nomsEleves[i],
      prenom: prenomsEleves[i],
      email: `${prenomsEleves[i].toLowerCase()}.${nomsEleves[i].toLowerCase()}@voltige.fr`,
      mot_de_passe: 'Password123!',
      role: 'eleve',
      ecole_id: ecoles.voltige.id,
      niveau: Math.floor(Math.random() * 5) + 1,
      xp_total: Math.floor(Math.random() * 1000),
      actif: true
    });
    // Assign scenario
    eleve.scenario = scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)];
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

  const nomsElevesAcad = ['Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Boyer', 'Roux', 'Lambert', 'Girard', 'Bonnet'];
  const prenomsElevesAcad = ['Gabriel', 'Alice', 'Raphaël', 'Zoé', 'Nathan', 'Clara', 'Thomas', 'Inès', 'Alexandre', 'Sarah'];
  for (let i = 0; i < 10; i++) {
    const eleve = await Utilisateur.create({
      pseudo: `${prenomsElevesAcad[i].toLowerCase()}_${nomsElevesAcad[i].toLowerCase()}_acad`,
      nom: nomsElevesAcad[i],
      prenom: prenomsElevesAcad[i],
      email: `${prenomsElevesAcad[i].toLowerCase()}.${nomsElevesAcad[i].toLowerCase()}@academie.fr`,
      mot_de_passe: 'Password123!',
      role: 'eleve',
      ecole_id: ecoles.academie.id,
      niveau: Math.floor(Math.random() * 6) + 1,
      xp_total: Math.floor(Math.random() * 1500),
      actif: true
    });
     // Assign scenario
    eleve.scenario = scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)];
    users.academie.eleves.push(eleve);
  }
  logger.success(`✓ Académie: ${users.academie.professeurs.length} profs, ${users.academie.eleves.length} élèves`);

  // ========== UTILISATEURS SOLO ==========
  logger.info('Creating solo users (no school)...');
  const soloUsers = [
    { pseudo: 'alex_mercier', nom: 'Mercier', prenom: 'Alex', email: 'alex.mercier@gmail.com', niveau: 3, xp_total: 500 },
    { pseudo: 'julie_fontaine', nom: 'Fontaine', prenom: 'Julie', email: 'julie.fontaine@gmail.com', niveau: 2, xp_total: 250 },
    { pseudo: 'marc_chevalier', nom: 'Chevalier', prenom: 'Marc', email: 'marc.chevalier@gmail.com', niveau: 4, xp_total: 800 }
  ];
  for (const soloData of soloUsers) {
    const solo = await Utilisateur.create({ ...soloData, mot_de_passe: 'Password123!', role: 'eleve', ecole_id: null, actif: true });
    // Assign scenario
    solo.scenario = scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)];
    users.solo.push(solo);
  }
  logger.success(`✓ Solo users: ${users.solo.length} created`);
  
  // Summary is now in the main index.js
  return users;
}

module.exports = seedUtilisateurs;
