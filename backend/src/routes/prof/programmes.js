const router = require('express').Router();
const { verifierToken, estProfesseurOuAdmin, authorize } = require('../../middleware/auth');
const ProgrammeService = require('../../services/ProgrammeService');
const GroupeProgrammeService = require('../../services/GroupeProgrammeService');
const { ProgrammeProf, ProgrammeFigure, Figure, Discipline, AssignationProgramme } = require('../../models');

// GET /api/prof/programmes - Liste des programmes du prof
router.get('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const programmes = await ProgrammeService.getProgrammesProf(req.user.id);
    res.json({ programmes });
  } catch (error) {
    console.error('Erreur getProgrammesProf:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prof/programmes - Créer un programme
router.post('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { nom, description, figureIds, estModele } = req.body;

    if (!nom || !figureIds || figureIds.length === 0) {
      return res.status(400).json({ error: 'Nom et figures requis' });
    }

    const programme = await ProgrammeService.creerProgramme(req.user.id, {
      nom,
      description,
      figureIds,
      estModele: estModele || false
    });

    res.status(201).json({ programme });
  } catch (error) {
    console.error('Erreur creerProgramme:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prof/programmes/:id - Détails d'un programme
router.get('/:id', verifierToken, estProfesseurOuAdmin, authorize(ProgrammeProf, 'professeur_id', { actif: true }), async (req, res) => {
  try {
    const { Utilisateur } = require('../../models');
    const programme = req.resource; // ProgrammeProf instance attaché par le middleware authorize

    // Re-fetch le programme avec toutes les includes nécessaires pour la réponse
    const programmeWithIncludes = await ProgrammeProf.findByPk(programme.id, {
      include: [
        {
          model: ProgrammeFigure,
          as: 'ProgrammesFigures',
          include: [{
            model: Figure,
            as: 'Figure',
            include: [{ model: Discipline }]
          }],
          separate: true,
          order: [['ordre', 'ASC']]
        },
        {
          model: AssignationProgramme,
          as: 'Assignations',
          include: [{
            model: Utilisateur,
            as: 'Eleve',
            attributes: ['id', 'nom', 'prenom', 'email']
          }]
        }
      ]
    });

    res.json({ programme: programmeWithIncludes });
  } catch (error) {
    console.error('Erreur getProgramme:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/prof/programmes/:id - Modifier nom/description d'un programme
router.put('/:id', verifierToken, estProfesseurOuAdmin, authorize(ProgrammeProf, 'professeur_id', { actif: true }), async (req, res) => {
  try {
    const { nom, description } = req.body;
    const programme = req.resource; // ProgrammeProf instance attaché par le middleware authorize

    await programme.update({ nom, description });
    res.json({ programme });
  } catch (error) {
    console.error('Erreur PUT programmes/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prof/programmes/:id/figures - Ajouter des figures au programme
router.post('/:id/figures', verifierToken, estProfesseurOuAdmin, authorize(ProgrammeProf, 'professeur_id', { actif: true }), async (req, res) => {
  try {
    const { figureIds } = req.body;

    if (!figureIds || !Array.isArray(figureIds) || figureIds.length === 0) {
      return res.status(400).json({ error: 'figureIds requis (array)' });
    }

    const programme = req.resource; // ProgrammeProf instance attaché par le middleware authorize

    // Récupérer l'ordre max actuel
    const maxOrdre = await ProgrammeFigure.max('ordre', {
      where: { programme_id: programme.id }
    }) || 0;

    // Ajouter les nouvelles figures
    const ajouts = [];
    for (let i = 0; i < figureIds.length; i++) {
      const [pf, created] = await ProgrammeFigure.findOrCreate({
        where: { programme_id: programme.id, figure_id: figureIds[i] },
        defaults: { ordre: maxOrdre + i + 1 }
      });
      if (created) ajouts.push(pf);
    }

    res.status(201).json({ ajouts, count: ajouts.length });
  } catch (error) {
    console.error('Erreur POST programmes/:id/figures:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/prof/programmes/:id/figures/:figureId - Retirer une figure du programme
router.delete('/:id/figures/:figureId', verifierToken, estProfesseurOuAdmin, authorize(ProgrammeProf, 'professeur_id', { actif: true }), async (req, res) => {
  try {
    const { figureId } = req.params; // 'id' from req.params is not used directly here, but implicitly by authorize
    const programme = req.resource; // ProgrammeProf instance attaché par le middleware authorize

    await ProgrammeFigure.destroy({
      where: { programme_id: programme.id, figure_id: figureId }
    });

    res.json({ message: 'Figure retirée du programme' });
  } catch (error) {
    console.error('Erreur DELETE programmes/:id/figures/:figureId:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/prof/programmes/:id/reorder - Réordonner les figures du programme
router.put('/:id/reorder', verifierToken, estProfesseurOuAdmin, authorize(ProgrammeProf, 'professeur_id', { actif: true }), async (req, res) => {
  try {
    const { figureOrders } = req.body; // Array: [{ figureId, ordre }]

    if (!figureOrders || !Array.isArray(figureOrders)) {
      return res.status(400).json({ error: 'figureOrders requis (array)' });
    }

    const programme = req.resource; // ProgrammeProf instance attaché par le middleware authorize

    // Mettre à jour l'ordre
    for (const { figureId, ordre } of figureOrders) {
      await ProgrammeFigure.update(
        { ordre },
        { where: { programme_id: programme.id, figure_id: figureId } }
      );
    }

    res.json({ message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('Erreur PUT programmes/:id/reorder:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prof/programmes/:id/dupliquer - Dupliquer un programme depuis un modèle
router.post('/:id/dupliquer', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { nouveau_nom } = req.body;

    if (!nouveau_nom) {
      return res.status(400).json({ error: 'nouveau_nom requis' });
    }

    const programme = await ProgrammeService.dupliquerProgramme(
      req.params.id,
      req.user.id,
      nouveau_nom
    );

    res.status(201).json({ programme, message: 'Programme dupliqué avec succès' });
  } catch (error) {
    console.error('Erreur dupliquerProgramme:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prof/programmes/:id/assigner - Assigner programme de manière unifiée (élèves + groupes)
router.post('/:id/assigner', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { eleve_ids = [], groupe_ids = [], source_partage_id } = req.body;

    if (!Array.isArray(eleve_ids) || !Array.isArray(groupe_ids)) {
      return res.status(400).json({ error: 'eleve_ids et groupe_ids doivent être des tableaux' });
    }

    if (eleve_ids.length === 0 && groupe_ids.length === 0) {
      return res.status(400).json({ error: 'Au moins un élève ou un groupe doit être sélectionné' });
    }

    // Si source_partage_id fourni, vérifier que le partage existe et est actif
    if (source_partage_id) {
      const { ProgrammePartage } = require('../../models');
      const partage = await ProgrammePartage.findOne({
        where: {
          id: source_partage_id,
          programme_id: req.params.id,
          shared_with_id: req.user.id,
          type: 'prof',
          actif: true
        }
      });

      if (!partage) {
        return res.status(400).json({
          error: 'Partage introuvable ou inactif',
          details: 'Le source_partage_id fourni ne correspond pas à un partage actif pour ce professeur'
        });
      }
    }

    const results = await ProgrammeService.assignerProgrammeUnifie(
      req.params.id,
      req.user.id,
      eleve_ids,
      groupe_ids,
      source_partage_id  // Nouveau paramètre
    );

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Erreur assignerProgrammeUnifie:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prof/programmes/:id/assignations - Récupérer résumé des assignations
router.get('/:id/assignations', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const summary = await GroupeProgrammeService.getAssignationsSummary(
      req.params.id,
      req.user.id
    );

    res.json(summary);
  } catch (error) {
    console.error('Erreur getAssignationsSummary:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/prof/programmes/:id/groupes/:groupeId - Retirer assignation de groupe
router.delete('/:id/groupes/:groupeId', verifierToken, estProfesseurOuAdmin, authorize(ProgrammeProf, 'professeur_id', { actif: true }), async (req, res) => {
  try {
    const { groupeId } = req.params; // 'id' from req.params is not used directly here, but implicitly by authorize
    const programme = req.resource; // ProgrammeProf instance attaché par le middleware authorize

    const success = await GroupeProgrammeService.retirerProgrammeDuGroupe(programme.id, groupeId);

    if (!success) {
      return res.status(404).json({ error: 'Assignation de groupe introuvable' });
    }

    res.json({
      message: 'Assignation de groupe retirée avec succès',
      note: 'Les élèves gardent leurs assignations individuelles'
    });
  } catch (error) {
    console.error('Erreur retirerProgrammeDuGroupe:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/prof/programmes/:id/eleves/:eleveId - Retirer assignation individuelle
router.delete('/:id/eleves/:eleveId', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { id, eleveId } = req.params;

    const success = await ProgrammeService.retirerAssignationEleve(id, eleveId, req.user.id);

    if (!success) {
      return res.status(404).json({ error: 'Assignation introuvable' });
    }

    res.json({
      message: 'Assignation retirée avec succès'
    });
  } catch (error) {
    console.error('Erreur retirerAssignationEleve:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/prof/programmes/:id - Supprimer un programme
router.delete('/:id', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const result = await ProgrammeService.supprimerProgramme(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Erreur supprimerProgramme:', error);
    res.status(404).json({ error: error.message });
  }
});

// GET /api/prof/programmes/partages - Liste des programmes partagés avec le prof
router.get('/partages', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { Utilisateur, ProgrammePartage } = require('../../models');

    // Récupérer les partages ACTIFS partagés avec ce professeur (nouveau modèle polymorphique)
    const partages = await ProgrammePartage.findAll({
      where: {
        shared_with_id: req.user.id,  // Nouveau: polymorphique
        type: 'prof',                   // Type de partage
        actif: true                     // Seulement les partages actifs
      },
      include: [
        {
          model: ProgrammeProf,
          as: 'Programme',
          where: { actif: true },
          include: [
            {
              model: ProgrammeFigure,
              as: 'ProgrammesFigures',
              include: [
                {
                  model: Figure,
                  as: 'Figure',
                  include: [{ model: Discipline, as: 'Discipline' }]
                }
              ],
              separate: true,
              order: [['ordre', 'ASC']]
            }
          ]
        },
        {
          model: Utilisateur,
          as: 'SharedBy',  // Nouveau: élève qui a partagé
          attributes: ['id', 'pseudo', 'email', 'nom', 'prenom']
        }
      ],
      order: [['date_partage', 'DESC']]
    });

    // Formater la réponse
    const programmesEnrichis = partages.map(partage => {
      const prog = partage.Programme.toJSON();

      return {
        ...prog,
        partage_id: partage.id,
        date_partage: partage.date_partage,
        note: partage.note,  // Note optionnelle de l'élève
        partage_par: {
          id: partage.SharedBy.id,
          pseudo: partage.SharedBy.pseudo,
          email: partage.SharedBy.email,
          nom: partage.SharedBy.nom,
          prenom: partage.SharedBy.prenom
        }
      };
    });

    res.json({
      programmes: programmesEnrichis,
      total: programmesEnrichis.length
    });

  } catch (error) {
    console.error('Erreur getProgrammesPartages:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
