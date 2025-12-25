const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Utilisateur = require("../models/Utilisateur");
const { ProgrammeProf } = require("../models");
const { verifierToken } = require("../middleware/auth");

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { pseudo, email, mot_de_passe } = req.body;

    // Validation des champs requis
    if (!pseudo || !email || !mot_de_passe) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // Validation mot de passe (minimum 8 caractères)
    if (mot_de_passe.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    // Validation format email (basique)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Format d'email invalide" });
    }

    // Validation longueur pseudo
    if (pseudo.length < 3 || pseudo.length > 50) {
      return res.status(400).json({ error: "Le pseudo doit contenir entre 3 et 50 caractères" });
    }

    // Créer l'utilisateur avec le rôle 'eleve' par défaut (ignore role fourni par l'utilisateur)
    const nouvelUtilisateur = await Utilisateur.create({
      pseudo,
      email,
      mot_de_passe,
      role: "eleve" // Toujours 'eleve' pour les nouvelles inscriptions
    });

    try {
      await ProgrammeProf.create({
        nom: `Programme Personnel - ${pseudo}`,
        description: 'Mon programme d\'entraînement personnel',
        professeur_id: nouvelUtilisateur.id,
        est_modele: false
      });
      console.log(`Programme personnel créé pour l'utilisateur ${pseudo}`);
    } catch (progErr) {
      console.error('Erreur création programme personnel:', progErr);
    }

    const { mot_de_passe: _, ...userSansPassword } = nouvelUtilisateur.toJSON();
    res.status(201).json({ message: "Utilisateur créé", user: userSansPassword });
  } catch (err) {
    console.error("Erreur inscription:", err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "Ce pseudo ou email existe déjà" });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { pseudo, email, mot_de_passe } = req.body;

    if ((!pseudo && !email) || !mot_de_passe) {
      return res.status(400).json({ error: "Email ou pseudo et mot de passe requis" });
    }

    const whereClause = email ? { email } : { pseudo };
    const user = await Utilisateur.scope("withPassword").findOne({ where: whereClause });
    if (!user) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Connexion réussie",
      token,
      role: user.role,
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        niveau: user.niveau,
        xp: user.xp,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * @route   GET /me
 * @desc    Récupérer les informations de l'utilisateur authentifié
 * @access  Private
 */
router.get("/me", verifierToken, async (req, res) => {
  // req.user est déjà attaché par le middleware verifierToken
  // On renvoie l'objet utilisateur complet (sans le mot de passe grâce au scope par défaut)
  res.json(req.user);
});

module.exports = router;