const express = require('express');
const router = express.Router();
const { verifierToken, estProfesseurOuAdmin } = require('../../middleware/auth');
const { verifierRelationProfEleve } = require('../../middleware/profAuth');
const ProfService = require('../../services/ProfService');
const { RelationProfEleve, AssignationProgramme, ProgrammeProf, ProgressionEtape, EtapeProgression, Figure, Ecole } = require('../../models');
const sequelize = require('../../../db');
const multer = require('multer');
const fs = require('fs');
const ImportElevesService = require('../../services/ImportElevesService');

// Configuration multer pour upload de fichiers
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 1024 * 1024 // 1MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers CSV sont acceptés'));
    }
  }
});

// Obtenir la liste de tous les élèves d'un professeur
router.get('', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const eleves = await ProfService.getElevesByProfId(req.user.id);
    res.json({ eleves });
  } catch (error) {
    console.error('Erreur GET /api/prof/eleves:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * POST /api/prof/eleves/import
 * Import en masse d'élèves via fichier CSV
 * @access  Private (Professeur ou School Admin avec école)
 * NOTE: Cette route DOIT être avant /:id pour éviter qu'Express ne la traite comme un paramètre
 */
router.post('/import', verifierToken, estProfesseurOuAdmin, upload.single('file'), async (req, res) => {
  try {
    // 1. Vérifier que l'utilisateur a une école
    if (!req.user.ecole_id) {
      return res.status(403).json({
        error: 'Import réservé aux enseignants affiliés à une école'
      });
    }

    // 2. Vérifier que fichier existe
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier CSV requis' });
    }

    // 3. Parser le CSV
    let elevesData;
    try {
      elevesData = await ImportElevesService.parseCSV(req.file.path);
    } catch (parseError) {
      // Cleanup file
      fs.unlinkSync(req.file.path);
      return res.status(parseError.status || 400).json({
        error: parseError.message,
        details: parseError.errors
      });
    }

    // Vérifier limite de 100 élèves par import
    if (elevesData.length > 100) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: `Maximum 100 élèves par import (${elevesData.length} fournis)`
      });
    }

    // 4. Récupérer l'école
    const ecole = await Ecole.findByPk(req.user.ecole_id);
    if (!ecole) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'École non trouvée' });
    }

    // 5. Vérifier limite école
    try {
      await ImportElevesService.verifierLimiteEcole(
        req.user.ecole_id,
        elevesData.length
      );
    } catch (limiteError) {
      fs.unlinkSync(req.file.path);
      return res.status(limiteError.status || 403).json({
        error: limiteError.message
      });
    }

    // 6. Générer pseudos/emails/passwords
    const prefixeEcole = ImportElevesService.genererPrefixeEcole(ecole.nom);
    const domaineEcole = ImportElevesService.extraireDomaine(ecole.nom);
    const motDePasseDefaut = ImportElevesService.genererMotDePasseEcole(ecole.nom);

    const elevesAvecCredentials = elevesData.map(eleve => ({
      ...eleve,
      pseudo: ImportElevesService.genererPseudo(
        eleve.prenom,
        eleve.nom,
        prefixeEcole
      ),
      email: eleve.email || ImportElevesService.genererEmail(
        eleve.prenom,
        eleve.nom,
        domaineEcole
      ),
      mot_de_passe: motDePasseDefaut
    }));

    // 7. Vérifier doublons
    try {
      await ImportElevesService.verifierDoublons(elevesAvecCredentials);
    } catch (doublonError) {
      fs.unlinkSync(req.file.path);
      return res.status(doublonError.status || 409).json({
        error: doublonError.message
      });
    }

    // 8. Importer
    let resultat;
    try {
      resultat = await ImportElevesService.importerEleves(
        elevesAvecCredentials,
        req.user.ecole_id
      );
    } catch (importError) {
      fs.unlinkSync(req.file.path);
      return res.status(importError.status || 500).json({
        error: importError.message,
        details: importError.errors,
        created: importError.created || [],
        failed: importError.failed || []
      });
    }

    // 9. Nettoyer le fichier uploadé
    fs.unlinkSync(req.file.path);

    // 10. Retourner rapport
    res.status(201).json({
      success: true,
      created: resultat.created.length,
      failed: resultat.failed.length,
      errors: resultat.errors,
      students: resultat.created,
      defaultPassword: motDePasseDefaut,
      prefixePseudo: prefixeEcole
    });

  } catch (error) {
    console.error('Erreur POST /api/prof/eleves/import:', error);

    // Cleanup file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(error.status || 500).json({
      error: error.message || 'Erreur serveur lors de l\'import'
    });
  }
});

/**
 * GET /api/prof/eleves/:id
 * Détails complets d'un élève, protégé par le middleware de vérification de relation.
 */
router.get('/:id', verifierToken, estProfesseurOuAdmin, verifierRelationProfEleve, async (req, res) => {
  try {
    const { id } = req.params;
    const details = await ProfService.getEleveDetails(id);

    if (!details) {
      return res.status(404).json({ error: 'Détails de l\'élève non trouvés.' });
    }

    res.json({
      ...details,
      // La relation est attachée à la requête par le middleware
      relation: {
        notes_prof: req.relation.notes_prof,
        date_acceptation: req.relation.date_acceptation
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/prof/eleves/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * PUT /api/prof/eleves/:id/notes
 * Mettre à jour les notes du professeur sur un élève.
 */
router.put('/:id/notes', verifierToken, estProfesseurOuAdmin, verifierRelationProfEleve, async (req, res) => {
  try {
    const { notes } = req.body;
    // req.relation est fourni par le middleware verifierRelationProfEleve
    const updatedRelation = await ProfService.updateNotesForEleve(req.relation, notes);

    res.json({
      message: 'Notes mises à jour avec succès',
      notes: updatedRelation.notes_prof
    });
  } catch (error) {
    console.error('Erreur PUT /api/prof/eleves/:id/notes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * DELETE /api/prof/eleves/:id
 * Retirer un élève de la liste.
 * NOTE: N'utilise pas `verifierRelationProfEleve` car son critère de recherche est
 * légèrement différent (ne vérifie pas si la relation est 'active').
 */
router.delete('/:id', verifierToken, estProfesseurOuAdmin, async (req, res) => {
  try {
    const { id: eleveId } = req.params;
    const professeurId = req.user.id;

    // Vérification manuelle car le critère est différent du middleware standard.
    const relation = await RelationProfEleve.findOne({
      where: { professeur_id: professeurId, eleve_id: eleveId, statut: 'accepte' }
    });

    if (!relation) {
      return res.status(404).json({ error: 'Élève non trouvé dans votre liste' });
    }

    await ProfService.removeEleveFromProf(eleveId, professeurId);

    res.status(200).json({ message: 'Élève retiré avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /api/prof/eleves/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * POST /api/prof/eleves/:eleveId/programmes/assigner
 * Assigner un programme existant à un élève.
 * @access  Private (Professeur ou Admin lié à l'élève)
 */
router.post('/:id/programmes/assigner', verifierToken, estProfesseurOuAdmin, verifierRelationProfEleve, async (req, res) => {
  try {
    const eleveId = parseInt(req.params.id, 10); // Le middleware utilise déjà 'id'
    const { programme_id } = req.body;
    const professeur_id = req.user.id;

    if (!programme_id) {
      return res.status(400).json({ error: 'L\'ID du programme est requis.' });
    }
    const programmeIdNum = parseInt(programme_id, 10); // Assurer que c'est un nombre

    // Vérifier que le programme appartient bien à ce professeur
    const programme = await ProgrammeProf.findOne({
      where: {
        id: programmeIdNum,
        professeur_id: professeur_id
      }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme introuvable ou vous n\'êtes pas le créateur.' });
    }

    // Vérifier si l'assignation existe déjà
    const existingAssignment = await AssignationProgramme.findOne({
      where: {
        programme_id: programmeIdNum,
        eleve_id: eleveId
      }
    });

    if (existingAssignment) {
      return res.status(409).json({ error: 'Ce programme est déjà assigné à cet élève.' });
    }

    const assignation = await AssignationProgramme.create({
      programme_id: programmeIdNum,
      eleve_id: eleveId,
      date_assignation: new Date()
    });

    res.status(201).json({ message: 'Programme assigné avec succès.', assignation });

  } catch (error) {
    console.error('Erreur POST /api/prof/eleves/:eleveId/programmes/assigner:', error);
    // Gérer spécifiquement l'erreur de duplicata si elle se produit malgré tout (race condition)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ce programme est déjà assigné à cet élève.' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de l\'assignation du programme.', details: error.message });
  }
});

module.exports = router;
