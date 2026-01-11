/**
 * Multi-Tenant Seed Orchestrator
 *
 * Structure:
 * 1. Écoles (2 test schools)
 * 2. Catalogue Public (disciplines, figures)
 * 3. Users par école (professeurs, élèves)
 * 4. Données école-specific (progressions, groupes, relations)
 * 5. Solo users (utilisateurs sans école)
 */

const seedEcoles = require('./modules/seedEcoles');
const { seedCataloguePublic, createSchoolSpecificFigures } = require('./modules/seedCataloguePublic');
const seedUtilisateurs = require('./modules/seedUtilisateurs');
const seedRelations = require('./modules/seedRelations');
const seedProgressions = require('./modules/seedProgressions');
const seedInteractions = require('./modules/seedInteractions');
const seedTentatives = require('./modules/seedTentatives');
const seedProgrammes = require('./modules/seedProgrammes');
const seedExercicesDecomposes = require('./modules/seedExercicesDecomposes');
const seedDisciplineAvailability = require('./modules/seedDisciplineAvailability');

const logger = require('./utils/logger');
const scenarioDefinitions = require('./data/scenarios');

async function displaySummary(ecoles, catalogue, users, schoolFigures) {
  const { ExerciceFigure } = require('../src/models');

  logger.header('SEED SUMMARY - Multi-Tenant Architecture OPTIMISÉ');

  console.log('🏫 ÉCOLES:');
  console.log(`  - ${ecoles.voltige.nom} (${ecoles.voltige.plan} - ${ecoles.voltige.statut_abonnement})`);
  console.log(`  - ${ecoles.academie.nom} (${ecoles.academie.plan} - ${ecoles.academie.statut_abonnement})`);
  console.log(`    Trial expire dans: ${ecoles.academie.joursRestantsTrial()} jours\n`);

  console.log('📚 CATALOGUE PUBLIC:');
  console.log(`  - ${catalogue.disciplines.length} disciplines`);
  console.log(`  - ${catalogue.figures.length} figures publiques`);

  // Statistiques exercices décomposés
  const totalRelations = await ExerciceFigure.count();
  const figuresAvecExercices = await ExerciceFigure.count({
    distinct: true,
    col: 'figure_id'
  });
  console.log(`  - ${totalRelations} relations exercices-figures (${figuresAvecExercices} figures avec prérequis)\n`);

  console.log('🏫 FIGURES ÉCOLE-SPÉCIFIQUES:');
  console.log(`  - École Voltige: ${schoolFigures.voltige.length} figures`);
  console.log(`  - Académie: ${schoolFigures.academie.length} figures\n`);

  console.log('👥 UTILISATEURS (RÉDUIT 29→16):');
  console.log(`  - 1 admin global`);
  console.log(`  - 1 school admin (École Voltige)`);
  console.log(`  - École Voltige: ${users.voltige.professeurs.length} profs, ${users.voltige.eleves.length} élèves`);
  console.log(`  - Académie: ${users.academie.professeurs.length} profs, ${users.academie.eleves.length} élèves`);
  console.log(`  - ${users.solo.length} utilisateurs solo\n`);

  console.log('✅ DATABASE READY TO USE!');
  console.log('   → Vous pouvez maintenant vous connecter sur le frontend');
  console.log('   → Système de suggestions intelligent activé\n');
}

async function runSeed() {
  logger.header('Starting Multi-Tenant Seed - OPTIMISÉ (16 users, <10s)');

  try {
    // Step 1: Créer les écoles
    const ecoles = await seedEcoles();

    // Step 2: Créer le catalogue public (partagé par tous)
    const catalogue = await seedCataloguePublic();

    // Step 2.1: Créer figures école-spécifiques (NOUVEAU)
    const schoolFigures = await createSchoolSpecificFigures(ecoles, catalogue.disciplineMap);

    // Step 2.5: Configurer disponibilité des disciplines par école (opt-in)
    await seedDisciplineAvailability();

    // Step 3: Créer les utilisateurs (admin, school_admin, profs, élèves, solo)
    const users = await seedUtilisateurs(ecoles);

    // Step 4: Créer relations prof-élève et groupes
    await seedRelations(
      [...users.voltige.professeurs, ...users.academie.professeurs],
      [...users.voltige.eleves, ...users.academie.eleves]
    );

    // Step 5: Créer progressions exemple (RÉDUIT avec figures école)
    const allProfs = [...users.voltige.professeurs, ...users.academie.professeurs];
    const allEleves = [...users.voltige.eleves, ...users.academie.eleves];

    const { progressions } = await seedProgressions(
      allEleves,
      catalogue.figuresByDiscipline,
      scenarioDefinitions,
      allProfs,
      ecoles,        // NOUVEAU
      schoolFigures  // NOUVEAU
    );

    // Step 6: Créer interactions prof-élève (pour tester élèves négligés)
    await seedInteractions(
      [...users.voltige.professeurs, ...users.academie.professeurs],
      [...users.voltige.eleves, ...users.academie.eleves]
    );

    // Step 7: Créer tentatives (pour tester Grit Score - RÉDUIT 30%)
    await seedTentatives(
      [...users.voltige.eleves, ...users.academie.eleves]
    );

    // Step 8: Créer programmes exemples (pour tester système programmes prof)
    await seedProgrammes(
      [...users.voltige.professeurs, ...users.academie.professeurs],
      catalogue.figures
    );

    // Step 9: Créer exercices décomposés (relations récursives figure → exercices)
    await seedExercicesDecomposes();

    // Display summary
    console.log('');
    await displaySummary(ecoles, catalogue, users, schoolFigures);

    logger.header('✨ Multi-Tenant Seed completed successfully - OPTIMISÉ!');

    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

runSeed();
