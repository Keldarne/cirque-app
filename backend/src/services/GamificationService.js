const {
  Utilisateur,
  Streak
} = require('../models');

class GamificationService {

  /**
   * Récupère le profil gamification simplifié d'un utilisateur.
   * @param {Object} user - L'utilisateur authentifié.
   * @returns {Promise<Object>} - Le profil gamification.
   */
  static async getGamificationProfile(user) {
    const userId = user.id;

    try {
      const streak = await Streak.findOne({ where: { utilisateur_id: userId } });

      const profilData = {
        niveau: user.niveau,
        xp_total: user.xp_total,
        streak: {
          jours_consecutifs: streak?.jours_consecutifs || 0,
          record_personnel: streak?.record_personnel || 0
        }
      };

      return profilData;

    } catch (error) {
      console.error('[Service] Erreur dans getGamificationProfile:', error);
      return null;
    }
  }

  /**
   * Récupère le statut du streak d'un utilisateur.
   * @param {number} utilisateurId - L'ID de l'utilisateur.
   * @returns {Promise<Object|null>} - Le streak de l'utilisateur.
   */
  static async getUserStreakStatus(utilisateurId) {
    try {
      const streak = await Streak.findOne({ where: { utilisateur_id: utilisateurId } });
      return streak || null;
    } catch (error) {
      console.error('[Service] Erreur dans getUserStreakStatus:', error);
      throw error;
    }
  }
}

module.exports = GamificationService;
