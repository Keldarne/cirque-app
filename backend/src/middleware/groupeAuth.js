const { Groupe, GroupeEleve } = require('../models');

/**
 * Middleware pour vérifier que l'utilisateur connecté a le droit d'accéder
 * aux informations d'un groupe (soit en tant que professeur du groupe,
 * soit en tant que membre).
 */
const verifierAccesGroupe = async (req, res, next) => {
  try {
    const { id: groupeId } = req.params;
    const { id: utilisateurId } = req.user;

    const groupe = await Groupe.findByPk(groupeId);

    if (!groupe) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    const estProfesseur = groupe.professeur_id === utilisateurId;
    
    let estMembre = false;
    if (!estProfesseur) {
        estMembre = await GroupeEleve.findOne({
            where: {
                groupe_id: groupeId,
                eleve_id: utilisateurId
            }
        });
    }

    if (!estProfesseur && !estMembre) {
      return res.status(403).json({ error: 'Accès non autorisé à ce groupe.' });
    }
    
    // Attacher le groupe à la requête pour éviter une seconde recherche
    req.groupe = groupe;
    next();

  } catch (error) {
    console.error('Erreur dans le middleware verifierAccesGroupe:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la vérification des permissions de groupe.' });
  }
};

module.exports = {
  verifierAccesGroupe
};
