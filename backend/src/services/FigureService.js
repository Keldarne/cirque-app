const { Figure, EtapeProgression, Discipline } = require('../models');
const sequelize = require('../../db');
const { Op } = require('sequelize');

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

  /**
   * Met à jour les étapes d'une figure de manière granulaire.
   * Si une étape a un id, elle est mise à jour. Sinon, elle est créée.
   * Les étapes non présentes dans etapesData sont supprimées.
   * @param {number} figureId - ID de la figure
   * @param {Array<Object>} etapesData - Données des étapes [{ id?, titre, description, ordre, xp, video_url, type }]
   * @returns {Promise<Array>} Les étapes mises à jour
   */
  static async updateEtapes(figureId, etapesData) {
    const transaction = await sequelize.transaction();
    try {
      const figure = await Figure.findByPk(figureId);
      if (!figure) {
        throw new Error('Figure non trouvée');
      }

      // Récupérer étapes existantes
      const existingEtapes = await EtapeProgression.findAll({
        where: { figure_id: figureId }
      });
      const existingIds = existingEtapes.map(e => e.id);
      const receivedIds = etapesData.filter(e => e.id).map(e => e.id);

      // Supprimer étapes non envoyées
      const toDelete = existingIds.filter(id => !receivedIds.includes(id));
      if (toDelete.length > 0) {
        await EtapeProgression.destroy({
          where: { id: { [Op.in]: toDelete } },
          transaction
        });
      }

      // Créer ou mettre à jour étapes
      const results = await Promise.all(
        etapesData.map(async (etapeData) => {
          if (etapeData.id) {
            // UPDATE
            const etape = await EtapeProgression.findByPk(etapeData.id, { transaction });
            if (etape) {
              await etape.update({
                titre: etapeData.titre,
                description: etapeData.description,
                type: etapeData.type || 'pratique',
                xp: etapeData.xp || 10,
                video_url: etapeData.video_url,
                ordre: etapeData.ordre
              }, { transaction });
              return etape;
            }
          } else {
            // CREATE
            return await EtapeProgression.create({
              figure_id: figureId,
              titre: etapeData.titre,
              description: etapeData.description,
              type: etapeData.type || 'pratique',
              xp: etapeData.xp || 10,
              video_url: etapeData.video_url,
              ordre: etapeData.ordre
            }, { transaction });
          }
        })
      );

      await transaction.commit();
      return results.filter(Boolean); // Filter out any null values
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = FigureService;
