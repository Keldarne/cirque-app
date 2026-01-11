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


async function seedProgressions(students, figuresByDiscipline, scenarioDefinitions, allProfs, ecoles, schoolFigures) {
  setProfs(allProfs);
  logger.section('Création des progressions (modèle refactorisé - RÉDUIT)');

  let totalEtapeProgressions = 0;

  for (const student of students) {
    const scenario = student.scenario;
    const scenarioDef = scenarioDefinitions[scenario];

    if (!scenarioDef) {
      logger.warn(`Scénario ${scenario} non trouvé pour ${student.prenom} ${student.nom}, ignoré`);
      continue;
    }

    logger.info(`Traitement de ${student.prenom} ${student.nom} (${scenario})`);

    // Figures école-spécifiques pour cet élève
    let schoolSpecificFigs = [];
    if (ecoles && schoolFigures) {
      if (student.ecole_id === ecoles.voltige.id && schoolFigures.voltige) {
        schoolSpecificFigs = schoolFigures.voltige;
      } else if (student.ecole_id === ecoles.academie.id && schoolFigures.academie) {
        schoolSpecificFigs = schoolFigures.academie;
      }
    }

    let selectedFigures = [];
    // Logique de sélection RÉDUITE (5-10 figures au lieu de 10-20)
    if (scenario === 'at_risk') {
      selectedFigures = selectRandomFigures(figuresByDiscipline, 5); // Was 10
    } else if (scenario === 'stable') {
      selectedFigures = selectRandomFigures(figuresByDiscipline, 7); // Was 10
    } else if (scenario === 'progressing') {
      selectedFigures = selectRandomFigures(figuresByDiscipline, 8); // Was 10
    } else if (scenario === 'specialist_juggling') {
      const publicJonglage = getRandomFromDiscipline(figuresByDiscipline, 'Jonglage', 6); // Was 5, +1 for school
      const schoolJonglage = schoolSpecificFigs.filter(f => f.nom.includes('Jonglage')).slice(0, 1);
      selectedFigures = [...publicJonglage, ...schoolJonglage];
    } else if (scenario === 'specialist_aerial') {
      const publicAerien = getRandomFromDiscipline(figuresByDiscipline, 'Aérien', 6); // Was 5, +1 for school
      const schoolAerien = schoolSpecificFigs.filter(f => f.nom.includes('Aérienne')).slice(0, 1);
      selectedFigures = [...publicAerien, ...schoolAerien];
    } else if (scenario === 'balanced') {
      selectedFigures = [
        ...getRandomFromDiscipline(figuresByDiscipline, 'Jonglage', 1), // Was 2
        ...getRandomFromDiscipline(figuresByDiscipline, 'Aérien', 1), // Was 2
        ...getRandomFromDiscipline(figuresByDiscipline, 'Acrobatie', 2), // Same
        ...getRandomFromDiscipline(figuresByDiscipline, 'Équilibre', 1), // Was 2
        ...getRandomFromDiscipline(figuresByDiscipline, 'Manipulation d\'Objets', 1), // Was 2
        ...schoolSpecificFigs.slice(0, 1) // 1 figure école
      ]; // Total: 7
    } else if (scenario === 'low_safety') {
      const artistiques = selectRandomFigures(figuresByDiscipline, 9, 'artistique'); // Was 18
      const renforcements = selectRandomFigures(figuresByDiscipline, 1, 'renforcement'); // Was 2
      selectedFigures = [...artistiques, ...renforcements]; // Total: 10
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
       // Déterminer le niveau de maîtrise (0.0 à 1.0) basé sur le scénario - RÉDUIT DE 30%
       let mastery = 0;

       if (scenario === 'at_risk') {
         // Faible progression: 0% à 30% (était 0-40%)
         mastery = Math.random() * 0.3;
       } else if (scenario === 'stable') {
         // Moyen: 20% à 60% (était 30-80%)
         mastery = 0.2 + Math.random() * 0.4;
       } else if (scenario === 'progressing') {
         // Bon: 40% à 75% (était 50-95%)
         mastery = 0.4 + Math.random() * 0.35;
       } else {
         // Spécialistes / Balanced: 50% à 80% (était 70-100%)
         mastery = 0.5 + Math.random() * 0.3;
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
