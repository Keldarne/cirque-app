const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const router = express.Router();
const { Figure, Discipline } = require('../models');
const { verifierToken } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', verifierToken, async (req, res) => {
  try {
    const { discipline_id, createur_id } = req.query;
    const where = {};

    if (discipline_id) {
      where.discipline_id = discipline_id;
    }

    if (createur_id) {
      if (createur_id === 'me') {
        where.createur_id = req.user.id;
      } else {
        where.createur_id = parseInt(createur_id);
      }
    }
    
    // Filtre multi-tenant STRICT (Migration sécurité 2026-01-10):
    // - Admin: voit TOUT (public + toutes écoles)
    // - Professeurs/Élèves: UNIQUEMENT leur école (pas de catalogue public)
    // - Solo: UNIQUEMENT catalogue public
    const userEcoleId = req.user.ecole_id;
    if (req.user.role === 'admin') {
      // Admin voit tout - pas de filtre
    } else if (userEcoleId) {
      // Utilisateurs d'école: Figures de leur école OU Catalogue Public
      where[Op.or] = [
        { ecole_id: userEcoleId },
        { ecole_id: null }
      ];
    } else {
      // Utilisateurs solo: UNIQUEMENT catalogue public
      where.ecole_id = null;
    }

    const figures = await Figure.findAll({
      where,
      include: [Discipline],
      attributes: ['id', 'nom', 'descriptif', 'image_url', 'video_url', 'discipline_id', 'createur_id', 'ecole_id', 'createdAt', 'updatedAt']
    });

    res.json(figures);
  } catch (err) {
    console.error('Erreur GET /figures:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const figure = await Figure.findByPk(id, {
      include: [Discipline]
    });

    if (!figure) {
      return res.status(404).json({ error: 'Figure non trouvée' });
    }

    res.json({ figure });
  } catch (err) {
    console.error('Erreur GET /figures/:id:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

router.get('/:id/etapes', verifierToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { EtapeProgression } = require('../models');

    const etapes = await EtapeProgression.findAll({
      where: { figure_id: id },
      order: [['ordre', 'ASC']]
    });

    res.json(etapes);
  } catch (err) {
    console.error('Erreur GET /figures/:id/etapes:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/**
 * Route proxy avec cache pour les GIFs JugglingLab
 * GET /api/figures/siteswap/:code.gif
 *
 * Exemples:
 * - /api/figures/siteswap/3.gif
 * - /api/figures/siteswap/531.gif
 * - /api/figures/siteswap/97531.gif
 */
router.get('/siteswap/:code.gif', async (req, res) => {
  try {
    const { code } = req.params;

    // Validation basique du siteswap (alphanumérique + quelques chars spéciaux)
    if (!/^[a-zA-Z0-9\[\]\(\)\*\+\-\.]+$/.test(code)) {
      return res.status(400).json({ error: 'Code siteswap invalide' });
    }

    // Chemin du fichier dans le cache
    const uploadsDir = path.join(__dirname, '../../uploads/siteswaps');
    const filePath = path.join(uploadsDir, `${code}.gif`);

    // Vérifier si le fichier existe déjà (CACHE HIT)
    try {
      await fs.access(filePath);
      // Fichier trouvé - le renvoyer immédiatement
      return res.sendFile(filePath, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=31536000' // Cache 1 an côté client
        }
      });
    } catch (err) {
      // Fichier non trouvé (CACHE MISS) - continuer pour le télécharger
    }

    // CACHE MISS - Générer et télécharger depuis JugglingLab
    console.log(`[JugglingLab] Cache miss pour ${code} - Téléchargement...`);

    // Construction de l'URL JugglingLab (mêmes paramètres que le frontend)
    const jugglingLabUrl = `https://jugglinglab.org/anim?pattern=${code};redirect=true;fps=12;height=200;width=300`;

    // Télécharger le GIF depuis JugglingLab (timeout 10s)
    const response = await axios({
      method: 'GET',
      url: jugglingLabUrl,
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'CircusHub/1.0 (Educational juggling app)'
      }
    });

    // Vérifier que c'est bien une image GIF
    if (!response.headers['content-type']?.includes('image/gif')) {
      throw new Error('Réponse JugglingLab invalide (pas un GIF)');
    }

    // Créer le dossier uploads/siteswaps s'il n'existe pas
    await fs.mkdir(uploadsDir, { recursive: true });

    // Sauvegarder le fichier dans le cache
    await fs.writeFile(filePath, response.data);
    console.log(`[JugglingLab] ✅ GIF ${code} téléchargé et mis en cache`);

    // Renvoyer le fichier au client
    res.set({
      'Content-Type': 'image/gif',
      'Cache-Control': 'public, max-age=31536000'
    });
    res.send(response.data);

  } catch (err) {
    console.error('[JugglingLab] Erreur proxy cache:', err.message);

    // Gérer les différents types d'erreurs
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'Timeout JugglingLab (serveur trop lent)' });
    }

    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Siteswap invalide ou non reconnu par JugglingLab' });
    }

    res.status(500).json({
      error: 'Erreur lors de la génération du GIF',
      details: err.message
    });
  }
});

/**
 * ⚠️ ROUTE SUPPRIMÉE POUR SÉCURITÉ
 *
 * Anciennement: POST / (créer une figure sans authentification)
 *
 * Cette route a été supprimée car elle permettait à n'importe qui de créer
 * des figures sans authentification, ce qui est une faille de sécurité.
 *
 * Utiliser à la place: POST /admin/figures (avec authentification)
 * Voir: routes/admin.js:40
 *
 * Date de suppression: 2025-11-22
 * Raison: Faille de sécurité identifiée lors de l'audit de couverture des tests
 */

module.exports = router;