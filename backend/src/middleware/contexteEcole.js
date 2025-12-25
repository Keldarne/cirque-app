/**
 * Middleware de Contexte École (Multi-Tenant)
 *
 * Injecte le contexte école dans req.user après authentification JWT.
 * Ce middleware DOIT être appelé APRÈS verifierToken.
 *
 * Responsabilités :
 * - Charger l'école associée à l'utilisateur connecté
 * - Vérifier que l'école est active
 * - Définir req.user.ecoleId et req.user.isGlobalAdmin
 * - Bloquer l'accès si l'école est suspendue/désactivée
 *
 * Utilisation dans les routes :
 * router.get('/route', verifierToken, injecterContexteEcole, async (req, res) => {
 *   // req.user.ecoleId est maintenant disponible
 *   const where = filtrerParEcole({}, req);
 * });
 */

const { Utilisateur, Ecole } = require('../models');

/**
 * Middleware : Injecter le contexte école
 * Ajoute ecoleId et isGlobalAdmin à req.user
 */
const injecterContexteEcole = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié (verifierToken doit être appelé avant)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Charger l'utilisateur avec son école
    const user = await Utilisateur.findByPk(req.user.id, {
      include: [{
        model: Ecole,
        as: 'Ecole',
        required: false  // LEFT JOIN (école peut être NULL pour solo users)
      }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Déterminer le type d'utilisateur
    if (!user.ecole_id) {
      // Solo user, admin global, ou compte sans école
      req.user.ecoleId = null;
      req.user.isGlobalAdmin = user.role === 'admin';
      req.user.isSoloUser = user.role !== 'admin';

      // Solo users peuvent utiliser l'app sans école
      return next();
    }

    // Utilisateur appartient à une école
    req.user.ecoleId = user.ecole_id;
    req.user.isGlobalAdmin = false;
    req.user.isSoloUser = false;

    // Vérifier que l'école existe
    if (!user.Ecole) {
      return res.status(500).json({
        error: 'École associée introuvable. Contactez le support.'
      });
    }

    // Vérifier le statut de l'école
    if (!user.Ecole.actif) {
      return res.status(403).json({
        error: 'Votre école a été désactivée. Contactez le support.',
        raison: user.Ecole.raison_suspension || 'Non spécifiée'
      });
    }

    // Vérifier si le compte est suspendu pour impayé
    if (user.Ecole.statut_abonnement === 'suspendu') {
      return res.status(403).json({
        error: 'Votre abonnement est suspendu. Veuillez régulariser votre paiement.',
        statut: 'suspendu'
      });
    }

    // Vérifier si le compte est annulé
    if (user.Ecole.statut_abonnement === 'annule') {
      return res.status(403).json({
        error: 'Votre abonnement a été annulé. Contactez le support pour réactiver.',
        statut: 'annule'
      });
    }

    // Avertir si le trial expire bientôt
    if (user.Ecole.statut_abonnement === 'trial') {
      const joursRestants = user.Ecole.joursRestantsTrial();
      req.user.trialInfo = {
        joursRestants,
        dateFin: user.Ecole.date_fin_trial,
        expire: joursRestants === 0
      };

      // Bloquer si le trial est expiré
      if (joursRestants === 0) {
        return res.status(403).json({
          error: 'Votre période d\'essai a expiré. Veuillez souscrire à un abonnement.',
          statut: 'trial_expire',
          dateFin: user.Ecole.date_fin_trial
        });
      }
    }

    // Ajouter infos école au contexte (optionnel, pour affichage)
    req.user.ecole = {
      id: user.Ecole.id,
      nom: user.Ecole.nom,
      plan: user.Ecole.plan,
      statut: user.Ecole.statut_abonnement
    };

    next();
  } catch (err) {
    console.error('Erreur injecterContexteEcole:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification du contexte' });
  }
};

/**
 * Helper : Filtrer les requêtes par école
 * Ajoute automatiquement ecole_id dans les WHERE clauses
 *
 * @param {Object} where - Objet WHERE Sequelize
 * @param {Request} req - Requête Express (contient req.user)
 * @param {boolean} includePublic - Inclure les éléments publics (ecole_id = NULL)
 * @returns {Object} - WHERE clause modifiée
 *
 * Exemples :
 * // Filtrer figures par école (inclure catalogue public)
 * const where = filtrerParEcole({}, req, true);
 * // => { [Op.or]: [{ ecole_id: 1 }, { ecole_id: null }] }
 *
 * // Filtrer progressions par école (exclure public)
 * const where = filtrerParEcole({}, req, false);
 * // => { ecole_id: 1 }
 */
const filtrerParEcole = (where = {}, req, includePublic = false) => {
  const { Op } = require('sequelize');

  // Admin global voit tout (pas de filtre)
  if (req.user && req.user.isGlobalAdmin) {
    return where;
  }

  // Solo user ou utilisateur sans école
  if (!req.user || !req.user.ecoleId) {
    // Solo users ne voient que leurs propres données (ecole_id = NULL)
    // OU les données publiques si includePublic = true
    if (includePublic) {
      where.ecole_id = null;  // Seulement éléments publics
    } else {
      where.ecole_id = null;  // Pas d'école
    }
    return where;
  }

  // Utilisateur d'une école
  if (includePublic) {
    // Inclure éléments publics (ecole_id = NULL) ET éléments de l'école
    where[Op.or] = [
      { ecole_id: req.user.ecoleId },
      { ecole_id: null }
    ];
  } else {
    // Seulement les éléments de cette école
    where.ecole_id = req.user.ecoleId;
  }

  return where;
};

/**
 * Helper : Vérifier les limites de l'école
 * Utilisé avant d'ajouter de nouveaux élèves ou professeurs
 *
 * @param {Request} req - Requête Express
 * @param {string} type - 'eleves' ou 'professeurs'
 * @returns {Promise<boolean>} - true si limite atteinte
 */
const verifierLimitesEcole = async (req, type) => {
  // Admin global pas de limite
  if (req.user && req.user.isGlobalAdmin) {
    return false;
  }

  // Solo user pas de limite (sauf 1 user)
  if (req.user && req.user.isSoloUser) {
    return false;
  }

  // Vérifier pour école
  if (!req.user || !req.user.ecoleId) {
    return false;
  }

  const ecole = await Ecole.findByPk(req.user.ecoleId);
  if (!ecole) return false;

  return await ecole.limiteAtteinte(type);
};

/**
 * Middleware : Vérifier que l'utilisateur peut ajouter des élèves
 * Bloque si la limite d'élèves de l'école est atteinte
 */
const verifierLimiteEleves = async (req, res, next) => {
  try {
    const limiteAtteinte = await verifierLimitesEcole(req, 'eleves');

    if (limiteAtteinte) {
      const ecole = await Ecole.findByPk(req.user.ecoleId);
      return res.status(403).json({
        error: 'Limite d\'élèves atteinte pour votre plan',
        limite: ecole.max_eleves,
        plan: ecole.plan,
        message: 'Veuillez upgrader votre plan ou supprimer des élèves.'
      });
    }

    next();
  } catch (err) {
    console.error('Erreur verifierLimiteEleves:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Middleware : Vérifier que l'utilisateur peut ajouter des professeurs
 * Bloque si la limite de professeurs de l'école est atteinte
 */
const verifierLimiteProfesseurs = async (req, res, next) => {
  try {
    const limiteAtteinte = await verifierLimitesEcole(req, 'professeurs');

    if (limiteAtteinte) {
      const ecole = await Ecole.findByPk(req.user.ecoleId);
      return res.status(403).json({
        error: 'Limite de professeurs atteinte pour votre plan',
        limite: ecole.max_professeurs,
        plan: ecole.plan,
        message: 'Veuillez upgrader votre plan pour ajouter plus de professeurs.'
      });
    }

    next();
  } catch (err) {
    console.error('Erreur verifierLimiteProfesseurs:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  injecterContexteEcole,
  filtrerParEcole,
  verifierLimitesEcole,
  verifierLimiteEleves,
  verifierLimiteProfesseurs
};
