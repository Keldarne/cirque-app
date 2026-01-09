const { ProgressionEtape, EtapeProgression } = require('../../src/models');
const { generateTimestamps } = require('../utils/timestampGenerator');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Helper pour sélectionner un prof au hasard pour la validation
let profs = [];
const setProfs = (allProfs) => {
  profs = allProfs;
};
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

    // 3. Simuler la validation et progression en cours de manière SÉQUENTIELLE par figure
    const distribution = scenarioDef.distribution || { last_7_days: 5, days_8_to_30: 10 };
    // Générer un pool large de timestamps pour couvrir les besoins
    let timestamps = generateTimestamps({
        last7DaysCount: distribution.last_7_days * 3, // Multiplier pour avoir du stock
        days8to30Count: distribution.days_8_to_30 * 3,
    });

    // Grouper les étapes par figure pour respecter l'ordre
    const etapesByFigure = allEtapesForFigures.reduce((acc, etape) => {
      if (!acc[etape.figure_id]) acc[etape.figure_id] = [];
      acc[etape.figure_id].push(etape);
      return acc;
    }, {});

    let statsStudent = { valide: 0, en_cours: 0, non_commence: 0 };

    for (const [figureId, etapes] of Object.entries(etapesByFigure)) {
       // Déterminer le niveau de maîtrise (0.0 à 1.0) basé sur le scénario
       let mastery = 0;
       
       if (scenario === 'at_risk') {
         // Faible progression: 0% à 40% des étapes validées
         // Lucas Leroy spécifique: parfois rien (0), parfois un peu
         mastery = Math.random() * 0.4; 
       } else if (scenario === 'stable') {
         // Moyen: 30% à 80%
         mastery = 0.3 + Math.random() * 0.5;
       } else if (scenario === 'progressing') {
         // Bon: 50% à 95%
         mastery = 0.5 + Math.random() * 0.45;
       } else {
         // Spécialistes / Balanced: 70% à 100%
         mastery = 0.7 + Math.random() * 0.3;
       }

       const stepsToValidate = Math.floor(etapes.length * mastery);
       
       for (let i = 0; i < etapes.length; i++) {
          const etape = etapes[i];
          let status = 'non_commence';
          let date_validation = null;
          let valide_par_prof_id = null;
          
          if (i < stepsToValidate) {
             status = 'valide';
             date_validation = timestamps.pop() || new Date(Date.now() - Math.floor(Math.random() * 1000000000));
             
             // Simuler validation prof aléatoire
             if (Math.random() < 0.3) {
                const prof = getRandomProf();
                valide_par_prof_id = prof.id;
             }
             statsStudent.valide++;
          } else if (i === stepsToValidate) {
             // L'étape juste après les validées est "en cours"
             status = 'en_cours';
             statsStudent.en_cours++;
          } else {
             statsStudent.non_commence++;
          }

          if (status !== 'non_commence') {
             await ProgressionEtape.update({
                statut: status,
                date_validation,
                valide_par_prof_id
             }, {
                where: {
                    utilisateur_id: student.id,
                    etape_id: etape.id
                }
             });
          }
       }
    }

    logger.info(
      `  → ${totalEtapeProgressions} progressions: ${statsStudent.valide} validées, ${statsStudent.en_cours} en cours`
    );
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
