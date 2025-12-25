const express = require('express');
const router = express.Router();
const { ProgressionEtape, EtapeProgression, Figure, Discipline, ProgrammeProf, ProgrammeFigure, AssignationProgramme, TentativeEtape, Utilisateur, RelationProfEleve } = require('../models');
const { verifierToken } = require('../middleware/auth');
const { Op } = require('sequelize');

/**
 * GET /progression/utilisateur/:utilisateurId
 * Récupère toutes les progressions d'étapes d'un utilisateur, avec les détails de la figure et discipline.
 */
router.get('/utilisateur/:utilisateurId', verifierToken, async (req, res) => {
  try {
    const { utilisateurId } = req.params;

    if (req.user.role !== 'admin' && req.user.id !== parseInt(utilisateurId)) {
      return res.status(403).json({ error: "Vous ne pouvez consulter que votre propre progression" });
    }

    const progressions = await ProgressionEtape.findAll({
      where: { utilisateur_id: utilisateurId },
      include: [{
        model: EtapeProgression,
        as: 'etape',
        include: [{
          model: Figure,
          include: [Discipline]
        }]
      }],
      order: [['updatedAt', 'DESC']]
    });

    // Optionnel: Grouper par figure côté serveur pour aider le client
    const progressionsParFigure = progressions.reduce((acc, progression) => {
      const figure = progression.etape.Figure;
      if (!acc[figure.id]) {
        acc[figure.id] = {
          figure_id: figure.id,
          figure_nom: figure.nom,
          figure_description: figure.description,
          discipline: figure.Discipline,
          etapes: []
        };
      }
      acc[figure.id].etapes.push(progression);
      return acc;
    }, {});

    res.json(Object.values(progressionsParFigure));
  } catch (err) {
    console.error("Erreur GET /progression/utilisateur/:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

/**
 * GET /progression/programmes/:programmeId
 * Récupère les détails d'un programme (pour l'entraînement)
 * Accessible par l'élève si le programme lui est assigné, ou si c'est son programme personnel
 */
router.get('/programmes/:programmeId', verifierToken, async (req, res) => {
  try {
    const { programmeId } = req.params;
    const utilisateurId = req.user.id;

    // Chercher le programme
    const programme = await ProgrammeProf.findOne({
      where: { id: programmeId, actif: true },
      include: [
        {
          model: ProgrammeFigure,
          as: 'ProgrammesFigures',
          include: [
            {
              model: Figure,
              as: 'Figure',
              include: [{
                model: Discipline,
                as: 'Discipline'
              }]
            }
          ],
          separate: true,
          order: [['ordre', 'ASC']]
        }
      ]
    });

    if (!programme) {
      return res.status(404).json({ error: "Programme non trouvé" });
    }

    // Vérifier que l'utilisateur a accès à ce programme
    // Soit c'est son programme personnel (professeur_id = utilisateurId)
    // Soit le programme lui a été assigné
    const isOwnProgram = programme.professeur_id === utilisateurId;

    if (!isOwnProgram) {
      const assignation = await AssignationProgramme.findOne({
        where: {
          programme_id: programmeId,
          eleve_id: utilisateurId
        }
      });

      if (!assignation) {
        return res.status(403).json({ error: "Vous n'avez pas accès à ce programme" });
      }
    }

    res.json({ programme });
  } catch (err) {
    console.error("Erreur GET /progression/programmes/:programmeId:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

/**
 * POST /progression
 * Démarrer une nouvelle progression sur une figure pour l'utilisateur connecté.
 * Cela crée une entrée ProgressionEtape pour chaque étape de la figure.
 */
router.post('/', verifierToken, async (req, res) => {
  try {
    const { figure_id } = req.body;
    const utilisateur_id = req.user.id;

    if (!figure_id) {
      return res.status(400).json({ error: "figure_id est requis" });
    }

    // 1. Vérifier si une progression existe déjà pour éviter les doublons
    const etapesDeLaFigure = await EtapeProgression.findAll({
      where: { figure_id },
      attributes: ['id']
    });

    if (etapesDeLaFigure.length === 0) {
      return res.status(404).json({ error: "La figure demandée n'a aucune étape définie." });
    }

    const etapeIds = etapesDeLaFigure.map(e => e.id);

    const existingProgressionCount = await ProgressionEtape.count({
      where: {
        utilisateur_id,
        etape_id: { [Op.in]: etapeIds }
      }
    });

    if (existingProgressionCount > 0) {
      return res.status(409).json({
        error: "Vous avez déjà commencé la progression sur cette figure."
      });
    }

    // 2. Créer en masse les nouvelles entrées de progression
    const nouvellesProgressions = etapeIds.map(etape_id => ({
      utilisateur_id,
      etape_id,
      statut: 'non_commence'
    }));

    const progressionsCreees = await ProgressionEtape.bulkCreate(nouvellesProgressions);

    res.status(201).json({ 
      message: `Progression démarrée pour la figure ${figure_id}. ${progressionsCreees.length} étapes créées.`,
      progressions: progressionsCreees
    });

  } catch (err) {
    console.error("Erreur POST /progression:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

/**
 * DELETE /progression/figure/:figureId
 * Supprime toute la progression d'un utilisateur sur une figure.
 */
router.delete('/figure/:figureId', verifierToken, async (req, res) => {
  try {
    const { figureId } = req.params;
    const utilisateur_id = req.user.id;

    // 1. Trouver les étapes associées à la figure
    const etapesDeLaFigure = await EtapeProgression.findAll({
      where: { figure_id: figureId },
      attributes: ['id']
    });

    if (etapesDeLaFigure.length === 0) {
      // Pas de progression à supprimer si la figure n'a pas d'étapes
      return res.json({ message: "Aucune progression à supprimer pour cette figure." });
    }

    const etapeIds = etapesDeLaFigure.map(e => e.id);

    // 2. Supprimer toutes les progressions d'étapes pour cet utilisateur et ces étapes
    const deletedRows = await ProgressionEtape.destroy({
      where: {
        utilisateur_id,
        etape_id: { [Op.in]: etapeIds }
      }
    });

    res.json({ message: "Progression sur la figure supprimée avec succès", etapesSupprimees: deletedRows });
  } catch (err) {
    console.error("Erreur DELETE /progression/figure/:figureId:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

/**
 * GET /progression/figure/:figureId/etapes
 * Récupère les étapes (et leur état de validation) pour une figure donnée et l'utilisateur connecté.
 */
router.get('/figure/:figureId/etapes', verifierToken, async (req, res) => {
  try {
    const { figureId } = req.params;
    const utilisateur_id = req.user.id;

    // Cette requête unique récupère toutes les progressions d'étapes de l'utilisateur
    // pour une figure spécifique, en incluant les détails de chaque étape.
    const progressionsEtape = await ProgressionEtape.findAll({
      where: { utilisateur_id },
      include: [{
        model: EtapeProgression,
        as: 'etape',
        where: { figure_id: figureId }, // Filtrer par la figure
        required: true // Assure que seules les progressions liées à cette figure sont retournées
      }],
      order: [[{ model: EtapeProgression, as: 'etape' }, 'ordre', 'ASC']]
    });

    res.json(progressionsEtape);
  } catch (err) {
    console.error("Erreur GET /progression/figure/:figureId/etapes:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

/**
 * POST /progression/etape/:etapeId/valider
 * Validation manuelle d'une étape pour un élève par un professeur.
 */
router.post('/etape/:etapeId/valider', verifierToken, async (req, res) => {
  try {
    const { etapeId } = req.params;
    const { eleveId, lateralite } = req.body;
    const professeur_id = req.user.id;

    // Vérifier que l'utilisateur est un professeur
    if (req.user.role !== 'professeur' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Accès réservé aux professeurs et admins" });
    }
    
    if (!eleveId) {
      return res.status(400).json({ error: "L'ID de l'élève est requis." });
    }

    // Sécurité: Vérifier que le prof a bien cet élève
    const relation = await RelationProfEleve.findOne({
      where: { professeur_id, eleve_id: eleveId, statut: 'accepte' }
    });
    if (!relation && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Cet élève ne fait pas partie de vos élèves." });
    }

    // Trouver la progression de l'étape pour l'élève
    const progressionEtape = await ProgressionEtape.findOne({
      where: {
        etape_id: etapeId,
        utilisateur_id: eleveId
      }
    });

    if (!progressionEtape) {
      return res.status(404).json({ error: "Aucune progression n'a été démarrée par l'élève pour cette étape." });
    }

    // Mettre à jour la progression
    progressionEtape.statut = 'valide';
    progressionEtape.date_validation = new Date();
    progressionEtape.valide_par_prof_id = professeur_id;
    if (lateralite) {
      progressionEtape.lateralite = lateralite;
    }
    
    await progressionEtape.save();

    res.json({
      message: "Étape validée avec succès par le professeur",
      progression: progressionEtape
    });

  } catch (err) {
    console.error("Erreur POST /progression/etape/:etapeId/valider:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

/**
 * GET /progression/grit-score
 * Calcule le score de persévérance (grit) d'un utilisateur
 * basé sur le ratio échecs/réussites de ses tentatives
 */
router.get('/grit-score', verifierToken, async (req, res) => {
  try {
    const utilisateurId = req.query.utilisateurId ? parseInt(req.query.utilisateurId) : req.user.id;

    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user.role !== 'professeur' && req.user.id !== utilisateurId) {
      return res.status(403).json({ error: "Vous ne pouvez consulter que votre propre score ou celui de vos élèves." });
    }

    const includeProgressionUtilisateur = {
      model: ProgressionEtape,
      where: { utilisateur_id: utilisateurId },
      attributes: [] // On n'a pas besoin des attributs de la table jointe
    };

    // Compter les tentatives réussies en joignant ProgressionEtape
    const totalReussites = await TentativeEtape.count({
      include: [includeProgressionUtilisateur],
      where: { reussie: true }
    });

    // Compter les tentatives échouées en joignant ProgressionEtape
    const totalEchecs = await TentativeEtape.count({
      include: [includeProgressionUtilisateur],
      where: { reussie: false }
    });

    const totalTentatives = totalReussites + totalEchecs;

    if (totalTentatives === 0) {
      return res.json({
        grit_score: 0,
        interpretation: "Aucune tentative enregistrée",
        total_echecs: 0,
        total_reussites: 0,
        total_tentatives: 0,
        ratio: 0
      });
    }

    const ratio = totalEchecs / totalTentatives;
    const gritScore = Math.round(ratio * 100);

    let interpretation;
    if (gritScore < 20) {
      interpretation = "Talent naturel - Très peu d'échecs";
    } else if (gritScore < 40) {
      interpretation = "Normal - Progression régulière";
    } else if (gritScore < 60) {
      interpretation = "Persévérant - Apprend de ses erreurs";
    } else if (gritScore < 80) {
      interpretation = "Très persévérant - Grande résilience";
    } else {
      interpretation = "Extrêmement persévérant - Déterminé malgré les difficultés";
    }

    res.json({
      grit_score: gritScore,
      interpretation,
      total_echecs: totalEchecs,
      total_reussites: totalReussites,
      total_tentatives: totalTentatives,
      ratio: Math.round(ratio * 100) / 100
    });

  } catch (err) {
    console.error("Erreur GET /progression/grit-score:", err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

/**

 * GET /progression/programmes

 * Récupère les programmes assignés à l'utilisateur connecté ET ceux qu'il a créés.

 */

router.get('/programmes', verifierToken, async (req, res) => {

  try {

    const ProgrammeService = require('../services/ProgrammeService');

    const programmes = await ProgrammeService.getProgrammesEleve(req.user.id);

    res.json(programmes);

  } catch (err) {

    console.error("Erreur GET /progression/programmes:", err);

    res.status(500).json({ error: "Erreur serveur" });

  }

});



/**

 * POST /progression/programmes

 * Créer un nouveau programme personnel

 */

router.post('/programmes', verifierToken, async (req, res) => {

  try {

    const { nom, description, figureIds } = req.body;

    const ProgrammeService = require('../services/ProgrammeService');

    

    if (!nom) return res.status(400).json({ error: "Le nom est requis" });



    const programme = await ProgrammeService.creerProgramme(req.user.id, {

      nom,

      description,

      figureIds: figureIds || [],

      estModele: false // Toujours false pour les élèves

    });



    res.status(201).json({ programme });

  } catch (err) {

    console.error("Erreur POST /progression/programmes:", err);

    res.status(500).json({ error: err.message });

  }

});



/**

 * PUT /progression/programmes/:id

 * Modifier un programme personnel

 */

router.put('/programmes/:id', verifierToken, async (req, res) => {

  try {

    const { id } = req.params;

    const { nom, description } = req.body;

    

    // Vérifier propriété

    const programme = await ProgrammeProf.findOne({ where: { id, professeur_id: req.user.id, actif: true } });

    if (!programme) return res.status(404).json({ error: "Programme introuvable ou non autorisé" });



    await programme.update({ nom, description });

    res.json({ programme });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});



/**
 * DELETE /progression/programmes/:id
 * Supprimer un programme personnel
 *
 * POLITIQUE: Bloque la suppression si des partages ou assignations actifs existent
 * L'utilisateur doit d'abord annuler tous les partages et demander aux profs
 * de retirer les assignations
 */
router.delete('/programmes/:id', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ProgrammePartage, AssignationProgramme } = require('../models');

    // 1. Vérifier que le programme existe et appartient à l'utilisateur
    const programme = await ProgrammeProf.findOne({
      where: { id, professeur_id: req.user.id, actif: true }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme introuvable ou non autorisé' });
    }

    // 2. Vérifier les partages actifs (créés par cet utilisateur)
    const partagesActifs = await ProgrammePartage.findAll({
      where: {
        programme_id: id,
        shared_by_id: req.user.id,
        actif: true
      }
    });

    // 3. Vérifier les assignations actives (issues de ce programme)
    const assignationsActives = await AssignationProgramme.findAll({
      where: {
        programme_id: id,
        statut: 'en_cours'
      }
    });

    // 4. Bloquer si des dépendances existent
    if (partagesActifs.length > 0 || assignationsActives.length > 0) {
      return res.status(409).json({
        error: 'Impossible de supprimer ce programme',
        raison: 'Il est actuellement partagé ou assigné à des élèves',
        partages_actifs: partagesActifs.length,
        assignations_actives: assignationsActives.length,
        suggestion: partagesActifs.length > 0
          ? 'Annulez d\'abord tous les partages (DELETE /programmes/:id/partages), puis demandez aux professeurs de retirer les assignations.'
          : 'Demandez aux professeurs de retirer toutes les assignations avant de supprimer ce programme.'
      });
    }

    // 5. Aucune dépendance: procéder à la suppression
    const ProgrammeService = require('../services/ProgrammeService');
    await ProgrammeService.supprimerProgramme(id, req.user.id);

    res.json({ message: 'Programme supprimé avec succès' });

  } catch (err) {
    console.error('Erreur suppression programme:', err);
    res.status(500).json({ error: err.message });
  }
});



/**

 * POST /progression/programmes/:id/figures

 * Ajouter des figures

 */

router.post('/programmes/:id/figures', verifierToken, async (req, res) => {

  try {

    const { id } = req.params;

    const { figureIds } = req.body;



    const programme = await ProgrammeProf.findOne({ where: { id, professeur_id: req.user.id, actif: true } });

    if (!programme) return res.status(404).json({ error: "Programme introuvable" });



    if (!figureIds || !Array.isArray(figureIds)) return res.status(400).json({ error: "figureIds requis" });



    const maxOrdre = await ProgrammeFigure.max('ordre', { where: { programme_id: id } }) || 0;

    

    const ajouts = [];

    for (let i = 0; i < figureIds.length; i++) {

      const [pf, created] = await ProgrammeFigure.findOrCreate({

        where: { programme_id: id, figure_id: figureIds[i] },

        defaults: { ordre: maxOrdre + i + 1 }

      });

      if (created) ajouts.push(pf);

    }



    res.status(201).json({ ajouts });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});



/**

 * DELETE /progression/programmes/:id/figures/:figureId

 * Retirer une figure

 */

router.delete('/programmes/:id/figures/:figureId', verifierToken, async (req, res) => {

  try {

    const { id, figureId } = req.params;



    const programme = await ProgrammeProf.findOne({ where: { id, professeur_id: req.user.id, actif: true } });

    if (!programme) return res.status(404).json({ error: "Programme introuvable" });



    await ProgrammeFigure.destroy({ where: { programme_id: id, figure_id: figureId } });

    res.json({ message: "Figure retirée" });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});



/**

 * PUT /progression/programmes/:id/reorder

 * Réordonner les figures

 */

router.put('/programmes/:id/reorder', verifierToken, async (req, res) => {

  try {

    const { id } = req.params;

    const { figureOrders } = req.body;



    const programme = await ProgrammeProf.findOne({ where: { id, professeur_id: req.user.id, actif: true } });

    if (!programme) return res.status(404).json({ error: "Programme introuvable" });



    if (!figureOrders || !Array.isArray(figureOrders)) return res.status(400).json({ error: "figureOrders requis" });



    for (const { figureId, ordre } of figureOrders) {

      await ProgrammeFigure.update(

        { ordre },

        { where: { programme_id: id, figure_id: figureId } }

      );

    }

    res.json({ message: "Ordre mis à jour" });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});


/**
 * POST /progression/programmes/:id/partager/profs
 * Partager un programme personnel avec un ou plusieurs professeurs
 */
router.post('/programmes/:id/partager/profs', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { professeurIds, note } = req.body;

    // Vérifier que l'utilisateur est le propriétaire du programme
    const programme = await ProgrammeProf.findOne({
      where: { id, professeur_id: req.user.id, actif: true }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme introuvable ou non autorisé' });
    }

    // Vérifier que professeurIds est fourni et est un tableau
    if (!professeurIds || !Array.isArray(professeurIds) || professeurIds.length === 0) {
      return res.status(400).json({
        error: 'professeurIds est requis et doit être un tableau non vide'
      });
    }

    const { ProgrammePartage } = require('../models');
    const partagesCreated = [];
    const partagesSkipped = [];

    // Partager avec chaque professeur
    for (const professeurId of professeurIds) {
      // Vérifier que le professeur existe et a le bon rôle
      const professeur = await Utilisateur.findByPk(professeurId);
      if (!professeur) {
        partagesSkipped.push({ professeurId, raison: 'Professeur introuvable' });
        continue;
      }

      if (professeur.role !== 'professeur' && professeur.role !== 'admin') {
        partagesSkipped.push({ professeurId, raison: 'Utilisateur non professeur' });
        continue;
      }

      // Vérifier que l'élève a une relation avec ce prof
      const relation = await RelationProfEleve.findOne({
        where: {
          eleve_id: req.user.id,
          professeur_id: professeurId,
          statut: 'accepte'
        }
      });

      if (!relation && professeur.role !== 'admin') {
        partagesSkipped.push({ professeurId, raison: 'Pas de relation prof-élève' });
        continue;
      }

      // Créer le partage (ou ignorer si existe déjà)
      try {
        const [partage, created] = await ProgrammePartage.findOrCreate({
          where: {
            programme_id: id,
            shared_with_id: professeurId,
            actif: true
          },
          defaults: {
            shared_by_id: req.user.id,
            type: 'prof',
            date_partage: new Date(),
            note: note || null
          }
        });

        if (created) {
          partagesCreated.push({
            professeurId,
            pseudo: professeur.pseudo
          });
        } else {
          partagesSkipped.push({
            professeurId,
            raison: 'Déjà partagé avec ce professeur'
          });
        }
      } catch (error) {
        partagesSkipped.push({
          professeurId,
          raison: error.message
        });
      }
    }

    res.json({
      message: `Programme partagé avec ${partagesCreated.length} professeur(s)`,
      partagesCreated,
      partagesSkipped
    });

  } catch (err) {
    console.error('Erreur POST /progression/programmes/:id/partager/profs:', err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * POST /progression/programmes/:id/partager/peers
 * Partager un programme personnel avec un ou plusieurs élèves (peer-to-peer)
 */
router.post('/programmes/:id/partager/peers', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { eleveIds, note } = req.body;

    // Vérifier que l'utilisateur est le propriétaire du programme
    const programme = await ProgrammeProf.findOne({
      where: { id, professeur_id: req.user.id, actif: true }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme introuvable ou non autorisé' });
    }

    // Vérifier que eleveIds est fourni et est un tableau
    if (!eleveIds || !Array.isArray(eleveIds) || eleveIds.length === 0) {
      return res.status(400).json({
        error: 'eleveIds est requis et doit être un tableau non vide'
      });
    }

    const { ProgrammePartage } = require('../models');
    const partagesCreated = [];
    const partagesSkipped = [];

    // Partager avec chaque élève
    for (const eleveId of eleveIds) {
      // Vérifier qu'on ne partage pas avec soi-même
      if (eleveId === req.user.id) {
        partagesSkipped.push({ eleveId, raison: 'Impossible de partager avec soi-même' });
        continue;
      }

      // Vérifier que l'élève existe et a le bon rôle
      const eleve = await Utilisateur.findByPk(eleveId);
      if (!eleve) {
        partagesSkipped.push({ eleveId, raison: 'Élève introuvable' });
        continue;
      }

      if (eleve.role !== 'eleve') {
        partagesSkipped.push({ eleveId, raison: 'Utilisateur non élève' });
        continue;
      }

      // Vérifier que les deux élèves sont dans la même école (optionnel - selon règles métier)
      if (req.user.ecole_id && eleve.ecole_id !== req.user.ecole_id) {
        partagesSkipped.push({ eleveId, raison: 'Élève dans une école différente' });
        continue;
      }

      // Créer le partage peer
      try {
        const [partage, created] = await ProgrammePartage.findOrCreate({
          where: {
            programme_id: id,
            shared_with_id: eleveId,
            actif: true
          },
          defaults: {
            shared_by_id: req.user.id,
            type: 'peer',
            date_partage: new Date(),
            note: note || null
          }
        });

        if (created) {
          partagesCreated.push({
            eleveId,
            pseudo: eleve.pseudo
          });
        } else {
          partagesSkipped.push({
            eleveId,
            raison: 'Déjà partagé avec cet élève'
          });
        }
      } catch (error) {
        partagesSkipped.push({
          eleveId,
          raison: error.message
        });
      }
    }

    res.json({
      message: `Programme partagé avec ${partagesCreated.length} élève(s)`,
      partagesCreated,
      partagesSkipped
    });

  } catch (err) {
    console.error('Erreur POST /progression/programmes/:id/partager/peers:', err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * DELETE /progression/programmes/:id/partages/:partageId
 * Annuler UN partage spécifique avec détachement des assignations dépendantes
 * IMPORTANT: Implémente soft delete + détachement pour préserver l'intégrité
 */
router.delete('/programmes/:id/partages/:partageId', verifierToken, async (req, res) => {
  try {
    const { id, partageId } = req.params;
    const sequelize = require('../db');
    const { ProgrammePartage, AssignationProgramme } = require('../models');

    await sequelize.transaction(async (t) => {
      // 1. Vérifier que le partage existe et appartient à l'utilisateur
      const partage = await ProgrammePartage.findOne({
        where: {
          id: partageId,
          programme_id: id,
          shared_by_id: req.user.id,
          actif: true
        },
        include: [{ model: Utilisateur, as: 'SharedWith', attributes: ['pseudo'] }],
        transaction: t
      });

      if (!partage) {
        return res.status(404).json({ error: 'Partage introuvable ou déjà annulé' });
      }

      // 2. Trouver les assignations dépendantes de ce partage
      const assignationsDependantes = await AssignationProgramme.findAll({
        where: { source_partage_id: partageId, statut: 'en_cours' },
        include: [{ model: Utilisateur, as: 'Eleve', attributes: ['pseudo'] }],
        transaction: t
      });

      // 3. Soft delete du partage
      await partage.update({
        actif: false,
        date_annulation: new Date(),
        annule_par: req.user.id
      }, { transaction: t });

      // 4. Détacher les assignations dépendantes (ne pas les supprimer!)
      if (assignationsDependantes.length > 0) {
        await AssignationProgramme.update(
          {
            source_detachee: true,
            note_detachement: `Partage original annulé par ${req.user.pseudo} le ${new Date().toLocaleDateString('fr-FR')}`
          },
          {
            where: { source_partage_id: partageId },
            transaction: t
          }
        );
      }

      res.json({
        message: 'Partage annulé avec succès',
        partage_avec: partage.SharedWith.pseudo,
        assignations_detachees: assignationsDependantes.length,
        details: assignationsDependantes.length > 0
          ? `${assignationsDependantes.length} assignation(s) détachée(s) mais restent actives`
          : null
      });
    });

  } catch (err) {
    console.error('Erreur DELETE /progression/programmes/:id/partages/:partageId:', err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * DELETE /progression/programmes/:id/partages
 * Annuler TOUS les partages d'un programme (bulk)
 * Query param: type (optionnel) - 'prof' ou 'peer' pour filtrer
 */
router.delete('/programmes/:id/partages', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // Optional: filtrer par type
    const sequelize = require('../db');
    const { ProgrammePartage, AssignationProgramme } = require('../models');

    // Vérifier que l'utilisateur est le propriétaire
    const programme = await ProgrammeProf.findOne({
      where: { id, professeur_id: req.user.id, actif: true }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme introuvable ou non autorisé' });
    }

    await sequelize.transaction(async (t) => {
      // 1. Trouver tous les partages actifs
      const whereClause = {
        programme_id: id,
        shared_by_id: req.user.id,
        actif: true
      };

      if (type && ['prof', 'peer'].includes(type)) {
        whereClause.type = type;
      }

      const partagesActifs = await ProgrammePartage.findAll({
        where: whereClause,
        transaction: t
      });

      if (partagesActifs.length === 0) {
        return res.status(404).json({ error: 'Aucun partage actif à annuler' });
      }

      const partageIds = partagesActifs.map(p => p.id);

      // 2. Trouver toutes les assignations dépendantes
      const assignationsDependantes = await AssignationProgramme.count({
        where: { source_partage_id: partageIds, statut: 'en_cours' },
        transaction: t
      });

      // 3. Soft delete de tous les partages
      await ProgrammePartage.update(
        {
          actif: false,
          date_annulation: new Date(),
          annule_par: req.user.id
        },
        { where: { id: partageIds }, transaction: t }
      );

      // 4. Détacher toutes les assignations dépendantes
      if (assignationsDependantes > 0) {
        await AssignationProgramme.update(
          {
            source_detachee: true,
            note_detachement: `Partages annulés en masse par ${req.user.pseudo} le ${new Date().toLocaleDateString('fr-FR')}`
          },
          { where: { source_partage_id: partageIds }, transaction: t }
        );
      }

      res.json({
        message: `${partagesActifs.length} partage(s) annulé(s)`,
        count: partagesActifs.length,
        type_filtre: type || 'tous',
        assignations_detachees: assignationsDependantes
      });
    });

  } catch (err) {
    console.error('Erreur DELETE /progression/programmes/:id/partages:', err);
    res.status(500).json({ error: err.message });
  }
});


/**
 * GET /progression/programmes/:id/partages
 * Lister TOUS les utilisateurs (profs + élèves) avec qui un programme est partagé
 * Query param: type (optionnel) - 'prof' ou 'peer' pour filtrer
 */
router.get('/programmes/:id/partages', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // Optional: filtrer par type

    // Vérifier que l'utilisateur est le propriétaire du programme
    const programme = await ProgrammeProf.findOne({
      where: { id, professeur_id: req.user.id, actif: true }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme introuvable ou non autorisé' });
    }

    const { ProgrammePartage } = require('../models');

    // Construire le where clause
    const whereClause = {
      programme_id: id,
      shared_by_id: req.user.id,
      actif: true
    };

    if (type && ['prof', 'peer'].includes(type)) {
      whereClause.type = type;
    }

    // Récupérer tous les partages actifs avec les infos des destinataires
    const partages = await ProgrammePartage.findAll({
      where: whereClause,
      include: [{
        model: Utilisateur,
        as: 'SharedWith',
        attributes: ['id', 'pseudo', 'email', 'role']
      }],
      order: [['date_partage', 'DESC']]
    });

    // Formater la réponse
    const partagesFormatted = partages.map(p => ({
      id: p.id,
      shared_with_id: p.shared_with_id,
      pseudo: p.SharedWith.pseudo,
      email: p.SharedWith.email,
      role: p.SharedWith.role,
      type: p.type,
      note: p.note,
      date_partage: p.date_partage
    }));

    res.json(partagesFormatted);

  } catch (err) {
    console.error('Erreur GET /progression/programmes/:id/partages:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
