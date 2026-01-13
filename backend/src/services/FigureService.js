const { Figure, EtapeProgression, Discipline, FigurePrerequis } = require('../models');
const sequelize = require('../../db');
const { Op } = require('sequelize');
const JugglingLabService = require('./JugglingLabService');

// Validation error class
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class FigureService {

  /**
   * Crée une nouvelle figure avec ses étapes et ses prérequis.
   * @param {Object} figureData - Données de la figure (nom, descriptif, image_url, video_url, discipline_id, createur_id, ecole_id)
   * @param {Array<Object>} etapesData - Données des étapes associées à la figure.
   * @param {Array<number>} prerequisIds - IDs des figures prérequises (optionnel)
   * @returns {Promise<Object>} La figure créée avec ses étapes.
   */
  static async createFigureWithEtapes(figureData, etapesData, prerequisIds = null) {
    const transaction = await sequelize.transaction();
    try {
      const figure = await Figure.create(figureData, { transaction });

      // Créer les étapes
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

      // Créer les relations de prérequis
      if (prerequisIds && Array.isArray(prerequisIds) && prerequisIds.length > 0) {
        const prerequisToCreate = prerequisIds.map((exerciceFigureId, index) => ({
          figure_id: figure.id,
          exercice_figure_id: exerciceFigureId,
          ordre: index + 1,
          est_requis: true,
          poids: 1
        }));
        await FigurePrerequis.bulkCreate(prerequisToCreate, { transaction });
      }

      // Générer et cacher le GIF JugglingLab si siteswap présent
      if (figureData.metadata?.siteswap) {
        const gifUrl = await JugglingLabService.generateAndCacheGif(
          figure.id,
          figureData.metadata.siteswap,
          { fps: 12, height: 200, width: 300 }
        );

        if (gifUrl) {
          await figure.update({ gif_url: gifUrl }, { transaction });
          figure.dataValues.gif_url = gifUrl; // Update in-memory instance
        }
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
   * Met à jour une figure existante, ses étapes et ses prérequis.
   * @param {Object} figure - L'instance de la figure à mettre à jour.
   * @param {Object} updateData - Données de la figure à mettre à jour (nom, descriptif, etc.).
   * @param {Array<Object>} etapesData - Nouvelles données des étapes.
   * @param {Array<number>} prerequisIds - IDs des figures prérequises (optionnel, undefined = pas de changement)
   * @returns {Promise<Object>} La figure mise à jour avec ses étapes.
   */
  static async updateFigureWithEtapes(figure, updateData, etapesData, prerequisIds = undefined) {
    const transaction = await sequelize.transaction();
    try {
      // Sauvegarder l'ancien metadata pour détecter changement siteswap
      const oldMetadata = figure.metadata;

      await figure.update(updateData, { transaction });

      // Mettre à jour les étapes si fournies
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

      // Mettre à jour les prérequis si fournis (undefined = pas de changement)
      if (prerequisIds !== undefined) {
        // Supprimer toutes les relations existantes
        await FigurePrerequis.destroy({
          where: { figure_id: figure.id },
          transaction
        });

        // Recréer les nouvelles relations si le tableau n'est pas vide
        if (Array.isArray(prerequisIds) && prerequisIds.length > 0) {
          const prerequisToCreate = prerequisIds.map((exerciceFigureId, index) => ({
            figure_id: figure.id,
            exercice_figure_id: exerciceFigureId,
            ordre: index + 1,
            est_requis: true,
            poids: 1
          }));
          await FigurePrerequis.bulkCreate(prerequisToCreate, { transaction });
        }
      }

      // Gérer la régénération du GIF si le siteswap a changé
      if (updateData.metadata !== undefined) {
        const siteswapChanged = JugglingLabService.hasSiteswapChanged(oldMetadata, updateData.metadata);

        if (siteswapChanged) {
          // Supprimer l'ancien GIF si existant
          if (figure.gif_url) {
            await JugglingLabService.deleteCachedGif(figure.gif_url);
          }

          // Générer nouveau GIF si nouveau siteswap existe
          if (updateData.metadata?.siteswap) {
            const gifUrl = await JugglingLabService.generateAndCacheGif(
              figure.id,
              updateData.metadata.siteswap,
              { fps: 12, height: 200, width: 300 }
            );

            if (gifUrl) {
              await figure.update({ gif_url: gifUrl }, { transaction });
              figure.dataValues.gif_url = gifUrl;
            } else {
              // Échec génération, clear gif_url
              await figure.update({ gif_url: null }, { transaction });
              figure.dataValues.gif_url = null;
            }
          } else {
            // Siteswap supprimé, clear gif_url
            await figure.update({ gif_url: null }, { transaction });
            figure.dataValues.gif_url = null;
          }
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

  /**
   * Valide qu'il n'y a pas de dépendance circulaire dans la hiérarchie des exercices.
   * Utilise BFS (Breadth-First Search) pour détecter les cycles.
   * @param {number} figureId - ID de la figure parente
   * @param {number} exerciceFigureId - ID de la figure exercice à ajouter
   * @throws {ValidationError} Si une dépendance circulaire est détectée
   * @returns {Promise<boolean>} true si la validation réussit
   */
  static async validateExerciceHierarchy(figureId, exerciceFigureId) {
    // Auto-référence
    if (figureId === exerciceFigureId) {
      throw new ValidationError('Une figure ne peut être son propre exercice');
    }

    // Détection cycle via BFS
    const visited = new Set();
    const queue = [exerciceFigureId];

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (currentId === figureId) {
        throw new ValidationError('Dépendance circulaire détectée: cette relation créerait un cycle');
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const children = await FigurePrerequis.findAll({
        where: { figure_id: currentId },
        attributes: ['exercice_figure_id'],
        raw: true
      });

      queue.push(...children.map(c => c.exercice_figure_id));
    }

    return true;
  }
}

module.exports = FigureService;
