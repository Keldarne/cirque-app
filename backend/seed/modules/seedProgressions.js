const { ProgressionEtape, EtapeProgression } = require('../../models');
const { generateTimestamps } = require('../utils/timestampGenerator');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Helper pour sélectionner un prof au hasard pour la validation
let profs = [];
const setProfs = (allProfs) => {
  profs = allProfs;
}
const getRandomProf = () => profs[Math.floor(Math.random() * profs.length)];


async function seedProgressions(students, figuresByDiscipline, scenarioDefinitions, allProfs) {
  setProfs(allProfs);
  logger.section('Création des progressions (modèle refactorisé)');

  let totalEtapeProgressions = 0;

  for (const student of students) {
    const scenario = student.scenario;
    const scenarioDef = scenarioDefinitions[scenario];

    if (!scenarioDef) {
      logger.warn(`Scénario ${scenario} non trouvé pour ${student.prenom} ${student.nom}, ignoré`);
      continue;
    }

    logger.info(`Traitement de ${student.prenom} ${student.nom} (${scenario})`);

    let selectedFigures = [];
    // Logique de sélection des figures (mise à jour pour les nouvelles disciplines)
    if (scenario === 'at_risk' || scenario === 'stable' || scenario === 'progressing') {
      selectedFigures = selectRandomFigures(figuresByDiscipline, 10);
    } else if (scenario === 'specialist_juggling') {
      selectedFigures = [
        ...getRandomFromDiscipline(figuresByDiscipline, 'Jonglage', 5)
      ];
    } else if (scenario === 'specialist_aerial') {
      selectedFigures = [
        ...getRandomFromDiscipline(figuresByDiscipline, 'Aérien', 5)
      ];
    } else if (scenario === 'balanced') {
      selectedFigures = [
        ...getRandomFromDiscipline(figuresByDiscipline, 'Jonglage', 2),
        ...getRandomFromDiscipline(figuresByDiscipline, 'Aérien', 2),
        ...getRandomFromDiscipline(figuresByDiscipline, 'Acrobatie', 2),
        ...getRandomFromDiscipline(figuresByDiscipline, 'Équilibre', 2),
        ...getRandomFromDiscipline(figuresByDiscipline, 'Manipulation d\'Objets', 2)
      ];
    } else if (scenario === 'low_safety') {
      const artistiques = selectRandomFigures(figuresByDiscipline, 18, 'artistique');
      const renforcements = selectRandomFigures(figuresByDiscipline, 2, 'renforcement');
      selectedFigures = [...artistiques, ...renforcements];
    }

    const figureIds = selectedFigures.map(f => f.id);

    // 1. Trouver toutes les étapes pour les figures sélectionnées
    const allEtapesForFigures = await EtapeProgression.findAll({
      where: { figure_id: { [Op.in]: figureIds } },
      attributes: ['id', 'figure_id'],
      order: [['figure_id'], ['ordre', 'ASC']]
    });

    if (allEtapesForFigures.length === 0) continue;

    // 2. Créer en masse toutes les progressions d'étapes avec le statut 'non_commence'
    const progressionsToCreate = allEtapesForFigures.map(etape => ({
      utilisateur_id: student.id,
      etape_id: etape.id,
      statut: 'non_commence'
    }));

    await ProgressionEtape.bulkCreate(progressionsToCreate);
    totalEtapeProgressions += progressionsToCreate.length;

    // 3. Simuler la validation des étapes en fonction du scénario
    const distribution = scenarioDef.distribution || { last_7_days: 5, days_8_to_30: 10 }; // Fournir une distribution par défaut
    let timestamps = generateTimestamps({
        last7DaysCount: distribution.last_7_days,
        days8to30Count: distribution.days_8_to_30,
    });

    const etapesToValidate = allEtapesForFigures
      .sort(() => 0.5 - Math.random()) // Mélanger pour valider des étapes au hasard
      .slice(0, timestamps.length);

    for (let i = 0; i < etapesToValidate.length; i++) {
        const etape = etapesToValidate[i];
        const timestamp = timestamps[i];

        const updatePayload = {
            statut: 'valide',
            date_validation: timestamp
        };

        // Simuler une validation par un prof pour ~30% des étapes validées
        if (Math.random() < 0.3) {
            const prof = getRandomProf();
            updatePayload.valide_par_prof_id = prof.id;
        }

        await ProgressionEtape.update(updatePayload, {
            where: {
                utilisateur_id: student.id,
                etape_id: etape.id
            }
        });
    }
    logger.info(`  → ${progressionsToCreate.length} progressions d'étapes créées pour ${student.prenom}`);
  }

  logger.success(`${totalEtapeProgressions} progressions d'étapes créées au total`);

  // Retourner un objet vide pour maintenir la compatibilité de l'interface
  return { progressions: [], etapeValidations: [] };
}

// Helpers (inchangés)
function selectRandomFigures(figuresByDiscipline, count, type = null) {
  const allFigures = Object.values(figuresByDiscipline).flat();
  const filtered = type ? allFigures.filter(f => f.type === type) : allFigures;
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getRandomFromDiscipline(figuresByDiscipline, discipline, count) {
  const figures = figuresByDiscipline[discipline] || [];
  const shuffled = figures.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

module.exports = seedProgressions;
