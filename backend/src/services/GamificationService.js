const {
  Badge,
  BadgeUtilisateur,
  Utilisateur,
  Titre,
  TitreUtilisateur,
  DefiUtilisateur,
  Streak,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

class GamificationService {

  // ... (méthodes existantes)
  static async getAllBadges(_utilisateurId, _filters = {}) { /* ... */ }
  static async getObtainedBadges(_utilisateurId) { /* ... */ }
  static async setBadgeDisplay(_utilisateurId, _badgeId, _affiche) { /* ... */ }
  static async getGlobalLeaderboard(currentUser, _limit = 100, _offset = 0) { /* ... */ }
  static async getWeeklyLeaderboard(_limit = 50) { /* ... */ }
  static async getGroupLeaderboard(_groupeId) { /* ... */ }
  static async getActiveChallenges(_utilisateurId) { /* ... */ }
  static async getUserChallengeHistory(_utilisateurId, _statut) { /* ... */ }
  static async getUserChallengeStats(_utilisateurId) { /* ... */ }
  static async getUserStreakStatus(_utilisateurId) { /* ... */ }
    static async getGamificationProfile(user) {
    const userId = user.id;

    try {
      const [
        nombreBadges,
        badgeAffiche,
        nombreTitres,
        titreEquipe,
        streak,
        defisCompletes,
        classementGlobal
      ] = await Promise.all([
        BadgeUtilisateur.count({ where: { utilisateur_id: userId } }),
        BadgeUtilisateur.findOne({
          where: { utilisateur_id: userId, affiche: true },
          include: [{ model: Badge }]
        }),
        TitreUtilisateur.count({ where: { utilisateur_id: userId } }),
        TitreUtilisateur.findOne({
          where: { utilisateur_id: userId, equipe: true },
          include: [{ model: Titre }]
        }),
        Streak.findOne({ where: { utilisateur_id: userId } }),
        DefiUtilisateur.count({ where: { utilisateur_id: userId, complete: true } }),
        Utilisateur.count({ where: { role: 'eleve', xp_total: { [Op.gt]: user.xp_total } } })
      ]);

      const profilData = {
        niveau: user.niveau,
        xp_total: user.xp_total,
        badges: {
          total: nombreBadges,
          affiche: badgeAffiche ? {
            id: badgeAffiche.Badge.id,
            nom: badgeAffiche.Badge.nom,
            icone: badgeAffiche.Badge.icone,
            rarete: badgeAffiche.Badge.rarete
          } : null
        },
        titres: {
          total: nombreTitres,
          equipe: titreEquipe ? {
            id: titreEquipe.Titre.id,
            nom: titreEquipe.Titre.nom,
            couleur: titreEquipe.Titre.couleur
          } : null
        },
        streak: {
          jours_consecutifs: streak?.jours_consecutifs || 0,
          record_personnel: streak?.record_personnel || 0
        },
        defis_completes: defisCompletes,
        classement_global: classementGlobal + 1
      };
      
      return profilData;

    } catch (error) {
      console.error('[Service] Erreur dans getGamificationProfile:', error);
      return null;
    }
  }

  /**
   * Récupère tous les titres et leur statut d'obtention pour un utilisateur.
   * @param {number} utilisateurId - L'ID de l'utilisateur.
   * @returns {Promise<Array>}
   */
  static async getAllTitles(utilisateurId) {
    const titres = await Titre.findAll({ order: [['condition_valeur', 'ASC']] });
    const titresUtilisateur = await TitreUtilisateur.findAll({
      where: { utilisateur_id: utilisateurId },
      attributes: ['titre_id', 'date_obtention', 'equipe']
    });

    const titresMap = new Map(titresUtilisateur.map(tu => [tu.titre_id, { date_obtention: tu.date_obtention, equipe: tu.equipe }]));

    return titres.map(titre => ({
      ...titre.toJSON(),
      obtenu: titresMap.has(titre.id),
      date_obtention: titresMap.get(titre.id)?.date_obtention || null,
      equipe: titresMap.get(titre.id)?.equipe || false
    }));
  }

  /**
   * Récupère les titres obtenus par un utilisateur.
   * @param {number} utilisateurId - L'ID de l'utilisateur.
   * @returns {Promise<Array>}
   */
  static async getObtainedTitles(utilisateurId) {
    const titresObtenus = await TitreUtilisateur.findAll({
      where: { utilisateur_id: utilisateurId },
      include: [{ model: Titre }],
      order: [[{ model: Titre }, 'condition_valeur', 'DESC']]
    });

    return titresObtenus.map(tu => ({
      ...tu.Titre.toJSON(),
      date_obtention: tu.date_obtention,
      equipe: tu.equipe,
      titre_utilisateur_id: tu.id
    }));
  }

  /**
   * Équipe un titre pour un utilisateur, et déséquipe les autres.
   * @param {number} utilisateurId - L'ID de l'utilisateur.
   * @param {number} titreId - L'ID du titre à équiper.
   * @returns {Promise<Object>} - Le titre utilisateur équipé.
   */
  static async equipTitle(utilisateurId, titreId) {
    const titreUtilisateur = await TitreUtilisateur.findOne({
      where: { titre_id: titreId, utilisateur_id: utilisateurId },
      include: [{ model: Titre }]
    });

    if (!titreUtilisateur) {
      const error = new Error('Titre non obtenu par l\'utilisateur.');
      error.statusCode = 404;
      throw error;
    }

    await sequelize.transaction(async (t) => {
      await TitreUtilisateur.update(
        { equipe: false },
        { where: { utilisateur_id: utilisateurId }, transaction: t }
      );
      titreUtilisateur.equipe = true;
      await titreUtilisateur.save({ transaction: t });
    });

    return titreUtilisateur;
  }

  /**
   * Déséquipe tous les titres d'un utilisateur.
   * @param {number} utilisateurId - L'ID de l'utilisateur.
   * @returns {Promise<[number]>} - Le résultat de l'opération update.
   */
  static async unequipAllTitles(utilisateurId) {
    return TitreUtilisateur.update(
      { equipe: false },
      { where: { utilisateur_id: utilisateurId } }
    );
  }
}

module.exports = GamificationService;
