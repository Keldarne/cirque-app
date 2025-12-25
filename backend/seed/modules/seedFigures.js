const { Figure, EtapeProgression } = require('../../src/models');
const logger = require('../utils/logger');

async function seedFigures(figureDefinitions, disciplineMap, professors) {
  logger.section('Création des figures et étapes');

  const figures = [];
  const figuresByDiscipline = {};

  // Sélectionner un professeur aléatoire comme créateur par défaut
  const defaultCreator = professors[Math.floor(Math.random() * professors.length)];

  for (const figureDef of figureDefinitions) {
    try {
      const discipline = disciplineMap[figureDef.discipline];

      if (!discipline) {
        logger.warn(`Discipline ${figureDef.discipline} non trouvée pour ${figureDef.nom}, ignorée`);
        continue;
      }

      // Créer la figure
      const figure = await Figure.create({
        nom: figureDef.nom,
        descriptif: `Figure de ${figureDef.discipline} - niveau ${figureDef.difficulty_level}`,
        discipline_id: discipline.id,
        createur_id: defaultCreator.id,
        difficulty_level: figureDef.difficulty_level,
        type: figureDef.type
      });

      // Créer les étapes
      if (figureDef.steps && figureDef.steps.length > 0) {
        for (let i = 0; i < figureDef.steps.length; i++) {
          await EtapeProgression.create({
            figure_id: figure.id,
            titre: figureDef.steps[i],
            description: `Étape ${i + 1}: ${figureDef.steps[i]}`,
            xp: 10, // Base XP (sera multiplié par formule dynamique)
            ordre: i + 1
          });
        }
      }

      figures.push(figure);

      // Organiser par discipline pour accès rapide
      if (!figuresByDiscipline[figureDef.discipline]) {
        figuresByDiscipline[figureDef.discipline] = [];
      }
      figuresByDiscipline[figureDef.discipline].push(figure);

      logger.info(`Créé: ${figureDef.nom} (${figureDef.type}, diff: ${figureDef.difficulty_level}, ${figureDef.steps.length} étapes)`);
    } catch (error) {
      logger.error(`Erreur création figure ${figureDef.nom}: ${error.message}`);
      throw error;
    }
  }

  // Statistiques
  const renforcementCount = figures.filter(f => f.type === 'renforcement').length;
  const artistiqueCount = figures.filter(f => f.type === 'artistique').length;

  logger.success(`${figures.length} figures créées`);
  logger.info(`  - ${renforcementCount} renforcement`);
  logger.info(`  - ${artistiqueCount} artistique`);

  return { figures, figuresByDiscipline };
}

module.exports = seedFigures;
