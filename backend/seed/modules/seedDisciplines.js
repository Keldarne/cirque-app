const { Discipline } = require('../../models');
const logger = require('../utils/logger');

async function seedDisciplines(disciplineNames) {
  logger.section('Création des disciplines');

  const disciplines = [];
  const disciplineMap = {};

  for (const nom of disciplineNames) {
    try {
      const discipline = await Discipline.create({ nom });
      disciplines.push(discipline);
      disciplineMap[nom] = discipline;
      logger.info(`Créé: ${nom}`);
    } catch (error) {
      logger.error(`Erreur création discipline ${nom}: ${error.message}`);
      throw error;
    }
  }

  logger.success(`${disciplines.length} disciplines créées`);

  return { disciplines, disciplineMap };
}

module.exports = seedDisciplines;
