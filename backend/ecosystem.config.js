/**
 * PM2 Ecosystem Configuration for Cirque App Backend
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart cirque-app-backend
 *   pm2 logs cirque-app-backend
 *   pm2 monit
 *
 * Documentation: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [{
    name: 'cirque-app-backend',
    script: './server.js',

    // Chemin absolu du backend (ADAPTER selon votre configuration Infomaniak)
    cwd: '/home/S7BS2HNYb9o_circushub/sites/api-circushub.josephgremaud.com/backend',

    // Mode cluster pour utiliser plusieurs CPU (optionnel)
    instances: 1,
    exec_mode: 'fork', // 'cluster' pour multi-instances

    // Variables d'environnement (optionnel, utilise .env par défaut)
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },

    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Auto-restart si l'app crash
    autorestart: true,

    // Redémarrer si la mémoire dépasse 500 Mo
    max_memory_restart: '500M',

    // Ne pas recharger automatiquement en cas de modification de fichier
    watch: false,

    // Délai avant restart en cas de crash (évite les boucles infinies)
    restart_delay: 4000,

    // Nombre max de restarts instables en 1 min avant arrêt définitif
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
