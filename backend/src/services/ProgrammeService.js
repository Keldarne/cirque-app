const { ProgrammeProf, ProgrammeFigure, AssignationProgramme, Figure, RelationProfEleve, ProgressionEtape, EtapeProgression, Utilisateur, Groupe } = require('../models');
const sequelize = require('../../db');
const { Op } = require('sequelize');
const GroupeProgrammeService = require('./GroupeProgrammeService');

class ProgrammeService {
  /**
   * Créer un nouveau programme
   */
  async creerProgramme(professeurId, { nom, description, figureIds, estModele = false }) {
    return await sequelize.transaction(async (t) => {
      const programme = await ProgrammeProf.create({
        professeur_id: professeurId,
        nom,
        description,
        est_modele: estModele,
        actif: true
      }, { transaction: t });

      for (let i = 0; i < figureIds.length; i++) {
        await ProgrammeFigure.create({
          programme_id: programme.id,
          figure_id: figureIds[i],
          ordre: i + 1
        }, { transaction: t });
      }

      return programme;
    });
  }

  /**
   * Assigner un programme à un élève
   */
  async assignerProgramme(programmeId, eleveId, professeurId) {
    // Vérifications hors transaction
    const programme = await ProgrammeProf.findOne({
      where: { id: programmeId, professeur_id: professeurId, actif: true }
    });
    if (!programme) {
      throw new Error('Programme introuvable ou non autorisé');
    }

    const relation = await RelationProfEleve.findOne({
      where: { professeur_id: professeurId, eleve_id: eleveId, statut: 'accepte' }
    });
    if (!relation) {
      throw new Error('Cet élève ne vous est pas assigné');
    }

    // Opérations critiques dans une transaction
    return await sequelize.transaction(async (t) => {
      const assignation = await AssignationProgramme.create({
        programme_id: programmeId,
        eleve_id: eleveId,
        date_assignation: new Date(),
        statut: 'en_cours',
        source_type: 'direct',
        source_groupe_id: null
      }, { transaction: t });
      
      const figuresDuProgramme = await ProgrammeFigure.findAll({
        where: { programme_id: programmeId },
        attributes: ['figure_id'],
        transaction: t
      });
      const figureIds = figuresDuProgramme.map(f => f.figure_id);

      if (figureIds.length > 0) {
        const etapesDuProgramme = await EtapeProgression.findAll({
          where: { figure_id: { [Op.in]: figureIds } },
          attributes: ['id'],
          transaction: t
        });
  
        // Pour chaque étape du programme, on s'assure qu'une ligne de progression existe
        for (const etape of etapesDuProgramme) {
          await ProgressionEtape.findOrCreate({
            where: { utilisateur_id: eleveId, etape_id: etape.id },
            defaults: { statut: 'non_commence' },
            transaction: t
          });
        }
      }

      return assignation;
    });
  }

  /**
   * Assigner un programme de manière unifiée (élèves + groupes)
   * @param {number} programmeId - ID du programme
   * @param {number} professeurId - ID du professeur
   * @param {Array<number>} eleveIds - IDs des élèves à assigner directement
   * @param {Array<number>} groupeIds - IDs des groupes à assigner
   * @param {number|null} sourcePartageId - ID du partage source (si programme partagé par un élève)
   * @returns {Promise<{eleves: Object, groupes: Object}>}
   */
  async assignerProgrammeUnifie(programmeId, professeurId, eleveIds = [], groupeIds = [], sourcePartageId = null) {
    // Vérifier que le programme appartient au professeur
    const programme = await ProgrammeProf.findOne({
      where: { id: programmeId, professeur_id: professeurId, actif: true }
    });

    if (!programme) {
      throw new Error('Programme introuvable ou non autorisé');
    }

    // Vérifier que le prof existe et récupérer son école
    const professeur = await Utilisateur.findByPk(professeurId, {
      attributes: ['id', 'ecole_id']
    });

    if (!professeur) {
      throw new Error('Professeur introuvable');
    }

    const results = {
      eleves: { assigned: 0, skipped: 0 },
      groupes: { assigned: 0, skipped: 0, totalMembers: 0 }
    };

    // 1. Assigner aux élèves individuels
    for (const eleveId of eleveIds) {
      try {
        // Vérifier que l'élève appartient au prof (école-based ou relation)
        const eleve = await Utilisateur.findByPk(eleveId);
        if (!eleve) continue;

        // Vérification accès
        let hasAccess = false;
        if (professeur.ecole_id && eleve.ecole_id === professeur.ecole_id) {
          hasAccess = true;
        } else if (!professeur.ecole_id) {
          const relation = await RelationProfEleve.findOne({
            where: { professeur_id: professeurId, eleve_id: eleveId, statut: 'accepte' }
          });
          hasAccess = !!relation;
        }

        if (!hasAccess) continue;

        // Créer assignation avec traçabilité du partage source
        await AssignationProgramme.create({
          programme_id: programmeId,
          eleve_id: eleveId,
          date_assignation: new Date(),
          statut: 'en_cours',
          source_type: 'direct',
          source_groupe_id: null,
          source_partage_id: sourcePartageId || null  // Nouveau: lien vers partage source
        });

        results.eleves.assigned++;
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          results.eleves.skipped++;
        } else {
          console.error('Erreur assignation élève:', err);
        }
      }
    }

    // 2. Assigner aux groupes
    for (const groupeId of groupeIds) {
      try {
        // Vérifier que le groupe appartient au professeur
        const groupe = await Groupe.findOne({
          where: { id: groupeId, professeur_id: professeurId, actif: true }
        });

        if (!groupe) continue;

        // Utiliser le service GroupeProgrammeService pour assigner + propager
        // Note: sourcePartageId sera propagé aux assignations individuelles via le service
        const propagation = await GroupeProgrammeService.assignerProgrammeAuGroupe(
          programmeId,
          groupeId,
          sourcePartageId  // Nouveau: passer le partage source
        );

        results.groupes.assigned++;
        results.groupes.totalMembers += propagation.totalMembers;
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          results.groupes.skipped++;
        } else {
          console.error('Erreur assignation groupe:', err);
        }
      }
    }

    return results;
  }

  /**
   * Récupérer tous les programmes d'un professeur
   */
  async getProgrammesProf(professeurId) {
    return await ProgrammeProf.findAll({
      where: { professeur_id: professeurId, actif: true },
      include: [
        {
          model: ProgrammeFigure,
          as: 'ProgrammesFigures',
          include: [{ model: Figure, as: 'Figure' }],
          separate: true,
          order: [['ordre', 'ASC']]
        },
        {
          model: AssignationProgramme,
          as: 'Assignations',
          attributes: ['id', 'eleve_id', 'statut'],
          separate: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Récupérer les programmes assignés à un élève
   * Inclut aussi les programmes créés par l'élève lui-même
   */
  async getProgrammesEleve(eleveId) {
    // 1. Programmes assignés par des profs
    const assignations = await AssignationProgramme.findAll({
      where: { eleve_id: eleveId, statut: 'en_cours' },
      include: [{
        model: ProgrammeProf,
        as: 'Programme',
        where: { actif: true },
        include: [{
          model: ProgrammeFigure,
          as: 'ProgrammesFigures',
          include: [{ model: Figure, as: 'Figure' }],
          separate: true,
          order: [['ordre', 'ASC']]
        }]
      }],
      order: [['date_assignation', 'DESC']]
    });

    const programmesAssignes = assignations.map(a => ({
      ...a.Programme.toJSON(),
      date_assignation: a.date_assignation,
      assignation_id: a.id,
      type: 'assigne'
    }));

    // 2. Programmes créés par l'élève (personnels)
    const programmesPerso = await ProgrammeProf.findAll({
      where: { 
        professeur_id: eleveId, 
        actif: true 
      },
      include: [{
        model: ProgrammeFigure,
        as: 'ProgrammesFigures',
        include: [{ model: Figure, as: 'Figure' }],
        separate: true,
        order: [['ordre', 'ASC']]
      }],
      order: [['createdAt', 'DESC']]
    });

    const programmesCrees = programmesPerso.map(p => ({
      ...p.toJSON(),
      date_assignation: p.createdAt, // Pour le tri
      assignation_id: null,
      type: 'perso_cree'
    }));

    // Fusionner et trier
    return [...programmesCrees, ...programmesAssignes].sort((a, b) => new Date(b.date_assignation) - new Date(a.date_assignation));
  }

  /**
   * Dupliquer un programme (pour réutiliser un modèle)
   */
  async dupliquerProgramme(programmeId, professeurId, nouveauNom) {
    const original = await ProgrammeProf.findOne({
      where: { id: programmeId, actif: true },
      include: [{
        model: ProgrammeFigure,
        as: 'ProgrammesFigures',
        separate: true,
        order: [['ordre', 'ASC']]
      }]
    });

    if (!original) {
      throw new Error('Programme original introuvable');
    }

    if (original.professeur_id !== professeurId && !original.est_modele) {
      throw new Error('Vous ne pouvez pas dupliquer ce programme');
    }

    const figureIds = original.ProgrammesFigures.map(pf => pf.figure_id);

    return await this.creerProgramme(professeurId, {
      nom: nouveauNom,
      description: original.description,
      figureIds,
      estModele: false
    });
  }

  /**
   * Retirer une assignation individuelle d'élève
   * @param {number} programmeId - ID du programme
   * @param {number} eleveId - ID de l'élève
   * @param {number} professeurId - ID du professeur (pour vérification)
   * @returns {Promise<boolean>}
   */
  async retirerAssignationEleve(programmeId, eleveId, professeurId) {
    // Vérifier que le programme appartient au professeur
    const programme = await ProgrammeProf.findOne({
      where: { id: programmeId, professeur_id: professeurId, actif: true }
    });

    if (!programme) {
      throw new Error('Programme introuvable ou non autorisé');
    }

    // Supprimer uniquement les assignations directes (pas celles via groupe)
    const deleted = await AssignationProgramme.destroy({
      where: {
        programme_id: programmeId,
        eleve_id: eleveId,
        source_type: 'direct'
      }
    });

    return deleted > 0;
  }

  /**
   * Supprimer un programme (soft delete en marquant actif=false)
   */
  async supprimerProgramme(programmeId, professeurId) {
    const programme = await ProgrammeProf.findOne({
      where: { id: programmeId, professeur_id: professeurId }
    });

    if (!programme) {
      throw new Error('Programme introuvable');
    }

    programme.actif = false;
    await programme.save();

    return { message: 'Programme supprimé' };
  }
}

module.exports = new ProgrammeService();
