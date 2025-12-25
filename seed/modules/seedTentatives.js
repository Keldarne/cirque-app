const { TentativeEtape, ProgressionEtape } = require('../../models');
const logger = require('../utils/logger');
const { subMinutes } = require('date-fns');
const { Op } = require('sequelize');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function assignScenario() {
  const rand = Math.random();
  if (rand < 0.2) return 'high_grit';      // 20% high grit
  if (rand < 0.35) return 'talent_naturel'; // 15% talent naturel
  return 'normal';                          // 65% normal
}

async function seedTentatives(students) {
  logger.section('Création des tentatives enrichies (4 modes)');

  let totalTentatives = 0;
  const scenarios = { high_grit: 0, talent_naturel: 0, normal: 0 };
  const modeDistribution = {
    binaire: 0,
    evaluation: 0,
    duree: 0,
    evaluation_duree: 0
  };

  for (const student of students) {
    const scenario = assignScenario();
    scenarios[scenario]++;

    let config;
    switch (scenario) {
      case 'high_grit':
        config = { minTentatives: 5, maxTentatives: 12, tauxEchec: 0.7 };
        break;
      case 'talent_naturel':
        config = { minTentatives: 1, maxTentatives: 3, tauxEchec: 0.2 };
        break;
      default: // normal
        config = { minTentatives: 2, maxTentatives: 6, tauxEchec: 0.4 };
    }

    // Récupérer les progressions d'étapes de l'élève qui sont validées
    const progressionsValidees = await ProgressionEtape.findAll({
      where: { utilisateur_id: student.id, statut: 'valide' }
    });

    if (progressionsValidees.length === 0) {
      continue;
    }

    let tentativesEleve = 0;

    // Créer des tentatives pour un sous-ensemble aléatoire des étapes validées
    const progressionsAvecTentatives = progressionsValidees
      .sort(() => 0.5 - Math.random())
      .slice(0, randomInt(1, Math.min(progressionsValidees.length, 5)));

    for (const progressionEtape of progressionsAvecTentatives) {
      const nbTentatives = randomInt(config.minTentatives, config.maxTentatives);

      // Choisir un mode aléatoire pour cette progression
      const modes = ['binaire', 'evaluation', 'duree', 'evaluation_duree'];
      const selectedMode = modes[Math.floor(Math.random() * modes.length)];

      for (let t = 0; t < nbTentatives; t++) {
        const isLastAttempt = (t === nbTentatives - 1);
        const shouldSucceed = isLastAttempt || (Math.random() > config.tauxEchec);

        let tentativeData = {
          progression_etape_id: progressionEtape.id
        };

        switch (selectedMode) {
          case 'binaire':
            tentativeData.type_saisie = 'binaire';
            tentativeData.reussie = shouldSucceed;
            modeDistribution.binaire++;
            break;

          case 'evaluation':
            tentativeData.type_saisie = 'evaluation';
            // Score: 1=Échec, 2=Instable, 3=Maîtrisé
            if (shouldSucceed) {
              tentativeData.score = isLastAttempt ? 3 : randomInt(2, 3);
            } else {
              tentativeData.score = 1; // Échec
            }
            tentativeData.reussie = tentativeData.score >= 2;
            modeDistribution.evaluation++;
            break;

          case 'duree':
            tentativeData.type_saisie = 'duree';
            tentativeData.duree_secondes = randomInt(30, 300); // 30s à 5min
            tentativeData.reussie = true; // Toute session chrono = succès
            modeDistribution.duree++;
            break;

          case 'evaluation_duree':
            tentativeData.type_saisie = 'evaluation_duree';
            // Combiner score et durée
            if (shouldSucceed) {
              tentativeData.score = isLastAttempt ? 3 : randomInt(2, 3);
            } else {
              tentativeData.score = 1;
            }
            tentativeData.duree_secondes = randomInt(60, 240); // 1min à 4min
            tentativeData.reussie = tentativeData.score >= 2;
            modeDistribution.evaluation_duree++;
            break;
        }

        await TentativeEtape.create(tentativeData);
        totalTentatives++;
        tentativesEleve++;
      }
    }

    if (tentativesEleve > 0) {
      logger.info(`${student.prenom} ${student.nom} (${scenario}): ${tentativesEleve} tentatives`);
    }
  }

  logger.success(`✓ Total: ${totalTentatives} tentatives créées`);
  logger.info(`   - High Grit: ${scenarios.high_grit} élèves`);
  logger.info(`   - Talent Naturel: ${scenarios.talent_naturel} élèves`);
  logger.info(`   - Normal: ${scenarios.normal} élèves`);
  logger.info(`\n   Distribution des modes:`);
  logger.info(`   - Binaire: ${modeDistribution.binaire}`);
  logger.info(`   - Evaluation: ${modeDistribution.evaluation}`);
  logger.info(`   - Duree: ${modeDistribution.duree}`);
  logger.info(`   - Evaluation + Duree: ${modeDistribution.evaluation_duree}`);

  return { totalTentatives, scenarios, modeDistribution };
}

module.exports = seedTentatives;

