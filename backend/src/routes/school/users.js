const express = require('express');
const router = express.Router();
const { Utilisateur, Ecole } = require('../../models');
const { verifierToken, estAdmin } = require('../../middleware/auth');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

/**
 * GET /api/school/users
 * Liste tous les utilisateurs de l'école du demandeur
 * Permissions: Admin global OU School Admin/Prof de l'école
 */
router.get('/', verifierToken, async (req, res) => {
  try {
    const { role, ecole_id } = req.user;

    // Admin global voit tous les utilisateurs (optionnel selon besoins)
    let whereClause = {};

    if (role === 'admin') {
      // Admin peut filtrer par école via query param
      const { ecole_id: filterEcoleId } = req.query;
      if (filterEcoleId) {
        whereClause.ecole_id = filterEcoleId;
      }
    } else if (ecole_id) {
      // Prof/School Admin voit uniquement son école
      whereClause.ecole_id = ecole_id;
    } else {
      return res.status(403).json({
        error: 'Vous devez être affilié à une école pour voir les utilisateurs'
      });
    }

    const utilisateurs = await Utilisateur.findAll({
      where: whereClause,
      attributes: ['id', 'pseudo', 'prenom', 'nom', 'email', 'role', 'ecole_id', 'niveau', 'xp_total', 'actif', 'createdAt'],
      include: [{
        model: Ecole,
        as: 'Ecole',
        attributes: ['id', 'nom']
      }],
      order: [['role', 'ASC'], ['nom', 'ASC'], ['prenom', 'ASC']]
    });

    res.json(utilisateurs);
  } catch (error) {
    console.error('Erreur liste utilisateurs école:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des utilisateurs' });
  }
});

/**
 * POST /api/school/users
 * Créer un nouvel utilisateur dans l'école
 * Permissions: Admin global OU School Admin/Prof de l'école
 */
router.post('/', verifierToken, async (req, res) => {
  try {
    const { prenom, nom, role, password } = req.body;
    let { email } = req.body;
    const { role: userRole, ecole_id: userEcoleId } = req.user;

    // Normaliser l'email (vide ou espaces -> null)
    if (typeof email === 'string' && email.trim() === '') {
      email = null;
    } else if (typeof email === 'string') {
      email = email.trim();
    }

    // Validations
    if (!prenom || !nom || !role) {
      return res.status(400).json({
        error: 'Prénom, nom et rôle sont requis'
      });
    }

    if (!['eleve', 'professeur'].includes(role)) {
      return res.status(400).json({
        error: 'Le rôle doit être "eleve" ou "professeur"'
      });
    }

    // Validation format email strict (si fourni)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Format d\'email invalide'
        });
      }

      // Vérifier unicité email
      const existingEmail = await Utilisateur.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    // Déterminer ecole_id (sécurité: forcer celle du créateur sauf admin)
    let ecole_id;
    if (userRole === 'admin') {
      // Admin peut spécifier l'école ou laisser null (solo)
      ecole_id = req.body.ecole_id || null;
    } else if (userEcoleId) {
      // Prof/School Admin: forcer leur école
      ecole_id = userEcoleId;
    } else {
      return res.status(403).json({
        error: 'Vous devez être affilié à une école pour créer des utilisateurs'
      });
    }

    // Vérifier limite école si applicable
    if (ecole_id) {
      const ecole = await Ecole.findByPk(ecole_id);
      if (!ecole) {
        return res.status(404).json({ error: 'École non trouvée' });
      }

      const countEleves = await Utilisateur.count({
        where: { ecole_id, role: 'eleve' }
      });

      if (role === 'eleve' && countEleves >= ecole.max_eleves) {
        return res.status(403).json({
          error: `Limite d'élèves atteinte pour cette école (${ecole.max_eleves} max)`
        });
      }
    }

    // Générer pseudo si non fourni
    let pseudo = req.body.pseudo;
    if (!pseudo) {
      const basePrefix = ecole_id
        ? (await Ecole.findByPk(ecole_id)).nom.substring(0, 3).toLowerCase()
        : 'user';
      const basePseudo = `${basePrefix}-${prenom.toLowerCase()}.${nom.toLowerCase()}`;

      // Vérifier unicité
      let counter = 0;
      pseudo = basePseudo;
      while (await Utilisateur.findOne({ where: { pseudo } })) {
        counter++;
        pseudo = `${basePseudo}${counter}`;
      }
    }

    // Générer mot de passe par défaut si non fourni
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Mot de passe par défaut: NomÉcole + Année actuelle + !
      const defaultPassword = ecole_id
        ? `${(await Ecole.findByPk(ecole_id)).nom}${new Date().getFullYear()}!`
        : `Cirque${new Date().getFullYear()}!`;
      hashedPassword = await bcrypt.hash(defaultPassword, 10);
    }

    // Créer utilisateur
    const newUser = await Utilisateur.create({
      pseudo,
      prenom,
      nom,
      email,
      mot_de_passe: hashedPassword,
      role,
      ecole_id,
      niveau: 1,
      xp_total: 0,
      actif: true
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      utilisateur: {
        id: newUser.id,
        pseudo: newUser.pseudo,
        prenom: newUser.prenom,
        nom: newUser.nom,
        email: newUser.email,
        role: newUser.role,
        ecole_id: newUser.ecole_id
      },
      defaultPassword: password ? undefined : `${(ecole_id ? (await Ecole.findByPk(ecole_id)).nom : 'Cirque')}${new Date().getFullYear()}!`
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
});

/**
 * PUT /api/school/users/:id
 * Modifier un utilisateur
 * Permissions: Admin global OU School Admin/Prof de la même école
 */
router.put('/:id', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { prenom, nom, role } = req.body;
    let { email } = req.body;
    const { role: userRole, ecole_id: userEcoleId } = req.user;

    // Normaliser l'email (vide ou espaces -> null)
    if (typeof email === 'string' && email.trim() === '') {
      email = null;
    } else if (typeof email === 'string') {
      email = email.trim();
    }

    const utilisateur = await Utilisateur.findByPk(id);
    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier permissions: même école ou admin
    if (userRole !== 'admin' && utilisateur.ecole_id !== userEcoleId) {
      return res.status(403).json({
        error: 'Vous ne pouvez modifier que les utilisateurs de votre école'
      });
    }

    // Empêcher modification admin global (sauf par admin global)
    if (utilisateur.role === 'admin' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Seul un admin peut modifier un administrateur'
      });
    }

    // Empêcher modification school_admin par un professeur
    if (utilisateur.role === 'school_admin' && userRole === 'professeur') {
      return res.status(403).json({
        error: 'Un professeur ne peut pas modifier un administrateur d\'école'
      });
    }

    // Empêcher modification role vers admin ou school_admin (sécurité)
    if ((role === 'admin' || role === 'school_admin') && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Seul un admin peut créer des administrateurs'
      });
    }

    // Vérifier unicité email si changé
    if (email && email !== utilisateur.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Format d\'email invalide'
        });
      }

      const existingEmail = await Utilisateur.findOne({
        where: { email, id: { [Op.ne]: id } }
      });
      if (existingEmail) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    // Mettre à jour
    await utilisateur.update({
      prenom: prenom || utilisateur.prenom,
      nom: nom || utilisateur.nom,
      email: email || utilisateur.email,
      role: role || utilisateur.role
    });

    res.json({
      message: 'Utilisateur modifié avec succès',
      utilisateur: {
        id: utilisateur.id,
        pseudo: utilisateur.pseudo,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role
      }
    });

  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la modification' });
  }
});

/**
 * DELETE /api/school/users/:id
 * Supprimer un utilisateur
 * Permissions: Admin global OU School Admin/Prof de la même école
 */
router.delete('/:id', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role: userRole, ecole_id: userEcoleId, id: userId } = req.user;

    const utilisateur = await Utilisateur.findByPk(id);
    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher auto-suppression
    if (parseInt(id) === userId) {
      return res.status(403).json({
        error: 'Vous ne pouvez pas vous supprimer vous-même'
      });
    }

    // Vérifier permissions: même école ou admin
    if (userRole !== 'admin' && utilisateur.ecole_id !== userEcoleId) {
      return res.status(403).json({
        error: 'Vous ne pouvez supprimer que les utilisateurs de votre école'
      });
    }

    // Empêcher suppression admin global (sauf par admin global)
    if (utilisateur.role === 'admin' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Seul un admin peut supprimer un administrateur'
      });
    }

    // Empêcher suppression school_admin par un professeur
    if (utilisateur.role === 'school_admin' && userRole === 'professeur') {
      return res.status(403).json({
        error: 'Un professeur ne peut pas supprimer un administrateur d\'école'
      });
    }

    await utilisateur.destroy();

    res.json({
      message: 'Utilisateur supprimé avec succès',
      id: parseInt(id)
    });

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

/**
 * POST /api/school/users/:id/archive
 * Archiver un utilisateur (désactivation sans suppression)
 * Permissions: Admin global OU School Admin/Prof de la même école
 */
router.post('/:id/archive', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role: userRole, ecole_id: userEcoleId } = req.user;

    const utilisateur = await Utilisateur.findByPk(id);
    if (!utilisateur) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier permissions
    if (userRole !== 'admin' && utilisateur.ecole_id !== userEcoleId) {
      return res.status(403).json({
        error: 'Vous ne pouvez archiver que les utilisateurs de votre école'
      });
    }

    // Empêcher archivage admin global (sauf par admin global)
    if (utilisateur.role === 'admin' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Seul un admin peut archiver un administrateur'
      });
    }

    // Empêcher archivage school_admin par un professeur
    if (utilisateur.role === 'school_admin' && userRole === 'professeur') {
      return res.status(403).json({
        error: 'Un professeur ne peut pas archiver un administrateur d\'école'
      });
    }

    await utilisateur.update({ actif: false });

    res.json({
      message: 'Utilisateur archivé avec succès',
      utilisateur: {
        id: utilisateur.id,
        pseudo: utilisateur.pseudo,
        actif: utilisateur.actif
      }
    });

  } catch (error) {
    console.error('Erreur archivage utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'archivage' });
  }
});

module.exports = router;
