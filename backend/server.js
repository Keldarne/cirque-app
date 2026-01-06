require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron'); // Import node-cron
const MemoryDecayService = require('./src/services/MemoryDecayService'); // Import MemoryDecayService
const SuggestionService = require('./src/services/SuggestionService'); // Import SuggestionService
const app = express();
const PORT = 4000;

// Middleware CORS - Configuration pour développement
app.use(cors({
  origin: 'http://localhost:3000', // Permet explicitement l'origine du frontend en développement
  credentials: true, // Permet l'envoi de cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connexion DB
const sequelize = require('./db');

// Import des routes
const routes = require('./src/routes');
app.use('/api', routes);

// Synchroniser la base et lancer le serveur
sequelize.sync().then(() => {
  console.log('✅ Base de données synchronisée');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    console.log(`🌐 Accessible sur le réseau via http://<votre-ip>:${PORT}`);

    // Schedule Memory Decay update (e.g., daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      console.log('Exécution de la tâche planifiée de mise à jour du déclin mémoriel...');
      try {
        await MemoryDecayService.updateAllDecayLevels();
      } catch (error) {
        console.error('Erreur lors de l\'exécution de la tâche de déclin mémoriel:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris' // Or your desired timezone
    });
    console.log('⏰ Tâche planifiée de mise à jour du déclin mémoriel activée (tous les jours à 2h).');

    // Schedule Suggestions cache refresh (daily at 3 AM)
    cron.schedule('0 3 * * *', async () => {
      console.log('[CRON] Rafraîchissement du cache de suggestions...');
      try {
        const { Utilisateur, Groupe } = require('./src/models');

        // Rafraîchir pour tous les élèves
        const eleves = await Utilisateur.findAll({
          where: { role: 'eleve' },
          attributes: ['id']
        });

        console.log(`[CRON] Rafraîchissement pour ${eleves.length} élèves...`);
        for (const eleve of eleves) {
          try {
            await SuggestionService.rafraichirCacheSuggestions('eleve', eleve.id);
          } catch (error) {
            console.error(`[CRON] Erreur rafraîchissement élève ${eleve.id}:`, error.message);
          }
        }

        // Rafraîchir pour tous les groupes actifs
        const groupes = await Groupe.findAll({
          where: { actif: true },
          attributes: ['id']
        });

        console.log(`[CRON] Rafraîchissement pour ${groupes.length} groupes...`);
        for (const groupe of groupes) {
          try {
            await SuggestionService.rafraichirCacheSuggestions('groupe', groupe.id);
          } catch (error) {
            console.error(`[CRON] Erreur rafraîchissement groupe ${groupe.id}:`, error.message);
          }
        }

        console.log('[CRON] ✅ Cache de suggestions rafraîchi avec succès');
      } catch (error) {
        console.error('[CRON] ❌ Erreur lors du rafraîchissement des suggestions:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });
    console.log('⏰ Tâche planifiée de rafraîchissement des suggestions activée (tous les jours à 3h).');
  });
}).catch(err => {
  console.error('❌ Erreur de connexion à la base :', err);
});