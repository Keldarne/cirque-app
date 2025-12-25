require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron'); // Import node-cron
const MemoryDecayService = require('./src/services/MemoryDecayService'); // Import MemoryDecayService
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
  });
}).catch(err => {
  console.error('❌ Erreur de connexion à la base :', err);
});