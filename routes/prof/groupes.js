const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin, authorize } = require('../../middleware/auth');
const {
  RelationProfEleve,
  Utilisateur,
  Groupe,
  GroupeEleve,
  Streak
} = require('../../models');
const { Op } = require('sequelize');
const GroupeProgrammeService = require('../../services/GroupeProgrammeService');

router.post('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { nom, description, couleur } = req.body;

    if (!nom) {
      return res.status(400).json({ error: 'Le nom du groupe est requis' });
    }

    const groupe = await Groupe.create({
      professeur_id: req.user.id,
      nom,
      description: description || null,
      couleur: couleur || '#1976d2',
      actif: true
    });

    res.status(201).json({
      message: 'Groupe créé avec succès',
      groupe
    });
  } catch (error) {
    console.error('Erreur POST /api/prof/groupes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/prof/groupes
 * Lister tous les groupes du professeur
 */
router.get('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const groupes = await Groupe.findAll({
      where: {
        professeur_id: req.user.id,
        actif: true
      },
      include: [
        {
          model: GroupeEleve,
          as: 'membres',
          include: [
            {
              model: Utilisateur,
              as: 'eleve',
              attributes: ['id', 'nom', 'prenom', 'email', 'avatar_url', 'niveau', 'xp_total']
            }
          ]
        }
      ],
      order: [['nom', 'ASC']]
    });

    const groupesAvecStats = groupes.map(groupe => ({
      ...groupe.toJSON(),
      nombre_eleves: groupe.membres.length
    }));

    res.json({ groupes: groupesAvecStats });
  } catch (error) {
    console.error('Erreur GET /api/prof/groupes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/prof/groupes/:id
 * Détails d'un groupe
 */
router.get('/:id', verifierToken, estProfesseurOuAdmin, authorize(Groupe, 'professeur_id'), async (req, res) => {
  try {
    // The authorize middleware has already fetched the group and attached it to req.resource
    const groupe = req.resource;

    // Re-fetch the group with all necessary includes for the response
    const groupeWithIncludes = await Groupe.findByPk(groupe.id, {
      include: [
        {
          model: GroupeEleve,
          as: 'membres',
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
          ]
        }
      ]
    });

    res.json({ groupe: groupeWithIncludes });
  } catch (error) {
    console.error('Erreur GET /api/prof/groupes/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * PUT /api/prof/groupes/:id
 * Modifier un groupe
 */
router.put('/:id', verifierToken, estProfesseurOuAdmin, authorize(Groupe, 'professeur_id'), async (req, res) => {
  try {
    const { nom, description, couleur } = req.body;
    const groupe = req.resource; // Groupe instance attaché par le middleware authorize

    if (nom) groupe.nom = nom;
    if (description !== undefined) groupe.description = description;
    if (couleur) groupe.couleur = couleur;

    await groupe.save();

    res.json({
      message: 'Groupe modifié avec succès',
      groupe
    });
  } catch (error) {
    console.error('Erreur PUT /api/prof/groupes/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * DELETE /api/prof/groupes/:id
 * Supprimer un groupe
 */
router.delete('/:id', verifierToken, estProfesseurOuAdmin, authorize(Groupe, 'professeur_id'), async (req, res) => {
  try {
    const groupe = req.resource; // Groupe instance attaché par le middleware authorize

    // Supprimer tous les membres
    await GroupeEleve.destroy({
      where: { groupe_id: groupe.id }
    });

    // Marquer comme inactif
    groupe.actif = false;
    await groupe.save();

    res.json({ message: 'Groupe supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /api/prof/groupes/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * POST /api/prof/groupes/:id/membres
 * Ajouter un élève à un groupe + propagation automatique des programmes
 */
router.post('/:id/membres', verifierToken, estProfesseurOuAdmin, authorize(Groupe, 'professeur_id', { actif: true }), async (req, res) => {
  try {
    const { eleve_id } = req.body;
    const groupe = req.resource; // Groupe instance attaché par le middleware authorize

    if (!eleve_id) {
      return res.status(400).json({ error: 'ID de l\'élève requis' });
    }

    // Vérifier que l'élève existe et appartient à la même école (si prof a une école)
    const professeur = await Utilisateur.findByPk(req.user.id, {
      attributes: ['id', 'ecole_id']
    });

    const eleve = await Utilisateur.findByPk(eleve_id, {
      attributes: ['id', 'ecole_id', 'role']
    });

    if (!eleve) {
      return res.status(404).json({ error: 'Élève introuvable' });
    }

    // Vérification école-based (si prof a une école)
    if (professeur.ecole_id) {
      if (eleve.ecole_id !== professeur.ecole_id) {
        return res.status(403).json({ error: 'Cet élève n\'appartient pas à votre école' });
      }
    } else {
      // Fallback pour profs solo : vérifier RelationProfEleve
      const relation = await RelationProfEleve.findOne({
        where: {
          professeur_id: req.user.id,
          eleve_id,
          statut: 'accepte',
          actif: true
        }
      });

      if (!relation) {
        return res.status(403).json({ error: 'Cet élève ne fait pas partie de vos élèves' });
      }
    }

    // Vérifier si déjà membre
    const membreExistant = await GroupeEleve.findOne({
      where: {
        groupe_id: groupe.id,
        eleve_id
      }
    });

    if (membreExistant) {
      return res.status(400).json({ error: 'Cet élève est déjà membre du groupe' });
    }

    // Ajouter au groupe
    await GroupeEleve.create({
      groupe_id: groupe.id,
      eleve_id
    });

    // Propager automatiquement les programmes du groupe au nouvel élève
    try {
      const propagation = await GroupeProgrammeService.propagerProgrammesAuNouveauMembre(groupe.id, eleve_id);

      res.status(201).json({
        message: 'Élève ajouté au groupe avec succès',
        propagation: {
          programmes_assignes: propagation.assignedCount,
          programmes_deja_assignes: propagation.skippedCount
        }
      });
    } catch (propagationError) {
      console.error('Erreur propagation programmes:', propagationError);
      // Continuer même si la propagation échoue
      res.status(201).json({
        message: 'Élève ajouté au groupe avec succès',
        warning: 'Certains programmes n\'ont pas pu être propagés'
      });
    }
  } catch (error) {
    console.error('Erreur POST /api/prof/groupes/:id/membres:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * DELETE /api/prof/groupes/:id/membres/:eleveId
 * Retirer un élève d'un groupe
 */
router.delete('/:id/membres/:eleveId', verifierToken, estProfesseurOuAdmin, authorize(Groupe, 'professeur_id'), async (req, res) => {
  try {
    const { eleveId } = req.params;
    const groupe = req.resource; // Groupe instance attaché par le middleware authorize

    // Supprimer le membre
    const supprime = await GroupeEleve.destroy({
      where: {
        groupe_id: groupe.id,
        eleve_id: eleveId
      }
    });

    if (!supprime) {
      return res.status(404).json({ error: 'Membre non trouvé dans ce groupe' });
    }

    res.json({ message: 'Élève retiré du groupe avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /api/prof/groupes/:id/membres/:eleveId:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});


module.exports = router;
