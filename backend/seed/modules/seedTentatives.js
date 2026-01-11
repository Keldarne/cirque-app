const { TentativeEtape, ProgressionEtape } = require('../../src/models');
const logger = require('../utils/logger');
const { subDays, subHours, subMinutes, startOfDay } = require('date-fns');
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

/**
 * Génère des timestamps réalistes pour les tentatives
 * Simule des sessions d'entraînement groupées par jour
 */
function generateAttemptTimestamps(nbTentatives, daysAgo = 30) {
  const timestamps = [];
  const now = new Date();

  // Grouper les tentatives en "sessions d'entraînement" (1-4 sessions)
  const nbSessions = Math.min(nbTentatives, randomInt(1, Math.min(nbTentatives, 5)));
  const tentativesPerSession = Math.ceil(nbTentatives / nbSessions);

  for (let session = 0; session < nbSessions; session++) {
    // Chaque session est à un jour différent dans les X derniers jours
    const dayOffset = randomInt(0, daysAgo);
    const sessionDate = subDays(now, dayOffset);
    const sessionStart = startOfDay(sessionDate);

    // Ajouter un offset aléatoire dans la journée (entre 8h et 22h)
    const hourOffset = randomInt(8, 22);
    const baseTime = subHours(sessionStart, -hourOffset);

    // Créer les tentatives de cette session (espacées de quelques minutes)
    const attemptsThisSession = Math.min(tentativesPerSession, nbTentatives - timestamps.length);
    for (let i = 0; i < attemptsThisSession; i++) {
      const minutesOffset = i * randomInt(2, 10); // 2-10 min entre chaque tentative
      timestamps.push(subMinutes(baseTime, -minutesOffset));
    }
  }

  // Trier par ordre chronologique (du plus ancien au plus récent)
  return timestamps.sort((a, b) => a - b);
}

async function seedTentatives(students) {
  logger.section('Création des tentatives enrichies (4 modes) - Version RÉDUITE (~30%)');

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
        config = {
          minTentatives: 5,   // Was 8 (-37%)
          maxTentatives: 15,  // Was 20 (-25%)
          tauxEchec: 0.6,
          percentageWithAttempts: 0.6 // Was 0.8 (-25%)
        };
        break;
      case 'talent_naturel':
        config = {
          minTentatives: 1,   // Same (already minimal)
          maxTentatives: 3,   // Was 4 (-25%)
          tauxEchec: 0.15,
          percentageWithAttempts: 0.4 // Was 0.6 (-33%)
        };
        break;
      default: // normal
        config = {
          minTentatives: 2,   // Was 3 (-33%)
          maxTentatives: 8,   // Was 12 (-33%)
          tauxEchec: 0.4,
          percentageWithAttempts: 0.5 // Was 0.7 (-28%)
        };
    }

    // Récupérer TOUTES les progressions de l'élève (validées ET en cours)
    const toutesProgressions = await ProgressionEtape.findAll({
      where: {
        utilisateur_id: student.id,
        statut: { [Op.in]: ['valide', 'en_cours'] }
      }
    });

    if (toutesProgressions.length === 0) {
      continue;
    }

    let tentativesEleve = 0;

    // Créer des tentatives pour un pourcentage des progressions (selon profil)
    const nbProgressionsWithAttempts = Math.ceil(
      toutesProgressions.length * config.percentageWithAttempts
    );

    const progressionsAvecTentatives = toutesProgressions
      .sort(() => 0.5 - Math.random())
      .slice(0, nbProgressionsWithAttempts);

    for (const progressionEtape of progressionsAvecTentatives) {
      const nbTentatives = randomInt(config.minTentatives, config.maxTentatives);

      // Générer des timestamps réalistes pour ces tentatives
      const daysAgo = progressionEtape.statut === 'valide' ? 30 : 7; // validées: 30j, en cours: 7j
      const timestamps = generateAttemptTimestamps(nbTentatives, daysAgo);

      // Choisir un mode aléatoire pour cette progression
      const modes = ['binaire', 'evaluation', 'duree', 'evaluation_duree'];
      const selectedMode = modes[Math.floor(Math.random() * modes.length)];

      const tentativesToCreate = [];

      for (let t = 0; t < nbTentatives; t++) {
        const isLastAttempt = (t === nbTentatives - 1);

        // Pour les progressions validées, la dernière tentative doit être réussie
        // Pour les en_cours, c'est aléatoire
        let shouldSucceed;
        if (progressionEtape.statut === 'valide') {
          shouldSucceed = isLastAttempt || (Math.random() > config.tauxEchec);
        } else {
          shouldSucceed = Math.random() > config.tauxEchec;
        }

        let tentativeData = {
          progression_etape_id: progressionEtape.id,
          createdAt: timestamps[t],
          updatedAt: timestamps[t]
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
              // Progression: commence instable (2), finit maîtrisé (3)
              const progressRatio = nbTentatives > 1 ? t / (nbTentatives - 1) : 1;
              tentativeData.score = progressRatio > 0.6 ? 3 : 2;
            } else {
              tentativeData.score = 1; // Échec
            }
            tentativeData.reussie = tentativeData.score >= 2;
            modeDistribution.evaluation++;
            break;

          case 'duree':
            tentativeData.type_saisie = 'duree';
            // Durée augmente avec la pratique
            const progressRatio = nbTentatives > 1 ? t / (nbTentatives - 1) : 1;
            const baseDuration = 30;
            const maxDuration = 300;
            tentativeData.duree_secondes = Math.floor(
              baseDuration + (maxDuration - baseDuration) * progressRatio + randomInt(-10, 20)
            );
            tentativeData.reussie = true; // Toute session chrono = succès
            modeDistribution.duree++;
            break;

          case 'evaluation_duree':
            tentativeData.type_saisie = 'evaluation_duree';
            // Combiner score et durée avec progression
            const ratio = nbTentatives > 1 ? t / (nbTentatives - 1) : 1;

            if (shouldSucceed) {
              tentativeData.score = ratio > 0.6 ? 3 : 2;
            } else {
              tentativeData.score = 1;
            }

            // Durée augmente avec la pratique
            const minDur = 60;
            const maxDur = 240;
            tentativeData.duree_secondes = Math.floor(
              minDur + (maxDur - minDur) * ratio + randomInt(-15, 30)
            );

            tentativeData.reussie = tentativeData.score >= 2;
            modeDistribution.evaluation_duree++;
            break;
        }

        tentativesToCreate.push(tentativeData);
      }

      // Bulk create pour performance
      await TentativeEtape.bulkCreate(tentativesToCreate);
      totalTentatives += tentativesToCreate.length;
      tentativesEleve += tentativesToCreate.length;
    }

    if (tentativesEleve > 0) {
      logger.info(
        `${student.prenom} ${student.nom} (${scenario}): ${tentativesEleve} tentatives sur ${progressionsAvecTentatives.length} progressions`
      );
    }
  }

  logger.success(`✓ Total: ${totalTentatives} tentatives créées (RÉDUIT ~30%)`);
  logger.info(`   - High Grit: ${scenarios.high_grit} élèves (5-15 tentatives/étape, 60% progressions)`);
  logger.info(`   - Talent Naturel: ${scenarios.talent_naturel} élèves (1-3 tentatives/étape, 40% progressions)`);
  logger.info(`   - Normal: ${scenarios.normal} élèves (2-8 tentatives/étape, 50% progressions)`);
  logger.info(`\n   Distribution des modes:`);
  logger.info(`   - Binaire: ${modeDistribution.binaire}`);
  logger.info(`   - Evaluation: ${modeDistribution.evaluation}`);
  logger.info(`   - Duree: ${modeDistribution.duree}`);
  logger.info(`   - Evaluation + Duree: ${modeDistribution.evaluation_duree}`);
  logger.info(`\n   ✨ Nouveautés:`);
  logger.info(`   - Timestamps réalistes (sessions groupées par jour)`);
  logger.info(`   - Tentatives pour progressions en_cours et validées`);
  logger.info(`   - Progression visible dans les scores et durées`);

  return { totalTentatives, scenarios, modeDistribution };
}

module.exports = seedTentatives;

