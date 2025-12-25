const {
  RelationProfEleve,
  Utilisateur,
  Groupe,
  GroupeEleve,
  Figure,
  ProgressionEtape,
  EtapeProgression,
  Badge,
  BadgeUtilisateur,
  Streak,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

class ProfService {

  /**
   * Récupère tous les élèves de la même école qu'un professeur
   * (Nouveau système basé sur ecole_id)
   * @param {number} professeurId - L'ID de l'utilisateur professeur
   * @returns {Promise<Array>} - Liste des élèves de l'école
   */
  static async getElevesByEcole(professeurId) {
    // 1. Récupérer le professeur et son école
    const professeur = await Utilisateur.findByPk(professeurId, {
      attributes: ['id', 'ecole_id']
    });

    if (!professeur || !professeur.ecole_id) {
      return []; // Pas d'école = pas d'élèves auto
    }

    // 2. Récupérer tous les élèves de la même école
    const eleves = await Utilisateur.findAll({
      where: {
        ecole_id: professeur.ecole_id,
        role: { [Op.in]: ['eleve', 'standard'] }
      },
      attributes: ['id', 'nom', 'prenom', 'email', 'avatar_url', 'niveau', 'xp_total'],
      include: [
        {
          model: Streak,
          as: 'streak',
          attributes: ['jours_consecutifs', 'record_personnel'],
          required: false
        },
        {
          model: GroupeEleve,
          include: [
            {
              model: Groupe,
              attributes: ['id', 'nom', 'couleur'],
              where: { professeur_id: professeurId },
              required: false
            }
          ],
          required: false
        }
      ],
      order: [['nom', 'ASC'], ['prenom', 'ASC']]
    });

    // 3. Formatter le résultat
    return eleves.map(eleve => {
      const eleveData = eleve.toJSON();
      // Extraire les groupes de ce prof
      const groupesDuProf = eleveData.groupes
        ? eleveData.groupes
            .filter(ge => ge.Groupe)
            .map(ge => ({
              id: ge.Groupe.id,
              nom: ge.Groupe.nom,
              couleur: ge.Groupe.couleur
            }))
        : [];

      delete eleveData.groupes; // Nettoyer

      return {
        ...eleveData,
        groupes: groupesDuProf
      };
    });
  }

  /**
   * Récupère la liste de tous les élèves actifs liés à un professeur.
   * Utilise le système école-based si le prof a une école, sinon fallback sur RelationProfEleve
   * @param {number} professeurId - L'ID de l'utilisateur professeur.
   * @returns {Promise<Array>} - Une liste d'objets élèves avec leurs détails.
   */
  static async getElevesByProfId(professeurId) {
    // 1. Vérifier si le prof a une école
    const professeur = await Utilisateur.findByPk(professeurId, {
      attributes: ['id', 'ecole_id']
    });

    if (!professeur) {
      return [];
    }

    // 2. Si le prof a une école, utiliser le système école-based
    if (professeur.ecole_id) {
      return this.getElevesByEcole(professeurId);
    }

    // 3. Sinon, fallback sur l'ancien système d'invitations (profs solo)
    const relations = await RelationProfEleve.findAll({
      where: {
        professeur_id: professeurId,
        statut: 'accepte',
        actif: true
      },
      include: [
        {
          model: Utilisateur,
          as: 'eleve',
          attributes: ['id', 'nom', 'prenom', 'email', 'avatar_url', 'niveau', 'xp_total'],
          include: [
            {
              model: Streak,
              as: 'streak',
              attributes: ['jours_consecutifs', 'record_personnel']
            }
          ]
        }
      ],
      order: [[{ model: Utilisateur, as: 'eleve' }, 'nom', 'ASC']]
    });

    // Formatter le résultat pour l'API (compat ancien système)
    return relations.map(rel => ({
      relation_id: rel.id,
      date_acceptation: rel.date_acceptation,
      notes_prof: rel.notes_prof,
      ...rel.eleve.toJSON()
    }));
  }

  /**
   * Récupère les détails complets d'un élève, y compris ses statistiques.
   * @param {number} eleveId - L'ID de l'élève.
   * @returns {Promise<Object>} - Un objet contenant les détails de l'élève et ses statistiques.
   */
  static async getEleveDetails(eleveId) {
    const eleve = await Utilisateur.findByPk(eleveId, {
      attributes: ['id', 'nom', 'prenom', 'email', 'avatar_url', 'niveau', 'xp_total', 'createdAt'],
      include: [
        {
          model: Streak,
          as: 'streak',
          attributes: ['jours_consecutifs', 'record_personnel', 'derniere_activite']
        },
        {
          model: BadgeUtilisateur,
          as: 'badgesObtenus',
          include: [{ model: Badge }],
          order: [['date_obtention', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!eleve) {
      return null;
    }

    // Calcul des statistiques avec le nouveau modèle de progression
    const [etapesValidees, etapesEnCours, figuresCommenceesResult] = await Promise.all([
        ProgressionEtape.count({ where: { utilisateur_id: eleveId, statut: 'valide' } }),
        ProgressionEtape.count({ where: { utilisateur_id: eleveId, statut: 'en_cours' } }),
        ProgressionEtape.findAll({
            where: { utilisateur_id: eleveId },
            attributes: [],
            include: [{
                model: EtapeProgression,
                as: 'etape',
                attributes: ['figure_id'],
                required: true
            }],
            group: ['etape.figure_id']
        })
    ]);
    
    const totalFiguresCommencees = figuresCommenceesResult.length;

    const statistiques = {
      etapes_validees: etapesValidees,
      etapes_en_cours: etapesEnCours,
      total_figures_commencees: totalFiguresCommencees,
    };

    return {
      eleve: eleve.toJSON(),
      statistiques
    };
  }
  
  /**
   * Met à jour les notes personnelles d'un professeur sur un élève.
   * @param {Object} relation - L'instance du modèle RelationProfEleve.
   * @param {string} notes - Les nouvelles notes.
   * @returns {Promise<Object>} - La relation mise à jour.
   */
  static async updateNotesForEleve(relation, notes) {
    relation.notes_prof = notes;
    await relation.save();
    return relation;
  }

  /**
   * Retire un élève de la liste d'un professeur en désactivant la relation
   * et en le retirant des groupes du professeur.
   * @param {number} eleveId - L'ID de l'élève.
   * @param {number} professeurId - L'ID du professeur.
   * @returns {Promise<void>}
   */
  static async removeEleveFromProf(eleveId, professeurId) {
    // On utilise une transaction pour assurer l'intégrité des données
    await sequelize.transaction(async (t) => {
      // 1. Désactiver la relation
      const relation = await RelationProfEleve.findOne({
        where: { professeur_id: professeurId, eleve_id: eleveId, statut: 'accepte' },
        transaction: t
      });

      if (!relation) {
        throw new Error('Relation non trouvée pour la suppression.');
      }
      
      relation.actif = false;
      await relation.save({ transaction: t });

      // 2. Retirer l'élève des groupes du professeur
      const groupes = await Groupe.findAll({
        where: { professeur_id: professeurId },
        attributes: ['id'],
        transaction: t
      });

      if (groupes.length > 0) {
        const groupeIds = groupes.map(g => g.id);
        await GroupeEleve.destroy({
          where: {
            groupe_id: { [Op.in]: groupeIds },
            eleve_id: eleveId
          },
          transaction: t
        });
      }
    });
  }
}

module.exports = ProfService;
