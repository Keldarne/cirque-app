const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin } = require('../../middleware/auth');
const { ProgressionEtape, EtapeProgression, Figure, RelationProfEleve } = require('../../models');
const sequelize = require('../../../db');

/**
 * POST /api/prof/validation/eleves/:eleveId/figures/:figureId
 * Valide toutes les étapes d'une figure pour un élève (bulk validation).
 * @access  Private (Professeur lié à l'élève ou Admin)
 */
router.post('/eleves/:eleveId/figures/:figureId', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const eleveId = parseInt(req.params.eleveId, 10);
    const figureId = parseInt(req.params.figureId, 10);
    const professeur_id = req.user.id;

    if (isNaN(eleveId) || isNaN(figureId)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'IDs invalides' });
    }

    // Vérifier relation prof-élève (sauf pour admin)
    if (req.user.role !== 'admin') {
      const relation = await RelationProfEleve.findOne({
        where: {
          professeur_id,
          eleve_id: eleveId,
          statut: 'accepte'
        }
      });

      if (!relation) {
        await transaction.rollback();
        return res.status(403).json({ error: 'Cet élève ne fait pas partie de vos élèves' });
      }
    }

    // Vérifier que la figure existe
    const figure = await Figure.findByPk(figureId, {
      attributes: ['id', 'nom']
    });

    if (!figure) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Figure non trouvée' });
    }

    // Récupérer toutes les étapes de la figure
    const etapes = await EtapeProgression.findAll({
      where: { figure_id: figureId },
      order: [['ordre', 'ASC']],
      attributes: ['id', 'titre', 'ordre']
    });

    if (etapes.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Cette figure n\'a aucune étape à valider',
        figure: { id: figure.id, nom: figure.nom }
      });
    }

    // Pour chaque étape, créer ou mettre à jour la progression
    const validatedEtapes = [];
    const now = new Date();

    for (const etape of etapes) {
      const [progression, created] = await ProgressionEtape.findOrCreate({
        where: {
          utilisateur_id: eleveId,
          etape_id: etape.id
        },
        defaults: {
          statut: 'valide',
          date_validation: now,
          valide_par_prof_id: professeur_id,
          lateralite: 'non_applicable',
          decay_level: 'fresh'
        },
        transaction
      });

      // Si la progression existait déjà, la mettre à jour
      if (!created) {
        progression.statut = 'valide';
        progression.date_validation = now;
        progression.valide_par_prof_id = professeur_id;
        progression.decay_level = 'fresh';
        await progression.save({ transaction });
      }

      validatedEtapes.push({
        etape_id: etape.id,
        titre: etape.titre,
        ordre: etape.ordre,
        created: created
      });
    }

    await transaction.commit();

    res.status(200).json({
      message: `Figure "${figure.nom}" validée avec succès`,
      figure: {
        id: figure.id,
        nom: figure.nom
      },
      summary: {
        total_etapes: etapes.length,
        nouvelles_validations: validatedEtapes.filter(e => e.created).length,
        mises_a_jour: validatedEtapes.filter(e => !e.created).length
      },
      etapes_validees: validatedEtapes.map(e => ({
        etape_id: e.etape_id,
        titre: e.titre,
        ordre: e.ordre
      }))
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur POST /api/prof/validation/eleves/:eleveId/figures/:figureId:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la validation en masse',
      details: error.message
    });
  }
});

module.exports = router;
