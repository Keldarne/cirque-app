# Plan Seed Data - Deux Écoles de Test

## Objectif

Adapter le seed actuel pour créer **2 écoles complètes** avec utilisateurs, figures, progressions, relations, et abonnements pour tester l'isolation multi-tenant.

---

## Structure Seed Data

### 1. École A - "École de Cirque Voltige" (Plan Basic)

**Caractéristiques:**
- Plan: Basic (29€/mois)
- Statut: Actif
- 2 professeurs
- 25 élèves (moitié de la limite 50)
- Mix de progressions (décrochage, stable, en progression)

**Professeurs:**
1. **Jean Martin** (jean.martin@voltige.fr) - Professeur principal
2. **Sophie Dubois** (sophie.dubois@voltige.fr) - Professeur adjoint

**Élèves (25) - Profils variés:**
- **5 en décrochage** (at_risk: ratio < 0.5, activité faible)
  - Lucas Moreau, Emma Bernard, Noah Petit, Léa Roux, Hugo Garcia

- **10 stables** (ratio ~1.0, progression régulière)
  - Chloé Martin, Louis Durand, Manon Leroy, Tom Fournier, Camille Simon, etc.

- **5 en forte progression** (ratio > 1.5, très actif)
  - Alice Lambert, Maxime Morel, Inès Laurent, Gabriel André, Zoé Michel

- **5 spécialistes** (focus une discipline)
  - Paul Girard, Sarah Bonnet, Théo Dupont, Clara Fontaine, Jules Mercier

**Figures:**
- Accès au catalogue public (créé par seed)
- 10 figures personnalisées créées par Jean Martin (visibilité: 'ecole')
- 5 figures personnalisées créées par Sophie Dubois

**Groupes:**
- Groupe "Débutants" (10 élèves) - géré par Jean
- Groupe "Intermédiaires" (10 élèves) - géré par Sophie
- Groupe "Avancés" (5 élèves) - géré par Jean

**Abonnement:**
- Plan: basic
- Type facturation: mensuel
- Statut: actif
- Date prochain paiement: Dans 15 jours
- Montant: 29.00€

---

### 2. École B - "Académie des Arts du Cirque" (Plan Premium)

**Caractéristiques:**
- Plan: Premium (79€/mois)
- Statut: Trial (J+7 sur 14)
- 4 professeurs
- 80 élèves (40% de la limite 200)
- École plus grande, plus de variété

**Professeurs:**
1. **Marie Lefebvre** (marie.lefebvre@academie.fr) - Directrice pédagogique
2. **Pierre Rousseau** (pierre.rousseau@academie.fr) - Spécialiste aérien
3. **Lucie Blanc** (lucie.blanc@academie.fr) - Spécialiste jonglage
4. **Thomas Faure** (thomas.faure@academie.fr) - Renforcement physique

**Élèves (80) - Distribution réaliste:**
- **10 en décrochage** (12.5%)
- **50 stables** (62.5%)
- **15 en progression** (18.75%)
- **5 spécialistes élites** (6.25%)

**Figures:**
- Accès catalogue public
- 25 figures personnalisées (Marie: 10, Pierre: 8, Lucie: 5, Thomas: 2)
- Config branding: Logo custom, couleur thème #e91e63

**Groupes:**
- 8 groupes au total (2 par professeur)
- Groupes thématiques par discipline

**Abonnement:**
- Plan: premium
- Type facturation: annuel
- Statut: trial
- Date fin trial: Dans 7 jours
- Montant: 79.00€/mois (ou 790€/an)

---

### 3. Utilisateurs Solo (5)

**Caractéristiques:**
- ecole_id: NULL
- plan_solo: 'solo'
- Pas de professeurs ni élèves liés
- Progressions individuelles

**Utilisateurs:**
1. **Artiste Solo 1** - Alex Mercier (alex.mercier@solo.fr)
   - Statut: actif
   - Spécialité: Aérien
   - 15 figures validées

2. **Artiste Solo 2** - Nadia Perrin (nadia.perrin@solo.fr)
   - Statut: actif
   - Spécialité: Jonglage
   - 22 figures validées

3. **Artiste Solo 3** - Karim Dubois (karim.dubois@solo.fr)
   - Statut: trial (J+10)
   - Débutant
   - 3 figures validées

4. **Artiste Solo 4** - Léa Fontaine (lea.fontaine@solo.fr)
   - Statut: suspendu (échec paiement)
   - 8 figures validées

5. **Artiste Solo 5** - Marc Laurent (marc.laurent@solo.fr)
   - Statut: actif
   - Équilibre
   - 12 figures validées

---

## Catalogue Public (Commun à tous)

**Disciplines (7):**
1. Aérien
2. Jonglerie
3. Équilibre
4. Acrobatie
5. Renforcement
6. Souplesse
7. Main à main

**Figures Publiques (30) - Créées par admin global:**
- 5 figures par discipline
- Mix difficulty_level (1-5)
- Mix type ('technique', 'renforcement')
- visibilite: 'public'
- ecole_id: NULL

**Badges Publics (15):**
- "Première Figure" (obtenu par tous débutants)
- "10 Figures Validées"
- "Expert Aérien" (10 figures aériennes)
- "Jongleur Confirmé"
- etc.

**Défis Publics (10):**
- "Défi Hebdomadaire - Semaine 1"
- "Défi Mensuel - Janvier 2025"
- "Challenge Renforcement"
- etc.

**Titres Publics (12):**
- "Débutant" (0-10 XP)
- "Apprenti" (10-50 XP)
- "Artiste" (50-200 XP)
- etc.

---

## Implémentation Seed

### Fichier Principal: `seed/index.js`

```javascript
const sequelize = require('../db');
const {
  Ecole,
  Utilisateur,
  Discipline,
  Figure,
  Badge,
  Titre,
  Defi,
  Facture,
  TransactionPaiement
} = require('../models');

const seedEcoles = require('./seedEcoles');
const seedCataloguePublic = require('./seedCataloguePublic');
const seedEcoleVoltige = require('./seedEcoleVoltige');
const seedAcademieCircus = require('./seedAcademieCircus');
const seedUtilisateursSolo = require('./seedUtilisateursSolo');

async function seed() {
  try {
    console.log('🌱 Début du seed...\n');

    // 1. Seed catalogue public (disciplines, figures, badges, défis, titres)
    console.log('📚 Seed catalogue public...');
    await seedCataloguePublic();

    // 2. Créer École A - Voltige
    console.log('\n🎪 Seed École Voltige (Basic)...');
    const ecoleVoltige = await seedEcoles.creerEcole({
      nom: 'École de Cirque Voltige',
      slug: 'ecole-voltige',
      plan: 'basic',
      type_facturation: 'mensuel',
      statut_abonnement: 'actif',
      montant_mensuel: 29.00,
      max_eleves: 50,
      max_professeurs: 3,
      max_stockage_gb: 20,
      date_prochain_paiement: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    });

    await seedEcoleVoltige(ecoleVoltige.id);

    // 3. Créer École B - Académie
    console.log('\n🎭 Seed Académie des Arts du Cirque (Premium Trial)...');
    const academie = await seedEcoles.creerEcole({
      nom: 'Académie des Arts du Cirque',
      slug: 'academie-cirque',
      plan: 'premium',
      type_facturation: 'annuel',
      statut_abonnement: 'trial',
      montant_mensuel: 79.00,
      max_eleves: 200,
      max_professeurs: null, // illimité
      max_stockage_gb: 50,
      date_debut_trial: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      date_fin_trial: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      config: {
        branding: {
          couleur_theme: '#e91e63',
          logo_url: 'https://example.com/logo-academie.png'
        }
      }
    });

    await seedAcademieCircus(academie.id);

    // 4. Créer utilisateurs solo
    console.log('\n👤 Seed utilisateurs solo...');
    await seedUtilisateursSolo();

    console.log('\n✅ Seed terminé avec succès!');
    console.log('\n=== COMPTES DE TEST ===');
    console.log('\n🎪 École Voltige (Basic - Actif):');
    console.log('Prof: jean.martin@voltige.fr / Password123!');
    console.log('Élève: lucas.moreau@voltige.fr / Password123!');
    console.log('\n🎭 Académie Cirque (Premium - Trial J+7):');
    console.log('Prof: marie.lefebvre@academie.fr / Password123!');
    console.log('Élève: student1@academie.fr / Password123!');
    console.log('\n👤 Solo:');
    console.log('alex.mercier@solo.fr / Password123!');

  } catch (error) {
    console.error('❌ Erreur seed:', error);
    throw error;
  }
}

// Exécuter
seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
```

### Module: `seed/seedEcoles.js`

```javascript
const { Ecole } = require('../models');

async function creerEcole(data) {
  const ecole = await Ecole.create(data);
  console.log(`✅ École créée: ${ecole.nom} (ID: ${ecole.id})`);
  return ecole;
}

module.exports = { creerEcole };
```

### Module: `seed/seedCataloguePublic.js`

```javascript
const { Discipline, Figure, Badge, Titre, Defi } = require('../models');

async function seedCataloguePublic() {
  // Disciplines
  const disciplines = await Discipline.bulkCreate([
    { nom: 'Aérien' },
    { nom: 'Jonglerie' },
    { nom: 'Équilibre' },
    { nom: 'Acrobatie' },
    { nom: 'Renforcement' },
    { nom: 'Souplesse' },
    { nom: 'Main à main' }
  ]);

  console.log(`✅ ${disciplines.length} disciplines créées`);

  // Figures publiques (5 par discipline)
  const figures = [];
  for (const discipline of disciplines) {
    for (let i = 1; i <= 5; i++) {
      figures.push({
        nom: `${discipline.nom} - Figure ${i}`,
        descriptif: `Figure publique de ${discipline.nom} niveau ${i}`,
        discipline_id: discipline.id,
        difficulty_level: i,
        type: i === 5 ? 'renforcement' : 'technique',
        visibilite: 'public',
        ecole_id: null,
        createur_id: null
      });
    }
  }

  await Figure.bulkCreate(figures);
  console.log(`✅ ${figures.length} figures publiques créées`);

  // Badges publics
  await Badge.bulkCreate([
    { nom: 'Première Figure', description: 'Validé votre première figure', icone: '🎯', condition: 'figures_validees >= 1' },
    { nom: '10 Figures', description: '10 figures validées', icone: '⭐', condition: 'figures_validees >= 10' },
    { nom: 'Expert Aérien', description: '10 figures aériennes validées', icone: '🦅', condition: 'aerien >= 10' },
    { nom: 'Jongleur Pro', description: '15 figures jonglerie', icone: '🤹', condition: 'jonglerie >= 15' }
  ]);

  console.log('✅ Badges publics créés');

  // Titres publics
  await Titre.bulkCreate([
    { nom: 'Débutant', description: 'Premiers pas', icone: '🌱', xp_requis: 0 },
    { nom: 'Apprenti', description: 'En apprentissage', icone: '📚', xp_requis: 10 },
    { nom: 'Artiste', description: 'Artiste confirmé', icone: '🎨', xp_requis: 50 },
    { nom: 'Maître', description: 'Maître du cirque', icone: '👑', xp_requis: 200 }
  ]);

  console.log('✅ Titres publics créés');

  // Défis publics
  await Defi.bulkCreate([
    { nom: 'Défi Hebdo S1', description: 'Valider 5 figures cette semaine', type: 'hebdomadaire', xp_recompense: 50 },
    { nom: 'Challenge Renforcement', description: '10 figures renforcement', type: 'special', xp_recompense: 100 }
  ]);

  console.log('✅ Défis publics créés');
}

module.exports = seedCataloguePublic;
```

### Module: `seed/seedEcoleVoltige.js`

```javascript
const { Utilisateur, Figure, Groupe, GroupeEleve, RelationProfEleve, ProgressionUtilisateur, Facture } = require('../models');
const bcrypt = require('bcrypt');

async function seedEcoleVoltige(ecoleId) {
  // Professeurs
  const prof1 = await Utilisateur.create({
    nom: 'Martin',
    prenom: 'Jean',
    email: 'jean.martin@voltige.fr',
    mot_de_passe: 'Password123!',
    role: 'professeur',
    ecole_id: ecoleId,
    niveau: 5,
    xp_total: 1000
  });

  const prof2 = await Utilisateur.create({
    nom: 'Dubois',
    prenom: 'Sophie',
    email: 'sophie.dubois@voltige.fr',
    mot_de_passe: 'Password123!',
    role: 'professeur',
    ecole_id: ecoleId,
    niveau: 4,
    xp_total: 750
  });

  console.log(`✅ 2 professeurs créés`);

  // Élèves (25)
  const elevesData = [
    // 5 en décrochage
    { nom: 'Moreau', prenom: 'Lucas', email: 'lucas.moreau@voltige.fr', xp_total: 50, niveau: 1 },
    { nom: 'Bernard', prenom: 'Emma', email: 'emma.bernard@voltige.fr', xp_total: 45, niveau: 1 },
    { nom: 'Petit', prenom: 'Noah', email: 'noah.petit@voltige.fr', xp_total: 30, niveau: 1 },
    { nom: 'Roux', prenom: 'Léa', email: 'lea.roux@voltige.fr', xp_total: 25, niveau: 1 },
    { nom: 'Garcia', prenom: 'Hugo', email: 'hugo.garcia@voltige.fr', xp_total: 40, niveau: 1 },

    // 10 stables (simplifié - générer programmatiquement)
    ...Array.from({ length: 10 }, (_, i) => ({
      nom: `Stable${i+1}`,
      prenom: `Élève`,
      email: `stable${i+1}@voltige.fr`,
      xp_total: 100 + i * 10,
      niveau: 2
    })),

    // 5 en progression
    ...Array.from({ length: 5 }, (_, i) => ({
      nom: `Progressif${i+1}`,
      prenom: `Élève`,
      email: `progressif${i+1}@voltige.fr`,
      xp_total: 200 + i * 20,
      niveau: 3
    })),

    // 5 spécialistes
    ...Array.from({ length: 5 }, (_, i) => ({
      nom: `Specialiste${i+1}`,
      prenom: `Élève`,
      email: `specialiste${i+1}@voltige.fr`,
      xp_total: 300 + i * 30,
      niveau: 4
    }))
  ];

  const eleves = [];
  for (const eleveData of elevesData) {
    const eleve = await Utilisateur.create({
      ...eleveData,
      mot_de_passe: 'Password123!',
      role: 'eleve',
      ecole_id: ecoleId
    });
    eleves.push(eleve);

    // Créer relation prof-élève (avec prof1)
    await RelationProfEleve.create({
      professeur_id: prof1.id,
      eleve_id: eleve.id,
      statut: 'accepte',
      actif: true,
      date_acceptation: new Date()
    });
  }

  console.log(`✅ ${eleves.length} élèves créés`);

  // Figures personnalisées école
  const figuresEcole = [];
  for (let i = 1; i <= 10; i++) {
    figuresEcole.push({
      nom: `Figure Voltige ${i}`,
      descriptif: `Figure personnalisée école`,
      discipline_id: 1 + (i % 3), // Alterner disciplines
      difficulty_level: Math.ceil(i / 2),
      type: 'technique',
      visibilite: 'ecole',
      ecole_id: ecoleId,
      createur_id: prof1.id
    });
  }

  await Figure.bulkCreate(figuresEcole);
  console.log(`✅ ${figuresEcole.length} figures école créées`);

  // Groupes
  const groupe1 = await Groupe.create({
    nom: 'Débutants',
    description: 'Groupe débutants',
    professeur_id: prof1.id,
    actif: true
  });

  const groupe2 = await Groupe.create({
    nom: 'Intermédiaires',
    description: 'Groupe intermédiaires',
    professeur_id: prof2.id,
    actif: true
  });

  // Ajouter élèves aux groupes (10 chacun)
  for (let i = 0; i < 10; i++) {
    await GroupeEleve.create({
      groupe_id: groupe1.id,
      eleve_id: eleves[i].id
    });
  }

  for (let i = 10; i < 20; i++) {
    await GroupeEleve.create({
      groupe_id: groupe2.id,
      eleve_id: eleves[i].id
    });
  }

  console.log(`✅ 2 groupes créés avec élèves assignés`);

  // Créer facture pour paiement actif
  await Facture.create({
    numero_facture: 'FACT-2025-0001',
    ecole_id: ecoleId,
    montant_ht: 24.17,
    montant_tva: 4.83,
    montant_ttc: 29.00,
    date_emission: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    date_echeance: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    periode_debut: new Date(),
    periode_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    description: 'Abonnement Plan Basic - Janvier 2025',
    plan: 'basic',
    type_facturation: 'mensuel',
    statut: 'payee',
    date_paiement: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  });

  console.log('✅ Facture créée (payée)');
}

module.exports = seedEcoleVoltige;
```

### Module: `seed/seedAcademieCircus.js`

Structure similaire mais avec 4 profs et 80 élèves.

### Module: `seed/seedUtilisateursSolo.js`

```javascript
const { Utilisateur } = require('../models');

async function seedUtilisateursSolo() {
  const solos = [
    { nom: 'Mercier', prenom: 'Alex', email: 'alex.mercier@solo.fr', statut: 'actif', xp_total: 150 },
    { nom: 'Perrin', prenom: 'Nadia', email: 'nadia.perrin@solo.fr', statut: 'actif', xp_total: 220 },
    { nom: 'Dubois', prenom: 'Karim', email: 'karim.dubois@solo.fr', statut: 'trial', xp_total: 30 },
    { nom: 'Fontaine', prenom: 'Léa', email: 'lea.fontaine@solo.fr', statut: 'suspendu', xp_total: 80 },
    { nom: 'Laurent', prenom: 'Marc', email: 'marc.laurent@solo.fr', statut: 'actif', xp_total: 120 }
  ];

  for (const soloData of solos) {
    await Utilisateur.create({
      ...soloData,
      mot_de_passe: 'Password123!',
      role: 'eleve',
      ecole_id: null, // NULL = solo
      plan_solo: 'solo',
      statut_abonnement_solo: soloData.statut,
      date_prochain_paiement_solo: soloData.statut === 'actif'
        ? new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        : null
    });
  }

  console.log(`✅ ${solos.length} utilisateurs solo créés`);
}

module.exports = seedUtilisateursSolo;
```

---

## Commandes NPM

```json
{
  "scripts": {
    "reset-db": "node utilitaires-reset-db.js",
    "seed": "node seed/index.js",
    "reset-and-seed": "npm run reset-db && npm run seed"
  }
}
```

**Utilisation:**
```bash
npm run reset-and-seed
```

---

## Tests de Validation Post-Seed

### 1. Isolation Données
```bash
# Se connecter comme prof École Voltige
curl -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.martin@voltige.fr","mot_de_passe":"Password123!"}'

# Récupérer élèves (doit voir 25 élèves Voltige, PAS ceux Académie)
curl -X GET http://localhost:4000/prof/eleves \
  -H "Authorization: Bearer <token>"
```

### 2. Catalogue Commun
```bash
# Se connecter comme élève École Académie
# Récupérer figures (doit voir publiques + figures Académie, PAS Voltige)
curl -X GET http://localhost:4000/figures \
  -H "Authorization: Bearer <token>"
```

### 3. Dashboard Admin
```bash
# Se connecter comme admin
# Voir métriques
curl -X GET http://localhost:4000/admin/paiements/dashboard \
  -H "Authorization: Bearer <token>"

# Résultat attendu:
# {
#   mrr: 153.00,  // (29 Voltige + 79 Académie + 5*9 Solo)
#   repartition: {
#     solo: 45,
#     basic: 29,
#     premium: 79
#   },
#   alertes: {
#     payments_echoues: 1,  // Léa Fontaine suspendue
#     trials_bientot_finis: 2  // Académie J+7, Karim J+10
#   }
# }
```

---

## Données Résumées

| Type | Nombre | Notes |
|------|--------|-------|
| Écoles | 2 | Voltige (Basic), Académie (Premium Trial) |
| Utilisateurs Solo | 5 | 3 actifs, 1 trial, 1 suspendu |
| Total Professeurs | 6 | 2 Voltige, 4 Académie |
| Total Élèves | 105 | 25 Voltige, 80 Académie |
| Disciplines | 7 | Partagées (catalogue public) |
| Figures Publiques | 35 | (7 disciplines × 5) |
| Figures École Voltige | 15 | Privées Voltige |
| Figures École Académie | 25 | Privées Académie |
| Groupes | 10 | 2 Voltige, 8 Académie |
| Badges Publics | 15 | |
| Titres Publics | 12 | |
| Défis Publics | 10 | |

**Total utilisateurs:** 116 (6 profs + 105 élèves + 5 solo)

**MRR attendu:** ~153€/mois
