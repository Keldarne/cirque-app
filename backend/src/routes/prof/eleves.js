const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin } = require('../../middleware/auth');
const { verifierRelationProfEleve } = require('../../middleware/profAuth');
const ProfService = require('../../services/ProfService');
const { RelationProfEleve, AssignationProgramme, ProgrammeProf, ProgressionEtape, EtapeProgression, Figure } = require('../../models');
const sequelize = require('../../../db');

// Route de test pour debugging
router.post('/:id/figures/:figureId/valider', (req, res) => {
  res.json({
    message: 'ROUTE FOUND!',
    params: req.params,
    path: req.path
  });
});

// Obtenir la liste de tous les élèves d'un professeur
router.get('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const eleves = await ProfService.getElevesByProfId(req.user.id);
    res.json({ eleves });
  } catch (error) {
    console.error('Erreur GET /api/prof/eleves:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * POST /api/prof/eleves/:id/figures/:figureId/valider
 * Valide toutes les étapes d'une figure pour un élève (bulk validation).
 * @access  Private (Professeur lié à l'élève ou Admin)
 * NOTE: Cette route DOIT être déclarée AVANT /:id pour éviter les conflits de routing
 */
router.post('/:id/figures/:figureId/valider', verifierToken, estProfesseurOuAdmin, verifierRelationProfEleve, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const eleveId = parseInt(req.params.id, 10);
    const figureId = parseInt(req.params.figureId, 10);
    const professeur_id = req.user.id;

    if (isNaN(eleveId) || isNaN(figureId)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'IDs invalides' });
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
    console.error('Erreur POST /api/prof/eleves/:id/figures/:figureId/valider:', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la validation en masse',
      details: error.message
    });
  }
});

/**
 * GET /api/prof/eleves/:id
 * Détails complets d'un élève, protégé par le middleware de vérification de relation.
 */
router.get('/:id', verifierToken, estProfesseurOuAdmin, verifierRelationProfEleve, async (req, res) => {
  try {
    const { id } = req.params;
    const details = await ProfService.getEleveDetails(id);

    if (!details) {
      return res.status(404).json({ error: 'Détails de l\'élève non trouvés.' });
    }

    res.json({
      ...details,
      // La relation est attachée à la requête par le middleware
      relation: {
        notes_prof: req.relation.notes_prof,
        date_acceptation: req.relation.date_acceptation
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/prof/eleves/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * PUT /api/prof/eleves/:id/notes
 * Mettre à jour les notes du professeur sur un élève.
 */
router.put('/:id/notes', verifierToken, estProfesseurOuAdmin, verifierRelationProfEleve, async (req, res) => {
  try {
    const { notes } = req.body;
    // req.relation est fourni par le middleware verifierRelationProfEleve
    const updatedRelation = await ProfService.updateNotesForEleve(req.relation, notes);

    res.json({
      message: 'Notes mises à jour avec succès',
      notes: updatedRelation.notes_prof
    });
  } catch (error) {
    console.error('Erreur PUT /api/prof/eleves/:id/notes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * DELETE /api/prof/eleves/:id
 * Retirer un élève de la liste.
 * NOTE: N'utilise pas `verifierRelationProfEleve` car son critère de recherche est
 * légèrement différent (ne vérifie pas si la relation est 'active').
 */
router.delete('/:id', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { id: eleveId } = req.params;
    const professeurId = req.user.id;

    // Vérification manuelle car le critère est différent du middleware standard.
    const relation = await RelationProfEleve.findOne({
      where: { professeur_id: professeurId, eleve_id: eleveId, statut: 'accepte' }
    });

    if (!relation) {
      return res.status(404).json({ error: 'Élève non trouvé dans votre liste' });
    }

    await ProfService.removeEleveFromProf(eleveId, professeurId);

    res.status(200).json({ message: 'Élève retiré avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /api/prof/eleves/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * POST /api/prof/eleves/:eleveId/programmes/assigner
 * Assigner un programme existant à un élève.
 * @access  Private (Professeur ou Admin lié à l'élève)
 */
router.post('/:id/programmes/assigner', verifierToken, estProfesseurOuAdmin, verifierRelationProfEleve, async (req, res) => {
  try {
    const eleveId = parseInt(req.params.id, 10); // Le middleware utilise déjà 'id'
    const { programme_id } = req.body;
    const professeur_id = req.user.id;

    if (!programme_id) {
      return res.status(400).json({ error: 'L\'ID du programme est requis.' });
    }
    const programmeIdNum = parseInt(programme_id, 10); // Assurer que c'est un nombre

    // Vérifier que le programme appartient bien à ce professeur
    const programme = await ProgrammeProf.findOne({
      where: {
        id: programmeIdNum,
        professeur_id: professeur_id
      }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme introuvable ou vous n\'êtes pas le créateur.' });
    }

    // Vérifier si l'assignation existe déjà
    const existingAssignment = await AssignationProgramme.findOne({
      where: {
        programme_id: programmeIdNum,
        eleve_id: eleveId
      }
    });

    if (existingAssignment) {
      return res.status(409).json({ error: 'Ce programme est déjà assigné à cet élève.' });
    }

    const assignation = await AssignationProgramme.create({
      programme_id: programmeIdNum,
      eleve_id: eleveId,
      date_assignation: new Date()
    });

    res.status(201).json({ message: 'Programme assigné avec succès.', assignation });

  } catch (error) {
    console.error('Erreur POST /api/prof/eleves/:eleveId/programmes/assigner:', error);
    // Gérer spécifiquement l'erreur de duplicata si elle se produit malgré tout (race condition)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ce programme est déjà assigné à cet élève.' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de l\'assignation du programme.', details: error.message });
  }
});

module.exports = router;
