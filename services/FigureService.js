const { Figure, EtapeProgression, Discipline } = require('../models');
const sequelize = require('../db');

class FigureService {

  /**
   * Crée une nouvelle figure avec ses étapes.
   * @param {Object} figureData - Données de la figure (nom, descriptif, image_url, video_url, discipline_id, createur_id, ecole_id)
   * @param {Array<Object>} etapesData - Données des étapes associées à la figure.
   * @returns {Promise<Object>} La figure créée avec ses étapes.
   */
  static async createFigureWithEtapes(figureData, etapesData) {
    const transaction = await sequelize.transaction();
    try {
      const figure = await Figure.create(figureData, { transaction });

      if (etapesData && etapesData.length > 0) {
        const etapesToCreate = etapesData.map((etape, index) => ({
          figure_id: figure.id,
          titre: etape.titre,
          description: etape.description,
          type: etape.type || 'pratique',
          xp: etape.xp || 10,
          video_url: etape.video_url,
          ordre: etape.ordre || (index + 1)
        }));
        await EtapeProgression.bulkCreate(etapesToCreate, { transaction });
      }

      await transaction.commit();

      // Manually attach etapes for consistency, as include doesn't always work reliably post-create
      const etapesFound = await EtapeProgression.findAll({
        where: { figure_id: figure.id },
        order: [['ordre', 'ASC']]
      });
      figure.dataValues.etapes = etapesFound;
      figure.etapes = etapesFound;

      return figure;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Met à jour une figure existante et ses étapes.
   * @param {Object} figure - L'instance de la figure à mettre à jour.
   * @param {Object} updateData - Données de la figure à mettre à jour (nom, descriptif, etc.).
   * @param {Array<Object>} etapesData - Nouvelles données des étapes.
   * @returns {Promise<Object>} La figure mise à jour avec ses étapes.
   */
  static async updateFigureWithEtapes(figure, updateData, etapesData) {
    const transaction = await sequelize.transaction();
    try {
      await figure.update(updateData, { transaction });

      if (etapesData !== undefined && Array.isArray(etapesData)) { // Only update if etapesData is provided
        await EtapeProgression.destroy({ where: { figure_id: figure.id }, transaction });
        if (etapesData.length > 0) {
          const etapesToCreate = etapesData.map((etape, index) => ({
            figure_id: figure.id,
            titre: etape.titre,
            description: etape.description,
            type: etape.type || 'pratique',
            xp: etape.xp || 10,
            video_url: etape.video_url,
            ordre: etape.ordre || (index + 1)
          }));
          await EtapeProgression.bulkCreate(etapesToCreate, { transaction });
        }
      }

      await transaction.commit();

      // Re-fetch with etapes for consistency
      const etapesFound = await EtapeProgression.findAll({
        where: { figure_id: figure.id },
        order: [['ordre', 'ASC']]
      });
      figure.dataValues.etapes = etapesFound;
      figure.etapes = etapesFound;

      return figure;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = FigureService;
