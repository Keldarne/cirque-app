const { RelationProfEleve } = require('../models');

/**
 * Middleware pour vérifier qu'une relation active et acceptée
 * existe entre le professeur connecté et l'élève ciblé.
 */
const verifierRelationProfEleve = async (req, res, next) => {
  try {
    const { id: eleveId } = req.params;
    const professeurId = req.user.id;

    if (!eleveId || !professeurId) {
      return res.status(400).json({ error: 'IDs de professeur ou d\'élève manquants.' });
    }

    const relation = await RelationProfEleve.findOne({
      where: {
        professeur_id: professeurId,
        eleve_id: eleveId,
        statut: 'accepte',
        actif: true
      }
    });

    if (!relation) {
      // 403 est plus sémantique: l'utilisateur est authentifié mais n'a pas les droits
      // sur cette ressource spécifique.
      return res.status(403).json({ error: 'Accès non autorisé à cet élève.' });
    }

    // Attacher la relation à l'objet req pour la réutiliser dans la route
    req.relation = relation;
    next();
  } catch (error) {
    console.error('Erreur dans le middleware verifierRelationProfEleve:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification des permissions.' });
  }
};

module.exports = {
  verifierRelationProfEleve
};