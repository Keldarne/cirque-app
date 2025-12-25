/**
 * Service GroupeProgramme
 * Gère l'assignation de programmes à des groupes et la propagation aux membres
 */

const { AssignationGroupeProgramme, AssignationProgramme, GroupeEleve, Groupe, Utilisateur, ProgrammeProf } = require('../models');
const sequelize = require('../db');

class GroupeProgrammeService {
  /**
   * Assigne un programme à un groupe
   * Propage automatiquement aux membres actuels du groupe
   * @param {number} programmeId - ID du programme
   * @param {number} groupeId - ID du groupe
   * @param {number|null} sourcePartageId - ID du partage source (si programme partagé)
   * @returns {Promise<{assignedCount: number, skippedCount: number, totalMembers: number}>}
   */
  static async assignerProgrammeAuGroupe(programmeId, groupeId, sourcePartageId = null) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Créer l'assignation groupe-programme
      await AssignationGroupeProgramme.create({
        programme_id: programmeId,
        groupe_id: groupeId,
        date_assignation: new Date()
      }, { transaction });

      // 2. Récupérer tous les membres actuels du groupe
      const membres = await GroupeEleve.findAll({
        where: { groupe_id: groupeId },
        transaction
      });

      const totalMembers = membres.length;
      let assignedCount = 0;
      let skippedCount = 0;

      // 3. Propager le programme à chaque membre avec traçabilité du partage
      for (const membre of membres) {
        try {
          await AssignationProgramme.create({
            programme_id: programmeId,
            eleve_id: membre.eleve_id,
            date_assignation: new Date(),
            statut: 'en_cours',
            source_type: 'groupe',
            source_groupe_id: groupeId,
            source_partage_id: sourcePartageId || null  // Nouveau: lien vers partage source
          }, { transaction });
          assignedCount++;
        } catch (err) {
          // Si doublon (UNIQUE constraint), on skip
          if (err.name === 'SequelizeUniqueConstraintError') {
            skippedCount++;
          } else {
            throw err;
          }
        }
      }

      await transaction.commit();

      return {
        assignedCount,
        skippedCount,
        totalMembers
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Retire l'assignation d'un programme à un groupe
   * Note: Les assignations individuelles des membres sont conservées
   * @param {number} programmeId - ID du programme
   * @param {number} groupeId - ID du groupe
   * @returns {Promise<boolean>}
   */
  static async retirerProgrammeDuGroupe(programmeId, groupeId) {
    const deleted = await AssignationGroupeProgramme.destroy({
      where: {
        programme_id: programmeId,
        groupe_id: groupeId
      }
    });

    return deleted > 0;
  }

  /**
   * Propage tous les programmes d'un groupe à un nouveau membre
   * Appelé automatiquement quand un élève est ajouté à un groupe
   * @param {number} groupeId - ID du groupe
   * @param {number} eleveId - ID de l'élève
   * @returns {Promise<{assignedCount: number, skippedCount: number}>}
   */
  static async propagerProgrammesAuNouveauMembre(groupeId, eleveId) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Récupérer tous les programmes assignés au groupe
      const programmesGroupe = await AssignationGroupeProgramme.findAll({
        where: { groupe_id: groupeId },
        transaction
      });

      let assignedCount = 0;
      let skippedCount = 0;

      // 2. Assigner chaque programme à l'élève
      for (const assignation of programmesGroupe) {
        try {
          await AssignationProgramme.create({
            programme_id: assignation.programme_id,
            eleve_id: eleveId,
            date_assignation: new Date(),
            statut: 'en_cours',
            source_type: 'groupe',
            source_groupe_id: groupeId
          }, { transaction });
          assignedCount++;
        } catch (err) {
          // Si doublon (élève a déjà ce programme), on skip
          if (err.name === 'SequelizeUniqueConstraintError') {
            skippedCount++;
          } else {
            throw err;
          }
        }
      }

      await transaction.commit();

      return {
        assignedCount,
        skippedCount
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Récupère le résumé des assignations d'un programme
   * Retourne les groupes et les élèves individuels (source_type='direct' seulement)
   * @param {number} programmeId - ID du programme
   * @param {number} professeurId - ID du professeur (pour vérification)
   * @returns {Promise<{groupes: Array, individus: Array}>}
   */
  static async getAssignationsSummary(programmeId, professeurId) {
    // 1. Vérifier que le programme appartient au professeur
    const programme = await ProgrammeProf.findOne({
      where: {
        id: programmeId,
        professeur_id: professeurId
      }
    });

    if (!programme) {
      throw new Error('Programme introuvable ou accès non autorisé');
    }

    // 2. Récupérer les groupes assignés avec nombre de membres
    const groupes = await AssignationGroupeProgramme.findAll({
      where: { programme_id: programmeId },
      include: [
        {
          model: Groupe,
          as: 'Groupe',
          attributes: ['id', 'nom', 'couleur'],
          include: [
            {
              model: GroupeEleve,
              as: 'membres',
              attributes: ['eleve_id'],
              separate: true
            }
          ]
        }
      ]
    });

    const groupesFormatted = groupes.map(agp => ({
      id: agp.Groupe.id,
      nom: agp.Groupe.nom,
      couleur: agp.Groupe.couleur,
      nombre_membres: agp.Groupe.membres ? agp.Groupe.membres.length : 0
    }));

    // 3. Récupérer les élèves assignés directement (pas via groupe)
    const individus = await AssignationProgramme.findAll({
      where: {
        programme_id: programmeId,
        source_type: 'direct'
      },
      include: [
        {
          model: Utilisateur,
          as: 'Eleve',
          attributes: ['id', 'prenom', 'nom', 'email', 'avatar_url']
        }
      ]
    });

    const individusFormatted = individus.map(ap => ({
      eleve_id: ap.eleve_id,
      prenom: ap.Eleve.prenom,
      nom: ap.Eleve.nom,
      email: ap.Eleve.email,
      avatar_url: ap.Eleve.avatar_url,
      statut: ap.statut,
      date_assignation: ap.date_assignation
    }));

    return {
      groupes: groupesFormatted,
      individus: individusFormatted
    };
  }
}

module.exports = GroupeProgrammeService;
