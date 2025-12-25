module.exports = [
  // Administrateur (1)
  { nom: 'Cirque', prenom: 'Admin', email: 'admin.cirque@admin.fr', role: 'admin', niveau: 25, xp_total: 10000 },

  // Professeurs (3)
  { nom: 'Dubois', prenom: 'Marie', email: 'marie.dubois@prof.fr', role: 'professeur', niveau: 20, xp_total: 5000 },
  { nom: 'Martin', prenom: 'Jean', email: 'jean.martin@prof.fr', role: 'professeur', niveau: 22, xp_total: 6000 },
  { nom: 'Petit', prenom: 'Sophie', email: 'sophie.petit@prof.fr', role: 'professeur', niveau: 18, xp_total: 4500 },

  // Élèves - At Risk (3)
  { nom: 'Leroy', prenom: 'Lucas', email: 'lucas.leroy@eleve.fr', role: 'eleve', scenario: 'at_risk', niveau: 5, xp_total: 300 },
  { nom: 'Bernard', prenom: 'Emma', email: 'emma.bernard@eleve.fr', role: 'eleve', scenario: 'at_risk', niveau: 8, xp_total: 650 },
  { nom: 'Rousseau', prenom: 'Hugo', email: 'hugo.rousseau@eleve.fr', role: 'eleve', scenario: 'at_risk', niveau: 6, xp_total: 480 },

  // Élèves - Stable (4)
  { nom: 'Moreau', prenom: 'Léa', email: 'lea.moreau@eleve.fr', role: 'eleve', scenario: 'stable', niveau: 10, xp_total: 1200 },
  { nom: 'Simon', prenom: 'Nathan', email: 'nathan.simon@eleve.fr', role: 'eleve', scenario: 'stable', niveau: 12, xp_total: 1500 },
  { nom: 'Laurent', prenom: 'Chloé', email: 'chloe.laurent@eleve.fr', role: 'eleve', scenario: 'stable', niveau: 9, xp_total: 950 },
  { nom: 'Michel', prenom: 'Louis', email: 'louis.michel@eleve.fr', role: 'eleve', scenario: 'stable', niveau: 11, xp_total: 1350 },

  // Élèves - Progressing (3)
  { nom: 'Garcia', prenom: 'Camille', email: 'camille.garcia@eleve.fr', role: 'eleve', scenario: 'progressing', niveau: 7, xp_total: 720 },
  { nom: 'Roux', prenom: 'Tom', email: 'tom.roux@eleve.fr', role: 'eleve', scenario: 'progressing', niveau: 14, xp_total: 1800 },
  { nom: 'Fournier', prenom: 'Inès', email: 'ines.fournier@eleve.fr', role: 'eleve', scenario: 'progressing', niveau: 13, xp_total: 1650 },

  // Élèves - Specialist (2)
  { nom: 'Girard', prenom: 'Arthur', email: 'arthur.girard@eleve.fr', role: 'eleve', scenario: 'specialist_juggling', niveau: 15, xp_total: 2100 },
  { nom: 'Bonnet', prenom: 'Manon', email: 'manon.bonnet@eleve.fr', role: 'eleve', scenario: 'specialist_aerial', niveau: 16, xp_total: 2300 },

  // Élèves - Balanced (2)
  { nom: 'Blanc', prenom: 'Jules', email: 'jules.blanc@eleve.fr', role: 'eleve', scenario: 'balanced', niveau: 17, xp_total: 2600 },
  { nom: 'Fontaine', prenom: 'Sarah', email: 'sarah.fontaine@eleve.fr', role: 'eleve', scenario: 'balanced', niveau: 18, xp_total: 2850 },

  // Élèves - Low Safety (1)
  { nom: 'Durand', prenom: 'Maxime', email: 'maxime.durand@eleve.fr', role: 'eleve', scenario: 'low_safety', niveau: 8, xp_total: 700 }
];
