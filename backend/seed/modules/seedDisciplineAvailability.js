const { DisciplineAvailability, Ecole, Discipline } = require('../../src/models');

async function seedDisciplineAvailability() {
  console.log('🎯 Seeding discipline availability...');

  try {
    const ecoles = await Ecole.findAll();
    const disciplines = await Discipline.findAll();

    if (ecoles.length === 0 || disciplines.length === 0) {
      console.log('⚠️  Skipping discipline availability: no schools or disciplines found');
      return;
    }

    // École 1: Active les 3 premières disciplines (opt-in démonstration)
    if (ecoles[0] && disciplines.length >= 3) {
      await DisciplineAvailability.bulkCreate([
        {
          ecole_id: ecoles[0].id,
          discipline_id: disciplines[0].id,
          actif: true,
          ordre: 0
        },
        {
          ecole_id: ecoles[0].id,
          discipline_id: disciplines[1].id,
          actif: true,
          ordre: 1
        },
        {
          ecole_id: ecoles[0].id,
          discipline_id: disciplines[2].id,
          actif: true,
          ordre: 2
        }
      ]);
      console.log(`   ✓ École "${ecoles[0].nom}": 3 disciplines actives`);
    }

    // École 2: Active disciplines différentes (simulation école avec autre matériel)
    if (ecoles[1] && disciplines.length >= 5) {
      await DisciplineAvailability.bulkCreate([
        {
          ecole_id: ecoles[1].id,
          discipline_id: disciplines[1].id,
          actif: true,
          ordre: 0
        },
        {
          ecole_id: ecoles[1].id,
          discipline_id: disciplines[3].id,
          actif: true,
          ordre: 1
        },
        {
          ecole_id: ecoles[1].id,
          discipline_id: disciplines[4].id,
          actif: true,
          ordre: 2
        }
      ]);
      console.log(`   ✓ École "${ecoles[1].nom}": 3 disciplines actives (configuration différente)`);
    }

    // Autres écoles: Par défaut, toutes disciplines désactivées (opt-in)
    if (ecoles.length > 2) {
      console.log(`   ℹ️  ${ecoles.length - 2} autres écoles: disciplines désactivées par défaut (opt-in)`);
    }

    console.log('✅ Discipline availability seeded');
  } catch (error) {
    console.error('❌ Erreur seed discipline availability:', error);
    throw error;
  }
}

module.exports = seedDisciplineAvailability;
