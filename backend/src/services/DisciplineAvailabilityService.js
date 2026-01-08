const { DisciplineAvailability, Discipline, Ecole } = require('../models');
const { Op } = require('sequelize');

class DisciplineAvailabilityService {

  // Obtenir les disciplines disponibles pour une école
  static async getDisciplinesForEcole(ecoleId, includeInactive = false) {
    const whereClause = { ecole_id: ecoleId };
    if (!includeInactive) {
      whereClause.actif = true;
    }

    return await DisciplineAvailability.findAll({
      where: whereClause,
      include: [{
        model: Discipline,
        as: 'discipline',
        attributes: ['id', 'nom', 'description', 'image_url']
      }],
      order: [['ordre', 'ASC'], ['createdAt', 'ASC']]
    });
  }

  // Activer/désactiver une discipline pour une école
  static async toggleDiscipline(ecoleId, disciplineId, actif) {
    const [record, created] = await DisciplineAvailability.findOrCreate({
      where: { ecole_id: ecoleId, discipline_id: disciplineId },
      defaults: { actif }
    });

    if (!created && record.actif !== actif) {
      record.actif = actif;
      await record.save();
    }

    return record;
  }

  // Mise à jour en masse des disciplines d'une école
  static async bulkUpdateDisciplines(ecoleId, disciplineConfigs) {
    // disciplineConfigs: [{ discipline_id, actif, ordre }, ...]
    const results = await Promise.all(
      disciplineConfigs.map(config =>
        DisciplineAvailability.upsert({
          ecole_id: ecoleId,
          discipline_id: config.discipline_id,
          actif: config.actif,
          ordre: config.ordre || 0
        })
      )
    );
    return results;
  }

  // Réordonner les disciplines d'une école
  static async reorderDisciplines(ecoleId, orderedDisciplineIds) {
    const updates = orderedDisciplineIds.map((disciplineId, index) =>
      DisciplineAvailability.update(
        { ordre: index },
        { where: { ecole_id: ecoleId, discipline_id: disciplineId } }
      )
    );
    return await Promise.all(updates);
  }
}

module.exports = DisciplineAvailabilityService;
