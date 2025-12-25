// Script de seed pour initialiser les données de gamification
// Usage : node seed-gamification.js

require('dotenv').config();
const bcrypt = require('bcrypt');
const {
  Utilisateur,
  Badge,
  Titre,
  Defi,
  BadgeUtilisateur,
  TitreUtilisateur,
  DefiUtilisateur,
  RelationProfEleve,
  Groupe,
  GroupeEleve,
  Streak,
  sequelize
} = require('./models');

async function seedUtilisateurs() {
  console.log('👤 Création des utilisateurs de test...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const utilisateurs = [
    // Professeurs
    {
      email: 'prof.martin@cirque.fr',
      mot_de_passe: hashedPassword,
      nom: 'Martin',
      prenom: 'Jean',
      pseudo: 'ProfMartin',
      role: 'professeur',
      niveau: 15,
      xp_total: 2500
    },
    {
      email: 'prof.dubois@cirque.fr',
      mot_de_passe: hashedPassword,
      nom: 'Dubois',
      prenom: 'Sophie',
      pseudo: 'ProfSophie',
      role: 'professeur',
      niveau: 20,
      xp_total: 4000
    },

    // Élèves débutants (niveau 1-5)
    {
      email: 'alice.petit@eleve.fr',
      mot_de_passe: hashedPassword,
      nom: 'Petit',
      prenom: 'Alice',
      pseudo: 'Alice_Acrobate',
      role: 'eleve',
      niveau: 3,
      xp_total: 250
    },
    {
      email: 'bob.martin@eleve.fr',
      mot_de_passe: hashedPassword,
      nom: 'Martin',
      prenom: 'Bob',
      pseudo: 'Bob_Jongleur',
      role: 'eleve',
      niveau: 2,
      xp_total: 150
    },

    // Élèves intermédiaires (niveau 6-15)
    {
      email: 'clara.rousseau@eleve.fr',
      mot_de_passe: hashedPassword,
      nom: 'Rousseau',
      prenom: 'Clara',
      pseudo: 'Clara_Equilibre',
      role: 'eleve',
      niveau: 8,
      xp_total: 800
    },
    {
      email: 'david.bernard@eleve.fr',
      mot_de_passe: hashedPassword,
      nom: 'Bernard',
      prenom: 'David',
      pseudo: 'David_Aerien',
      role: 'eleve',
      niveau: 12,
      xp_total: 1500
    },

    // Élèves avancés (niveau 16+)
    {
      email: 'emma.leroy@eleve.fr',
      mot_de_passe: hashedPassword,
      nom: 'Leroy',
      prenom: 'Emma',
      pseudo: 'Emma_Pro',
      role: 'eleve',
      niveau: 18,
      xp_total: 3200
    },
    {
      email: 'felix.moreau@eleve.fr',
      mot_de_passe: hashedPassword,
      nom: 'Moreau',
      prenom: 'Felix',
      pseudo: 'Felix_Master',
      role: 'eleve',
      niveau: 25,
      xp_total: 6500
    },

    // Élèves sans prof
    {
      email: 'gabriel.simon@eleve.fr',
      mot_de_passe: hashedPassword,
      nom: 'Simon',
      prenom: 'Gabriel',
      pseudo: 'Gaby_Solo',
      role: 'eleve',
      niveau: 5,
      xp_total: 450
    }
  ];

  const createdUsers = [];
  for (const user of utilisateurs) {
    const [createdUser] = await Utilisateur.findOrCreate({
      where: { email: user.email },
      defaults: user
    });
    createdUsers.push(createdUser);
  }

  console.log(`✅ ${createdUsers.length} utilisateurs créés/vérifiés`);
  return createdUsers;
}

async function seedBadges() {
  console.log('🎖️  Création des badges...');

  const badges = [
    // Badges de progression XP
    {
      nom: 'Première Étoile',
      description: 'Valider votre première étape',
      icone: '🌟',
      couleur: '#FFD700',
      categorie: 'progression',
      condition_type: 'premiere_fois',
      condition_valeur: 1,
      rarete: 'commun',
      xp_bonus: 10
    },
    {
      nom: 'Débutant',
      description: 'Accumuler 100 XP',
      icone: '🏆',
      couleur: '#CD7F32',
      categorie: 'progression',
      condition_type: 'xp_total',
      condition_valeur: 100,
      rarete: 'commun',
      xp_bonus: 50
    },
    {
      nom: 'Apprenti',
      description: 'Accumuler 500 XP',
      icone: '💎',
      couleur: '#C0C0C0',
      categorie: 'progression',
      condition_type: 'xp_total',
      condition_valeur: 500,
      rarete: 'commun',
      xp_bonus: 100
    },
    {
      nom: 'Expert',
      description: 'Accumuler 2000 XP',
      icone: '👑',
      couleur: '#FFD700',
      categorie: 'progression',
      condition_type: 'xp_total',
      condition_valeur: 2000,
      rarete: 'rare',
      xp_bonus: 200
    },
    {
      nom: 'Maître',
      description: 'Accumuler 5000 XP',
      icone: '🌠',
      couleur: '#9C27B0',
      categorie: 'progression',
      condition_type: 'xp_total',
      condition_valeur: 5000,
      rarete: 'epique',
      xp_bonus: 500
    },
    {
      nom: 'Légende',
      description: 'Accumuler 10000 XP',
      icone: '⚡',
      couleur: '#FF6B00',
      categorie: 'progression',
      condition_type: 'xp_total',
      condition_valeur: 10000,
      rarete: 'legendaire',
      xp_bonus: 1000
    },

    // Badges de Streak
    {
      nom: 'Réchauffement',
      description: '3 jours consécutifs d\'activité',
      icone: '🔥',
      couleur: '#FF5722',
      categorie: 'streak',
      condition_type: 'streak_jours',
      condition_valeur: 3,
      rarete: 'commun',
      xp_bonus: 50
    },
    {
      nom: 'En Forme',
      description: '7 jours consécutifs d\'activité',
      icone: '🔥🔥',
      couleur: '#FF5722',
      categorie: 'streak',
      condition_type: 'streak_jours',
      condition_valeur: 7,
      rarete: 'rare',
      xp_bonus: 150
    },
    {
      nom: 'Inarrêtable',
      description: '30 jours consécutifs d\'activité',
      icone: '🔥🔥🔥',
      couleur: '#FF5722',
      categorie: 'streak',
      condition_type: 'streak_jours',
      condition_valeur: 30,
      rarete: 'epique',
      xp_bonus: 500
    },
    {
      nom: 'Centenaire',
      description: '100 jours consécutifs d\'activité',
      icone: '💯',
      couleur: '#E91E63',
      categorie: 'streak',
      condition_type: 'streak_jours',
      condition_valeur: 100,
      rarete: 'legendaire',
      xp_bonus: 2000
    },

    // Badges de Maîtrise
    {
      nom: 'Acrobate',
      description: 'Compléter toutes les figures d\'une discipline',
      icone: '🎪',
      couleur: '#2196F3',
      categorie: 'maitrise',
      condition_type: 'discipline_complete',
      condition_valeur: 1,
      rarete: 'rare',
      xp_bonus: 300
    },
    {
      nom: 'Perfectionniste',
      description: '10 figures validées à 100%',
      icone: '🎯',
      couleur: '#4CAF50',
      categorie: 'maitrise',
      condition_type: 'perfectionniste',
      condition_valeur: 10,
      rarete: 'epique',
      xp_bonus: 400
    },
    {
      nom: 'Polyvalent',
      description: 'Au moins 1 figure validée dans 5 disciplines',
      icone: '🌈',
      couleur: '#673AB7',
      categorie: 'maitrise',
      condition_type: 'manuel',
      condition_valeur: 5,
      rarete: 'epique',
      xp_bonus: 600
    },
    {
      nom: 'Héros du Cirque',
      description: 'Toutes les figures de toutes les disciplines validées',
      icone: '🦸',
      couleur: '#FF9800',
      categorie: 'maitrise',
      condition_type: 'manuel',
      condition_valeur: 1,
      rarete: 'legendaire',
      xp_bonus: 5000
    },

    // Badges Sociaux
    {
      nom: 'Sociable',
      description: 'Accepter une invitation prof',
      icone: '🤝',
      couleur: '#00BCD4',
      categorie: 'social',
      condition_type: 'manuel',
      condition_valeur: 1,
      rarete: 'commun',
      xp_bonus: 25
    },
    {
      nom: 'Bon Élève',
      description: '10 étapes validées sous supervision prof',
      icone: '👨‍🏫',
      couleur: '#009688',
      categorie: 'social',
      condition_type: 'manuel',
      condition_valeur: 10,
      rarete: 'rare',
      xp_bonus: 100
    },

    // Badges Spéciaux
    {
      nom: 'Éclair',
      description: '5 étapes validées en 1 heure',
      icone: '⚡',
      couleur: '#FFEB3B',
      categorie: 'special',
      condition_type: 'manuel',
      condition_valeur: 5,
      rarete: 'rare',
      xp_bonus: 150
    },
    {
      nom: 'Noctambule',
      description: 'Activité entre minuit et 6h du matin',
      icone: '🌙',
      couleur: '#3F51B5',
      categorie: 'special',
      condition_type: 'manuel',
      condition_valeur: 1,
      rarete: 'rare',
      xp_bonus: 100
    },
    {
      nom: 'Early Adopter',
      description: 'Parmi les 100 premiers inscrits',
      icone: '🎁',
      couleur: '#F44336',
      categorie: 'special',
      condition_type: 'manuel',
      condition_valeur: 1,
      rarete: 'legendaire',
      xp_bonus: 1000
    }
  ];

  const createdBadges = [];
  for (const badge of badges) {
    const [createdBadge] = await Badge.findOrCreate({
      where: { nom: badge.nom },
      defaults: badge
    });
    createdBadges.push(createdBadge);
  }

  console.log(`✅ ${createdBadges.length} badges créés/vérifiés`);
  return createdBadges;
}

async function seedTitres() {
  console.log('👑 Création des titres...');

  const titres = [
    {
      nom: 'Novice',
      description: 'Tout le monde commence quelque part',
      couleur: '#9E9E9E',
      condition_type: 'niveau',
      condition_valeur: 1,
      rarete: 'commun'
    },
    {
      nom: 'Acrobate en Herbe',
      description: 'Les premières voltiges',
      couleur: '#4CAF50',
      condition_type: 'niveau',
      condition_valeur: 5,
      rarete: 'commun'
    },
    {
      nom: 'Jongleur Confirmé',
      description: 'L\'art de jongler avec les défis',
      couleur: '#2196F3',
      condition_type: 'niveau',
      condition_valeur: 10,
      rarete: 'rare'
    },
    {
      nom: 'Équilibriste',
      description: 'L\'équilibre entre pratique et perfection',
      couleur: '#9C27B0',
      condition_type: 'niveau',
      condition_valeur: 15,
      rarete: 'rare'
    },
    {
      nom: 'Artiste de Cirque',
      description: 'La maîtrise commence à se voir',
      couleur: '#FF9800',
      condition_type: 'niveau',
      condition_valeur: 20,
      rarete: 'epique'
    },
    {
      nom: 'Maître de Piste',
      description: 'Vous dirigez maintenant le spectacle',
      couleur: '#F44336',
      condition_type: 'niveau',
      condition_valeur: 25,
      rarete: 'epique'
    },
    {
      nom: 'Étoile du Cirque',
      description: 'Tous les regards sont tournés vers vous',
      couleur: '#FFD700',
      condition_type: 'niveau',
      condition_valeur: 35,
      rarete: 'epique'
    },
    {
      nom: 'Légende du Cirque',
      description: 'Votre nom restera dans l\'histoire',
      couleur: '#E91E63',
      condition_type: 'niveau',
      condition_valeur: 50,
      rarete: 'legendaire'
    },
    {
      nom: 'Professeur',
      description: 'Transmettez votre savoir',
      couleur: '#00BCD4',
      condition_type: 'manuel',
      condition_valeur: 1,
      rarete: 'epique'
    }
  ];

  const createdTitres = [];
  for (const titre of titres) {
    const [createdTitre] = await Titre.findOrCreate({
      where: { nom: titre.nom },
      defaults: titre
    });
    createdTitres.push(createdTitre);
  }

  console.log(`✅ ${createdTitres.length} titres créés/vérifiés`);
  return createdTitres;
}

async function seedDefis() {
  console.log('🎯 Création des défis de base...');

  const defis = [
    {
      titre: 'Premier Pas',
      description: 'Validez votre première étape aujourd\'hui!',
      type: 'quotidien',
      objectif: 'Valider au moins 1 étape',
      objectif_type: 'etapes_validees',
      objectif_valeur: 1,
      xp_recompense: 25,
      date_debut: new Date(),
      date_fin: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actif: true
    },
    {
      titre: 'Entraînement Quotidien',
      description: 'Validez 3 étapes aujourd\'hui',
      type: 'quotidien',
      objectif: 'Valider 3 étapes',
      objectif_type: 'etapes_validees',
      objectif_valeur: 3,
      xp_recompense: 50,
      date_debut: new Date(),
      date_fin: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actif: true
    },
    {
      titre: 'Chasseur d\'XP',
      description: 'Gagnez 200 XP aujourd\'hui',
      type: 'quotidien',
      objectif: 'Gagner 200 XP',
      objectif_type: 'xp_gagnes',
      objectif_valeur: 200,
      xp_recompense: 75,
      date_debut: new Date(),
      date_fin: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actif: true
    },
    {
      titre: 'Figure Complète',
      description: 'Validez une figure complète cette semaine',
      type: 'hebdomadaire',
      objectif: 'Valider 1 figure complète',
      objectif_type: 'figures_validees',
      objectif_valeur: 1,
      xp_recompense: 200,
      date_debut: new Date(),
      date_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actif: true
    },
    {
      titre: 'Marathon Hebdomadaire',
      description: 'Accumulez 1000 XP cette semaine',
      type: 'hebdomadaire',
      objectif: 'Gagner 1000 XP',
      objectif_type: 'xp_gagnes',
      objectif_valeur: 1000,
      xp_recompense: 300,
      date_debut: new Date(),
      date_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actif: true
    }
  ];

  // Supprimer les anciens défis pour éviter les doublons
  await Defi.destroy({ where: {} });

  const createdDefis = [];
  for (const defi of defis) {
    const createdDefi = await Defi.create(defi);
    createdDefis.push(createdDefi);
  }

  console.log(`✅ ${createdDefis.length} défis créés`);
  return createdDefis;
}

async function seedRelationsProfEleve(users) {
  console.log('🤝 Création des relations prof-élève...');

  const prof1 = users.find(u => u.email === 'prof.martin@cirque.fr');
  const prof2 = users.find(u => u.email === 'prof.dubois@cirque.fr');

  const alice = users.find(u => u.email === 'alice.petit@eleve.fr');
  const bob = users.find(u => u.email === 'bob.martin@eleve.fr');
  const clara = users.find(u => u.email === 'clara.rousseau@eleve.fr');
  const david = users.find(u => u.email === 'david.bernard@eleve.fr');
  const emma = users.find(u => u.email === 'emma.leroy@eleve.fr');
  const felix = users.find(u => u.email === 'felix.moreau@eleve.fr');
  const gabriel = users.find(u => u.email === 'gabriel.simon@eleve.fr');

  const relations = [
    // Prof Martin - Invitations acceptées
    {
      professeur_id: prof1.id,
      eleve_id: alice.id,
      statut: 'accepte',
      code_invitation: 'MARTIN-ALICE-123',
      date_invitation: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      date_acceptation: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      notes_prof: 'Très motivée, bonne progression en acrobatie'
    },
    {
      professeur_id: prof1.id,
      eleve_id: clara.id,
      statut: 'accepte',
      code_invitation: 'MARTIN-CLARA-456',
      date_invitation: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      date_acceptation: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
      notes_prof: 'Excellente en équilibre, doit travailler le jonglage'
    },
    {
      professeur_id: prof1.id,
      eleve_id: emma.id,
      statut: 'accepte',
      code_invitation: 'MARTIN-EMMA-789',
      date_invitation: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      date_acceptation: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      notes_prof: 'Niveau avancé, très autonome'
    },

    // Prof Martin - Invitation en attente
    {
      professeur_id: prof1.id,
      eleve_id: gabriel.id,
      statut: 'en_attente',
      code_invitation: 'MARTIN-GABRIEL-999',
      date_invitation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },

    // Prof Dubois - Invitations acceptées
    {
      professeur_id: prof2.id,
      eleve_id: bob.id,
      statut: 'accepte',
      code_invitation: 'DUBOIS-BOB-ABC',
      date_invitation: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      date_acceptation: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      notes_prof: 'Débutant enthousiaste'
    },
    {
      professeur_id: prof2.id,
      eleve_id: david.id,
      statut: 'accepte',
      code_invitation: 'DUBOIS-DAVID-DEF',
      date_invitation: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      date_acceptation: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      notes_prof: 'Bon niveau technique'
    },
    {
      professeur_id: prof2.id,
      eleve_id: felix.id,
      statut: 'accepte',
      code_invitation: 'DUBOIS-FELIX-GHI',
      date_invitation: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      date_acceptation: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      notes_prof: 'Excellent élève, progression remarquable'
    },

    // Prof Dubois - Invitation refusée
    {
      professeur_id: prof2.id,
      eleve_id: emma.id,
      statut: 'refuse',
      code_invitation: 'DUBOIS-EMMA-XXX',
      date_invitation: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      date_refus: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
    }
  ];

  const createdRelations = [];
  for (const relation of relations) {
    const [createdRelation] = await RelationProfEleve.findOrCreate({
      where: {
        professeur_id: relation.professeur_id,
        eleve_id: relation.eleve_id
      },
      defaults: relation
    });
    createdRelations.push(createdRelation);
  }

  console.log(`✅ ${createdRelations.length} relations prof-élève créées`);
  return createdRelations;
}

async function seedGroupes(users) {
  console.log('👥 Création des groupes...');

  const prof1 = users.find(u => u.email === 'prof.martin@cirque.fr');
  const prof2 = users.find(u => u.email === 'prof.dubois@cirque.fr');

  const alice = users.find(u => u.email === 'alice.petit@eleve.fr');
  const clara = users.find(u => u.email === 'clara.rousseau@eleve.fr');
  const emma = users.find(u => u.email === 'emma.leroy@eleve.fr');
  const bob = users.find(u => u.email === 'bob.martin@eleve.fr');
  const david = users.find(u => u.email === 'david.bernard@eleve.fr');
  const felix = users.find(u => u.email === 'felix.moreau@eleve.fr');

  // Créer les groupes
  const [groupe1] = await Groupe.findOrCreate({
    where: { nom: 'Débutants 2024' },
    defaults: {
      nom: 'Débutants 2024',
      description: 'Groupe des élèves débutants - Année 2024',
      professeur_id: prof1.id,
      couleur: '#4CAF50'
    }
  });

  const [groupe2] = await Groupe.findOrCreate({
    where: { nom: 'Avancés Lundi/Mercredi' },
    defaults: {
      nom: 'Avancés Lundi/Mercredi',
      description: 'Cours avancés du lundi et mercredi soir',
      professeur_id: prof1.id,
      couleur: '#2196F3'
    }
  });

  const [groupe3] = await Groupe.findOrCreate({
    where: { nom: 'Jonglage Intensif' },
    defaults: {
      nom: 'Jonglage Intensif',
      description: 'Stage intensif de jonglage',
      professeur_id: prof2.id,
      couleur: '#FF9800'
    }
  });

  // Ajouter les membres
  const membres = [
    // Groupe 1 - Débutants
    { groupe_id: groupe1.id, eleve_id: alice.id },
    { groupe_id: groupe1.id, eleve_id: bob.id },

    // Groupe 2 - Avancés
    { groupe_id: groupe2.id, eleve_id: clara.id },
    { groupe_id: groupe2.id, eleve_id: emma.id },

    // Groupe 3 - Jonglage
    { groupe_id: groupe3.id, eleve_id: david.id },
    { groupe_id: groupe3.id, eleve_id: felix.id },
  ];

  for (const membre of membres) {
    await GroupeEleve.findOrCreate({
      where: membre,
      defaults: membre
    });
  }

  console.log(`✅ 3 groupes créés avec leurs membres`);
}

async function seedBadgesUtilisateur(users, badges) {
  console.log('🏅 Attribution des badges aux utilisateurs...');

  const alice = users.find(u => u.email === 'alice.petit@eleve.fr');
  const clara = users.find(u => u.email === 'clara.rousseau@eleve.fr');
  const emma = users.find(u => u.email === 'emma.leroy@eleve.fr');
  const felix = users.find(u => u.email === 'felix.moreau@eleve.fr');

  const premiereEtoile = badges.find(b => b.nom === 'Première Étoile');
  const debutant = badges.find(b => b.nom === 'Débutant');
  const apprenti = badges.find(b => b.nom === 'Apprenti');
  const expert = badges.find(b => b.nom === 'Expert');
  const maitre = badges.find(b => b.nom === 'Maître');
  const rechauffement = badges.find(b => b.nom === 'Réchauffement');
  const enForme = badges.find(b => b.nom === 'En Forme');
  const sociable = badges.find(b => b.nom === 'Sociable');

  const attributions = [
    // Alice (débutante - 250 XP)
    { utilisateur_id: alice.id, badge_id: premiereEtoile.id, date_obtention: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: alice.id, badge_id: debutant.id, date_obtention: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: alice.id, badge_id: sociable.id, date_obtention: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) },

    // Clara (intermédiaire - 800 XP)
    { utilisateur_id: clara.id, badge_id: premiereEtoile.id, date_obtention: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: clara.id, badge_id: debutant.id, date_obtention: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: clara.id, badge_id: apprenti.id, date_obtention: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: clara.id, badge_id: rechauffement.id, date_obtention: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: clara.id, badge_id: sociable.id, date_obtention: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000) },

    // Emma (avancée - 3200 XP)
    { utilisateur_id: emma.id, badge_id: premiereEtoile.id, date_obtention: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: emma.id, badge_id: debutant.id, date_obtention: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: emma.id, badge_id: apprenti.id, date_obtention: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: emma.id, badge_id: expert.id, date_obtention: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: emma.id, badge_id: rechauffement.id, date_obtention: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: emma.id, badge_id: enForme.id, date_obtention: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: emma.id, badge_id: sociable.id, date_obtention: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },

    // Felix (expert - 6500 XP)
    { utilisateur_id: felix.id, badge_id: premiereEtoile.id, date_obtention: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: felix.id, badge_id: debutant.id, date_obtention: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: felix.id, badge_id: apprenti.id, date_obtention: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: felix.id, badge_id: expert.id, date_obtention: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: felix.id, badge_id: maitre.id, date_obtention: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: felix.id, badge_id: rechauffement.id, date_obtention: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: felix.id, badge_id: enForme.id, date_obtention: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000) },
    { utilisateur_id: felix.id, badge_id: sociable.id, date_obtention: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000) },
  ];

  for (const attribution of attributions) {
    await BadgeUtilisateur.findOrCreate({
      where: {
        utilisateur_id: attribution.utilisateur_id,
        badge_id: attribution.badge_id
      },
      defaults: attribution
    });
  }

  console.log(`✅ ${attributions.length} badges attribués aux utilisateurs`);
}

async function seedTitresUtilisateur(users, titres) {
  console.log('🎖️  Attribution des titres aux utilisateurs...');

  const alice = users.find(u => u.email === 'alice.petit@eleve.fr');
  const clara = users.find(u => u.email === 'clara.rousseau@eleve.fr');
  const emma = users.find(u => u.email === 'emma.leroy@eleve.fr');
  const felix = users.find(u => u.email === 'felix.moreau@eleve.fr');

  const novice = titres.find(t => t.nom === 'Novice');
  const acrobateHerbe = titres.find(t => t.nom === 'Acrobate en Herbe');
  const jongleurConfirme = titres.find(t => t.nom === 'Jongleur Confirmé');
  const equilibriste = titres.find(t => t.nom === 'Équilibriste');
  const artiste = titres.find(t => t.nom === 'Artiste de Cirque');
  const maitrePiste = titres.find(t => t.nom === 'Maître de Piste');

  const attributions = [
    // Alice (niveau 3)
    { utilisateur_id: alice.id, titre_id: novice.id, date_obtention: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), equipe: true },

    // Clara (niveau 8)
    { utilisateur_id: clara.id, titre_id: novice.id, date_obtention: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: clara.id, titre_id: acrobateHerbe.id, date_obtention: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), equipe: true },

    // Emma (niveau 18)
    { utilisateur_id: emma.id, titre_id: novice.id, date_obtention: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: emma.id, titre_id: acrobateHerbe.id, date_obtention: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: emma.id, titre_id: jongleurConfirme.id, date_obtention: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: emma.id, titre_id: equilibriste.id, date_obtention: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), equipe: true },

    // Felix (niveau 25)
    { utilisateur_id: felix.id, titre_id: novice.id, date_obtention: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: felix.id, titre_id: acrobateHerbe.id, date_obtention: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: felix.id, titre_id: jongleurConfirme.id, date_obtention: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: felix.id, titre_id: equilibriste.id, date_obtention: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: felix.id, titre_id: artiste.id, date_obtention: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), equipe: false },
    { utilisateur_id: felix.id, titre_id: maitrePiste.id, date_obtention: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), equipe: true },
  ];

  for (const attribution of attributions) {
    await TitreUtilisateur.findOrCreate({
      where: {
        utilisateur_id: attribution.utilisateur_id,
        titre_id: attribution.titre_id
      },
      defaults: attribution
    });
  }

  console.log(`✅ ${attributions.length} titres attribués aux utilisateurs`);
}

async function seedDefisUtilisateur(users, defis) {
  console.log('🎯 Attribution des défis aux utilisateurs...');

  const alice = users.find(u => u.email === 'alice.petit@eleve.fr');
  const clara = users.find(u => u.email === 'clara.rousseau@eleve.fr');
  const emma = users.find(u => u.email === 'emma.leroy@eleve.fr');
  const felix = users.find(u => u.email === 'felix.moreau@eleve.fr');

  const attributions = [
    // Alice - en cours sur défis quotidiens
    { utilisateur_id: alice.id, defi_id: defis[0].id, progression: 1, complete: true, date_completion: new Date() },
    { utilisateur_id: alice.id, defi_id: defis[1].id, progression: 2, complete: false },
    { utilisateur_id: alice.id, defi_id: defis[2].id, progression: 150, complete: false },

    // Clara - mix complété/en cours
    { utilisateur_id: clara.id, defi_id: defis[0].id, progression: 1, complete: true, date_completion: new Date() },
    { utilisateur_id: clara.id, defi_id: defis[1].id, progression: 3, complete: true, date_completion: new Date() },
    { utilisateur_id: clara.id, defi_id: defis[2].id, progression: 200, complete: true, date_completion: new Date() },
    { utilisateur_id: clara.id, defi_id: defis[3].id, progression: 0, complete: false },

    // Emma - plusieurs défis complétés
    { utilisateur_id: emma.id, defi_id: defis[0].id, progression: 1, complete: true, date_completion: new Date() },
    { utilisateur_id: emma.id, defi_id: defis[1].id, progression: 3, complete: true, date_completion: new Date() },
    { utilisateur_id: emma.id, defi_id: defis[2].id, progression: 200, complete: true, date_completion: new Date() },
    { utilisateur_id: emma.id, defi_id: defis[3].id, progression: 1, complete: true, date_completion: new Date() },
    { utilisateur_id: emma.id, defi_id: defis[4].id, progression: 750, complete: false },

    // Felix - très actif
    { utilisateur_id: felix.id, defi_id: defis[0].id, progression: 1, complete: true, date_completion: new Date() },
    { utilisateur_id: felix.id, defi_id: defis[1].id, progression: 3, complete: true, date_completion: new Date() },
    { utilisateur_id: felix.id, defi_id: defis[2].id, progression: 200, complete: true, date_completion: new Date() },
    { utilisateur_id: felix.id, defi_id: defis[3].id, progression: 1, complete: true, date_completion: new Date() },
    { utilisateur_id: felix.id, defi_id: defis[4].id, progression: 1000, complete: true, date_completion: new Date() },
  ];

  for (const attribution of attributions) {
    await DefiUtilisateur.findOrCreate({
      where: {
        utilisateur_id: attribution.utilisateur_id,
        defi_id: attribution.defi_id
      },
      defaults: attribution
    });
  }

  console.log(`✅ ${attributions.length} défis attribués aux utilisateurs`);
}

async function seedStreaks(users) {
  console.log('🔥 Création des streaks...');

  const alice = users.find(u => u.email === 'alice.petit@eleve.fr');
  const clara = users.find(u => u.email === 'clara.rousseau@eleve.fr');
  const emma = users.find(u => u.email === 'emma.leroy@eleve.fr');
  const felix = users.find(u => u.email === 'felix.moreau@eleve.fr');

  const streaks = [
    {
      utilisateur_id: alice.id,
      jours_consecutifs: 5,
      derniere_activite: new Date(),
      record_personnel: 8
    },
    {
      utilisateur_id: clara.id,
      jours_consecutifs: 12,
      derniere_activite: new Date(),
      record_personnel: 15
    },
    {
      utilisateur_id: emma.id,
      jours_consecutifs: 23,
      derniere_activite: new Date(),
      record_personnel: 45
    },
    {
      utilisateur_id: felix.id,
      jours_consecutifs: 38,
      derniere_activite: new Date(),
      record_personnel: 62
    }
  ];

  for (const streak of streaks) {
    await Streak.findOrCreate({
      where: { utilisateur_id: streak.utilisateur_id },
      defaults: streak
    });
  }

  console.log(`✅ ${streaks.length} streaks créés`);
}

async function main() {
  console.log('🚀 Début du seeding complet de gamification...\n');

  try {
    // Créer les utilisateurs
    const users = await seedUtilisateurs();

    // Créer les badges, titres et défis
    const badges = await seedBadges();
    const titres = await seedTitres();
    const defis = await seedDefis();

    // Créer les relations
    await seedRelationsProfEleve(users);
    await seedGroupes(users);

    // Attribuer les éléments de gamification
    await seedBadgesUtilisateur(users, badges);
    await seedTitresUtilisateur(users, titres);
    await seedDefisUtilisateur(users, defis);
    await seedStreaks(users);

    console.log('\n✅ Seeding terminé avec succès!');
    console.log('\n📊 Résumé de la base de données:');

    const badgeCount = await Badge.count();
    const titreCount = await Titre.count();
    const defiCount = await Defi.count();
    const userCount = await Utilisateur.count();
    const relationCount = await RelationProfEleve.count();
    const groupeCount = await Groupe.count();

    console.log(`- ${userCount} utilisateurs (2 profs + 7 élèves)`);
    console.log(`- ${badgeCount} badges`);
    console.log(`- ${titreCount} titres`);
    console.log(`- ${defiCount} défis actifs`);
    console.log(`- ${relationCount} relations prof-élève`);
    console.log(`- ${groupeCount} groupes`);

    console.log('\n👥 Comptes de test:');
    console.log('Professeurs:');
    console.log('  - prof.martin@cirque.fr / password123');
    console.log('  - prof.dubois@cirque.fr / password123');
    console.log('\nÉlèves:');
    console.log('  - alice.petit@eleve.fr / password123 (débutante)');
    console.log('  - clara.rousseau@eleve.fr / password123 (intermédiaire)');
    console.log('  - emma.leroy@eleve.fr / password123 (avancée)');
    console.log('  - felix.moreau@eleve.fr / password123 (expert)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
