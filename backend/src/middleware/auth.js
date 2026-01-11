const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/Utilisateur');
const { localStorage } = require('../utils/requestContext'); // Import localStorage

// Forcer l'utilisation d'une variable d'environnement JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error('ERREUR FATALE: JWT_SECRET doit être défini dans les variables d\'environnement');
}
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware pour vérifier le token JWT et attacher l'utilisateur à req.user
 * Intègre AsyncLocalStorage pour propager le contexte utilisateur.
 */
const verifierToken = async (req, res, next) => {
  const store = new Map();
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Use unscoped() to bypass beforeFind hook during authentication
    // The beforeFind hook applies multi-tenant filtering which could interfere with auth
    const user = await Utilisateur.unscoped().findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    req.user = user;
    store.set('user', user); // Store user in AsyncLocalStorage
    localStorage.run(store, () => next());
  } catch (_error) {
    console.error('Erreur vérification token:', _error);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est un professeur ou admin
 */
const estProfesseurOuAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (req.user.role !== 'professeur' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé - Réservé aux professeurs et admins' });
  }
  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est admin ('masteradmin')
 */
const estAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé - Réservé aux admins' });
  }
  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est soit admin, soit school_admin
 */
const estAdminOuSchoolAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'school_admin') {
    return res.status(403).json({ error: 'Accès refusé - Réservé aux administrateurs' });
  }
  next();
};

/**
 * Middleware pour vérifier que l'utilisateur a un rôle avec privilèges (prof, school_admin, admin)
 */
const estPersonnelAutorise = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const rolesAutorises = ['professeur', 'school_admin', 'admin'];
  if (!rolesAutorises.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Accès refusé - Réservé aux professeurs et admins'
    });
  }
  next();
};


/**
 * Middleware pour vérifier que l'utilisateur peut modifier/supprimer une figure
 */
const peutModifierFigure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Figure = require('../models/Figure');
    const figure = await Figure.findByPk(id);

    if (!figure) {
      return res.status(404).json({ error: 'Figure non trouvée' });
    }

    const user = req.user;
    let hasPermission = false;

    switch (user.role) {
      case 'admin':
        // Le masteradmin peut tout modifier
        hasPermission = true;
        break;
      
      case 'school_admin':
        // Le school_admin peut modifier UNIQUEMENT les figures de son école
        // Le catalogue public est en lecture seule
        if (figure.ecole_id && figure.ecole_id === user.ecole_id) {
          hasPermission = true;
        }
        break;
      
      case 'professeur':
        // Le professeur peut modifier UNIQUEMENT les figures de son école qu'il a créées
        if (figure.createur_id === user.id && figure.ecole_id && figure.ecole_id === user.ecole_id) {
          hasPermission = true;
        }
        break;
    }

    if (hasPermission) {
      req.figure = figure; // Attacher la figure à la requête pour la suite
      return next();
    }

    return res.status(403).json({ error: 'Accès refusé. Vous n\'avez pas les permissions pour modifier cette figure.' });

  } catch (error) {
    console.error('Erreur dans peutModifierFigure:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la vérification des permissions.' });
  }
};

/**
 * Middleware générique pour autoriser l'accès à une ressource en fonction de la propriété ou du rôle.
 * @param {Model} model - Le modèle Sequelize de la ressource à vérifier.
 * @param {string} fk_user_id - La clé étrangère dans le modèle qui référence l'ID de l'utilisateur (par défaut 'utilisateur_id').
 * @returns {Function} - Un middleware Express.
 */
const authorize = (model, fk_user_id = 'utilisateur_id', additionalWhere = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      // Si l'utilisateur est admin, autoriser immédiatement
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params.id; // Supposons que l'ID de la ressource est dans req.params.id
      if (!resourceId) {
        return res.status(400).json({ error: 'ID de ressource manquant dans les paramètres' });
      }

      const whereClause = { id: resourceId, ...additionalWhere }; // Appliquer des conditions additionnelles
      const resource = await model.findOne({ where: whereClause }); // Utiliser findOne avec where

      if (!resource) {
        return res.status(404).json({ error: 'Ressource non trouvée' });
      }

      // Vérifier la propriété directe
      if (resource[fk_user_id] === req.user.id) {
        req.resource = resource; // Attacher la ressource à la requête pour un usage ultérieur
        return next();
      }


      // Cas spécifique pour les profs et leurs élèves
      if (req.user.role === 'professeur' && model.name === 'ProgressionEtape') {
        const RelationProfEleve = require('../models/RelationProfEleve');

        // Trouver la progression étape pour l'élève en question
        const eleveUtilisateurId = resource.utilisateur_id;

        // Vérifier si le professeur est lié à cet élève
        const relation = await RelationProfEleve.findOne({
            where: {
                professeur_id: req.user.id,
                eleve_id: eleveUtilisateurId,
                statut: 'accepte'
            }
        });

        if (relation) {
            req.resource = resource;
            return next();
        }
      }

      return res.status(403).json({ error: 'Accès refusé - Vous n\'êtes pas autorisé à accéder à cette ressource.' });

    } catch (error) {
      console.error(`Erreur dans le middleware d'autorisation pour le modèle ${model ? model.name : 'inconnu'}:`, error);
      return res.status(500).json({ error: 'Erreur serveur lors de la vérification des autorisations.' });
    }
  };
};

module.exports = {
  verifierToken,
  estProfesseurOuAdmin,
  estAdmin,
  estAdminOuSchoolAdmin,
  estPersonnelAutorise,
  peutModifierFigure,
  authorize // Added the new authorize middleware
};
