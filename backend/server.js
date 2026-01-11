require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron'); // Import node-cron
const MemoryDecayService = require('./src/services/MemoryDecayService'); // Import MemoryDecayService
const SuggestionService = require('./src/services/SuggestionService'); // Import SuggestionService
const BackupService = require('./src/services/BackupService'); // Import BackupService
const LoggingService = require('./src/services/LoggingService'); // Import LoggingService
const app = express();
const PORT = 4000;

// Security Headers - Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Material-UI
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'], // Allow images from HTTPS sources
      connectSrc: ["'self'", 'http://localhost:*', 'http://192.168.0.50:*'], // Allow API calls from localhost and network IP
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:'], // Allow video/audio from HTTPS
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for dev compatibility
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow cross-origin requests in dev
}));

// Middleware CORS - Configuration pour développement et réseau local
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (comme Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // Liste des patterns autorisés
    const allowedPatterns = [
      /^http:\/\/localhost:3000$/,
      /^http:\/\/127\.0\.0\.1:3000$/,
      /^http:\/\/backend:4000$/,  // Requêtes internes Docker
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,  // Réseau local 192.168.x.x
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:4000$/,  // API backend réseau local
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,  // Réseau local 10.x.x.x
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:4000$/,  // API backend 10.x.x.x
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/,  // Réseau local 172.16-31.x.x
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:4000$/  // API backend 172.16-31.x.x
    ];

    // Vérifier si l'origin correspond à un des patterns
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Origin non autorisée: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Permet l'envoi de cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware de logging des requêtes (avant les routes)
const requestLogger = require('./src/middleware/requestLogger');
app.use(requestLogger);

// Connexion DB
const sequelize = require('./db');

// Import des routes
const routes = require('./src/routes');
app.use('/api', routes);

// Middleware de gestion d'erreurs globales (après les routes)
const errorLogger = require('./src/middleware/errorLogger');
app.use(errorLogger);

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

    // Schedule Backup automatique (daily at 4 AM)
    cron.schedule('0 4 * * *', async () => {
      console.log('[CRON] Création backup automatique...');
      try {
        await BackupService.ensureBackupDirectory();
        const backup = await BackupService.createBackup(null, 'automatic');
        console.log(`[CRON] ✅ Backup créé: ${backup.filename} (${backup.size_bytes} bytes)`);

        // Rotation: garder seulement les 7 derniers backups automatiques
        const deletedCount = await BackupService.rotateBackups(7);
        console.log(`[CRON] Rotation: ${deletedCount} ancien(s) backup(s) supprimé(s)`);
      } catch (error) {
        console.error('[CRON] ❌ Erreur lors du backup automatique:', error);
        await LoggingService.error('CRON', `Backup automatique failed: ${error.message}`, {
          error: error.message,
          stack: error.stack
        });
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });
    console.log('⏰ Tâche planifiée de backup automatique activée (tous les jours à 4h).');

    // Schedule Cleanup logs anciens (weekly on Sunday at 00:00)
    cron.schedule('0 0 * * 0', async () => {
      console.log('[CRON] Nettoyage des logs anciens...');
      try {
        const deletedCount = await LoggingService.cleanOldLogs(90); // Garder 90 jours
        console.log(`[CRON] ✅ Logs nettoyés: ${deletedCount} entrées supprimées`);
      } catch (error) {
        console.error('[CRON] ❌ Erreur lors du nettoyage des logs:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });
    console.log('⏰ Tâche planifiée de nettoyage des logs activée (tous les dimanches à minuit).');

    // Schedule Interaction aggregation (monthly on 1st at 3 AM)
    cron.schedule('0 3 1 * *', async () => {
      console.log('[CRON] Agrégation mensuelle des interactions prof-élève...');
      try {
        const { InteractionProfEleve, InteractionSummary } = require('./src/models');
        const { Op } = require('sequelize');

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const year = lastMonth.getFullYear();
        const month = lastMonth.getMonth() + 1;

        // Agréger mois précédent
        const aggregates = await InteractionProfEleve.findAll({
          where: {
            date_interaction: {
              [Op.gte]: new Date(year, month - 1, 1),
              [Op.lt]: new Date(year, month, 1)
            }
          },
          attributes: [
            'professeur_id',
            'eleve_id',
            [sequelize.fn('COUNT', '*'), 'total'],
            [sequelize.fn('MAX', sequelize.col('type_interaction')), 'last_type']
          ],
          group: ['professeur_id', 'eleve_id'],
          raw: true
        });

        // Insérer résumés
        for (const agg of aggregates) {
          await InteractionSummary.upsert({
            professeur_id: agg.professeur_id,
            eleve_id: agg.eleve_id,
            annee: year,
            mois: month,
            total_interactions: agg.total,
            derniere_interaction_type: agg.last_type
          });
        }

        console.log(`[CRON] ✅ Agrégation interactions: ${aggregates.length} résumés créés pour ${year}-${month}`);
        await LoggingService.log('INFO', 'CRON', `Agrégation interactions: ${aggregates.length} résumés créés pour ${year}-${month}`);
      } catch (error) {
        console.error('[CRON] ❌ Erreur lors de l\'agrégation des interactions:', error);
        await LoggingService.log('ERROR', 'CRON', `Erreur agrégation interactions: ${error.message}`);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });
    console.log('⏰ Tâche planifiée d\'agrégation des interactions activée (le 1er de chaque mois à 3h).');

    // Schedule Interaction cleanup (daily at 4 AM - after backup)
    cron.schedule('0 4 * * *', async () => {
      console.log('[CRON] Nettoyage des interactions > 1 an...');
      try {
        const { InteractionProfEleve } = require('./src/models');
        const { Op } = require('sequelize');

        const deleted = await InteractionProfEleve.destroy({
          where: {
            date_interaction: {
              [Op.lt]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
            }
          },
          limit: 5000 // Batch
        });

        console.log(`[CRON] ✅ Nettoyage interactions: ${deleted} entrées supprimées`);
        await LoggingService.log('INFO', 'CRON', `Nettoyage interactions: ${deleted} entrées supprimées`);
      } catch (error) {
        console.error('[CRON] ❌ Erreur lors du nettoyage des interactions:', error);
        await LoggingService.log('ERROR', 'CRON', `Erreur nettoyage interactions: ${error.message}`);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });
    console.log('⏰ Tâche planifiée de nettoyage des interactions activée (tous les jours à 4h après backup).');

    // Schedule Invitation expiration check (daily at 5 AM)
    cron.schedule('0 5 * * *', async () => {
      console.log('[CRON] Marquage des invitations expirées...');
      try {
        const { RelationProfEleve } = require('./src/models');
        const { Op } = require('sequelize');

        const expired = await RelationProfEleve.update(
          { statut: 'expired' },
          {
            where: {
              statut: 'en_attente',
              invitation_expiration_date: {
                [Op.lt]: new Date()
              }
            }
          }
        );

        console.log(`[CRON] ✅ Invitations expirées: ${expired[0]} marquées`);
        await LoggingService.log('INFO', 'CRON', `Invitations expirées: ${expired[0]} marquées`);
      } catch (error) {
        console.error('[CRON] ❌ Erreur lors de l\'expiration des invitations:', error);
        await LoggingService.log('ERROR', 'CRON', `Erreur expiration invitations: ${error.message}`);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });
    console.log('⏰ Tâche planifiée d\'expiration des invitations activée (tous les jours à 5h).');
  });
}).catch(err => {
  console.error('❌ Erreur de connexion à la base :', err);
});