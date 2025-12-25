const {
  Badge,
  BadgeUtilisateur,
  Utilisateur,
  ProgressionEtape,
  Streak,
  Discipline,
  EtapeProgression,
  Figure
} = require('../models');
const { Op } = require('sequelize');

async function verifierBadges(utilisateurId, contexte = 'general') {
  try {
    const utilisateur = await Utilisateur.findByPk(utilisateurId);
    if (!utilisateur) {
      return [];
    }

    const tousBadges = await Badge.findAll();
    const badgesObtenus = await BadgeUtilisateur.findAll({
      where: { utilisateur_id: utilisateurId },
      attributes: ['badge_id']
    });
    const badgeIdsObtenus = new Set(badgesObtenus.map(b => b.badge_id));

    const nouveauxBadges = [];

    for (const badge of tousBadges) {
      if (badgeIdsObtenus.has(badge.id)) {
        continue;
      }

      const remplit = await verifierConditionBadge(badge, utilisateur);

      if (remplit) {
        const badgeUtilisateur = await BadgeUtilisateur.create({
          utilisateur_id: utilisateurId,
          badge_id: badge.id,
          date_obtention: new Date()
        });

        if (badge.xp_bonus > 0) {
          utilisateur.xp_total += badge.xp_bonus;
          await utilisateur.save();
        }

        nouveauxBadges.push({
          badge,
          xp_bonus: badge.xp_bonus
        });

        console.log(`🎖️ Badge "${badge.nom}" attribué à ${utilisateur.prenom} ${utilisateur.nom} (+${badge.xp_bonus} XP)`);
      }
    }

    return nouveauxBadges;
  } catch (error) {
    console.error('Erreur verifierBadges:', error);
    return [];
  }
}

async function verifierConditionBadge(badge, utilisateur) {
  try {
    switch (badge.condition_type) {
      case 'xp_total':
        return utilisateur.xp_total >= badge.condition_valeur;

      case 'premiere_fois': // Equivalent to 1 etape_validee
      case 'etapes_validees': // Remplacement de 'figures_validees'
        const etapesValidees = await ProgressionEtape.count({
          where: {
            utilisateur_id: utilisateur.id,
            statut: 'valide'
          }
        });
        return etapesValidees >= badge.condition_valeur;

      case 'streak_jours':
        const streak = await Streak.findOne({
          where: { utilisateur_id: utilisateur.id }
        });
        return streak && streak.jours_consecutifs >= badge.condition_valeur;

      // case 'perfectionniste':
      //   // TODO: Redéfinir la condition 'perfectionniste'.
      //   // L'ancien score_maitrise n'existe plus. Une nouvelle logique pourrait se baser
      //   // sur le nombre de tentatives avant réussite, par exemple.
      //   return false;

      case 'discipline_complete':
        return await verifierDisciplineComplete(utilisateur.id, badge.condition_valeur_optionnelle);

      case 'manuel':
        return false;

      default:
        console.warn(`Type de condition inconnu: ${badge.condition_type}`);
        return false;
    }
  } catch (error) {
    console.error(`Erreur vérification condition badge ${badge.nom}:`, error);
    return false;
  }
}

async function verifierDisciplineComplete(utilisateurId, disciplineId) {
  try {
    // 1. Compter toutes les étapes définies pour la discipline
    const totalEtapes = await EtapeProgression.count({
        include: [{
            model: Figure,
            required: true,
            where: { discipline_id: disciplineId }
        }]
    });

    if (totalEtapes === 0) return false; // La discipline n'a pas d'étapes

    // 2. Compter toutes les étapes validées par l'utilisateur pour cette discipline
    const etapesValidees = await ProgressionEtape.count({
        where: {
            utilisateur_id: utilisateurId,
            statut: 'valide'
        },
        include: [{
            model: EtapeProgression,
            as: 'etape',
            required: true,
            attributes: [],
            include: [{
                model: Figure,
                required: true,
                where: { discipline_id: disciplineId }
            }]
        }]
    });

    // 3. Vérifier si l'utilisateur a validé toutes les étapes
    return etapesValidees === totalEtapes;

  } catch (error) {
    console.error('Erreur verifierDisciplineComplete:', error);
    return false;
  }
}

async function attribuerBadgeManuellement(utilisateurId, badgeId) {
  try {
    const utilisateur = await Utilisateur.findByPk(utilisateurId);
    if (!utilisateur) {
      throw new Error('Utilisateur non trouvé');
    }

    const badge = await Badge.findByPk(badgeId);
    if (!badge) {
      throw new Error('Badge non trouvé');
    }

    const dejaObtenu = await BadgeUtilisateur.findOne({
      where: {
        utilisateur_id: utilisateurId,
        badge_id: badgeId
      }
    });

    if (dejaObtenu) {
      throw new Error('Badge déjà obtenu');
    }

    const badgeUtilisateur = await BadgeUtilisateur.create({
      utilisateur_id: utilisateurId,
      badge_id: badgeId,
      date_obtention: new Date()
    });

    if (badge.xp_bonus > 0) {
      utilisateur.xp_total += badge.xp_bonus;
      await utilisateur.save();
    }

    console.log(`🎖️ Badge "${badge.nom}" attribué manuellement à ${utilisateur.prenom} ${utilisateur.nom}`);

    return {
      badge,
      xp_bonus: badge.xp_bonus,
      badgeUtilisateur
    };
  } catch (error) {
    console.error('Erreur attribuerBadgeManuellement:', error);
    return null;
  }
}

async function verifierTitres(utilisateurId) {
  try {
    const { Titre, TitreUtilisateur } = require('../models');
    const utilisateur = await Utilisateur.findByPk(utilisateurId);

    if (!utilisateur) {
      return [];
    }

    const tousTitres = await Titre.findAll();

    const titresObtenus = await TitreUtilisateur.findAll({
      where: { utilisateur_id: utilisateurId },
      attributes: ['titre_id']
    });
    const titreIdsObtenus = new Set(titresObtenus.map(t => t.titre_id));

    const nouveauxTitres = [];

    for (const titre of tousTitres) {
      if (titreIdsObtenus.has(titre.id)) {
        continue;
      }

      let remplit = false;

      if (titre.condition_type === 'niveau') {
        remplit = utilisateur.niveau >= titre.condition_valeur;
      }

      if (remplit) {
        await TitreUtilisateur.create({
          utilisateur_id: utilisateurId,
          titre_id: titre.id,
          date_obtention: new Date(),
          equipe: false
        });

        nouveauxTitres.push(titre);
        console.log(`👑 Titre "${titre.nom}" débloqué pour ${utilisateur.prenom} ${utilisateur.nom}`);
      }
    }

    return nouveauxTitres;
  } catch (error) {
    console.error('Erreur verifierTitres:', error);
    return [];
  }
}

module.exports = {
  verifierBadges,
  verifierConditionBadge,
  attribuerBadgeManuellement,
  verifierTitres,
  verifierDisciplineComplete
};
