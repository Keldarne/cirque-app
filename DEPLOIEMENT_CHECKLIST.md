# Checklist de Déploiement Infomaniak - Cirque App v1.0

**Date de déploiement** : _______________
**Déployé par** : _______________

---

## 📋 Préparation Locale

### Configuration
- [ ] Créer `backend/.env.production` avec les vraies valeurs de production
- [ ] Générer un `JWT_SECRET` sécurisé (32+ caractères)
- [ ] Créer `frontend/.env.production` avec `REACT_APP_API_URL`
- [ ] Ajouter le domaine de production dans `backend/server.js` (CORS)
- [ ] Mettre à jour `.gitignore` (ajouter `*.env.production`, `backend/uploads/`)

### Build
- [ ] Exécuter `scripts/build-production.sh` (Mac/Linux) ou `.ps1` (Windows)
- [ ] Vérifier que `frontend/build/` est généré correctement
- [ ] Vérifier que `backend/node_modules/` contient uniquement les deps de production

### Git
- [ ] Commiter tous les changements : `git add . && git commit -m "Prepare production deployment"`
- [ ] Pousser sur la branche main : `git push origin main`
- [ ] ⚠️ **NE PAS commiter les fichiers `.env.production`** (vérifier avec `git status`)

---

## 🔧 Configuration Infomaniak

### Compte & Accès
- [ ] Connexion à Infomaniak Manager : https://manager.infomaniak.com
- [ ] Type de compte : ☐ Cloud Server ☐ Jelastic Cloud ☐ Autre : ___________
- [ ] Accès SSH configuré et testé : `ssh utilisateur@serveur.infomaniak.ch`

### Domaines
- [ ] Domaine principal configuré : _____________________ (ex: `cirqueapp.ch`)
- [ ] Sous-domaine API configuré : _____________________ (ex: `api.cirqueapp.ch`)
- [ ] DNS pointent vers le serveur Infomaniak (A/CNAME records)

### SSL/TLS
- [ ] Certificat Let's Encrypt activé pour le domaine principal
- [ ] Certificat Let's Encrypt activé pour le sous-domaine API
- [ ] Test HTTPS : `curl https://cirqueapp.ch` (ne doit pas avoir d'erreur SSL)

### Base de Données MySQL
- [ ] Base de données créée : Nom `cirque_app_prod`
- [ ] Utilisateur créé : `cirque_user_prod`
- [ ] Mot de passe fort généré (20+ caractères) : ☐ Oui
- [ ] Connexion testée : `mysql -u cirque_user_prod -p cirque_app_prod`

**Informations de connexion** (à garder en lieu sûr) :
```
DB_HOST: ___________________
DB_NAME: cirque_app_prod
DB_USER: cirque_user_prod
DB_PASSWORD: ___________________
DB_PORT: 3306
```

---

## 🚀 Déploiement Backend

### Transfert du Code
- [ ] Code cloné/uploadé sur le serveur dans `~/sites/api.cirqueapp.ch/backend`
- [ ] Méthode utilisée : ☐ Git ☐ SFTP ☐ SCP ☐ Autre : ___________

### Installation
- [ ] Dépendances installées : `cd backend && npm ci --production`
- [ ] Fichier `.env` créé dans `backend/` avec les valeurs de production
- [ ] Permissions `.env` sécurisées : `chmod 600 .env`
- [ ] Dossier `uploads/siteswaps/` créé (pour cache JugglingLab)
- [ ] Dossier `logs/` créé pour PM2

### Base de Données
- [ ] Base initialisée : `npm run reset-and-seed`
- [ ] Vérification : `SELECT COUNT(*) FROM Utilisateurs;` retourne au moins 28 lignes
- [ ] Vérification : `SELECT COUNT(*) FROM Figures;` retourne des figures

### PM2 Process Manager
- [ ] PM2 installé globalement : `npm install -g pm2`
- [ ] Fichier `ecosystem.config.js` créé avec la bonne config
- [ ] Application démarrée : `pm2 start ecosystem.config.js`
- [ ] Status vérifié : `pm2 status` → montre "online"
- [ ] Logs vérifiés : `pm2 logs cirque-app-backend` → pas d'erreur
- [ ] Config sauvegardée : `pm2 save`
- [ ] Démarrage auto configuré : `pm2 startup` (suivre les instructions)

### Reverse Proxy Apache
- [ ] Fichier `.htaccess` créé à la racine du site API
- [ ] Configuration proxy : `RewriteRule ^(.*)$ http://localhost:4000/$1 [P,L]`
- [ ] Modules Apache activés : `mod_rewrite`, `mod_proxy`, `mod_proxy_http`, `mod_headers`
- [ ] Apache redémarré si nécessaire

### Tests Backend
- [ ] Test local : `curl http://localhost:4000/api/health` → retourne `{"status":"OK"}`
- [ ] Test externe : `curl https://api.cirqueapp.ch/api/health` → retourne `{"status":"OK"}`
- [ ] Test disciplines : `curl https://api.cirqueapp.ch/api/disciplines` → retourne du JSON
- [ ] Test figures : `curl https://api.cirqueapp.ch/api/figures` → retourne du JSON
- [ ] Logs PM2 propres (pas d'erreur)

---

## 🎨 Déploiement Frontend

### Build & Transfert
- [ ] Build local généré : `cd frontend && npm run build`
- [ ] Contenu de `frontend/build/` uploadé dans `~/sites/cirqueapp.ch/`
- [ ] Vérification : `index.html` présent à la racine du site
- [ ] Vérification : dossier `static/` présent avec JS/CSS

### Configuration Apache
- [ ] Fichier `.htaccess` créé à la racine du site frontend
- [ ] Configuration React Router : Redirige tout vers `index.html`
- [ ] Force HTTPS : `RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`
- [ ] Headers de sécurité ajoutés (X-Frame-Options, CSP, etc.)
- [ ] Cache activé pour fichiers statiques (images, CSS, JS)

### Tests Frontend
- [ ] Page d'accueil charge : https://cirqueapp.ch
- [ ] Pas de page blanche
- [ ] Console navigateur (F12) : pas d'erreurs critiques
- [ ] Images et styles chargent correctement
- [ ] Navigation entre pages fonctionne
- [ ] React Router fonctionne (URL changent, pas de 404)

---

## ✅ Tests d'Intégration

### Authentification
- [ ] Inscription d'un nouveau compte fonctionne
- [ ] Connexion avec le compte test fonctionne (email: `admin1@example.com`, mdp: `admin123`)
- [ ] Déconnexion fonctionne
- [ ] Token JWT persiste (rafraîchir la page, toujours connecté)

### API & Frontend Communication
- [ ] Liste des disciplines s'affiche
- [ ] Liste des figures s'affiche
- [ ] Détails d'une figure s'affichent
- [ ] Profil utilisateur s'affiche
- [ ] Enregistrement d'une tentative fonctionne
- [ ] Statistiques s'affichent

### Sécurité
- [ ] HTTPS actif sur frontend (cadenas vert dans navigateur)
- [ ] HTTPS actif sur backend API
- [ ] Redirect HTTP → HTTPS fonctionne
- [ ] CORS fonctionne (pas d'erreur "blocked by CORS policy")
- [ ] Headers de sécurité présents : https://securityheaders.com
- [ ] JWT validation fonctionne (essayer d'accéder à `/api/progression` sans token → 401)

### Performance
- [ ] Time to First Byte (TTFB) < 500ms
- [ ] Page Load Time < 3s (test avec devtools)
- [ ] API responses < 200ms (hors génération JugglingLab)
- [ ] Cache JugglingLab fonctionne (2ème chargement GIF instantané)

---

## 🔒 Sécurité Post-Déploiement

### Firewall
- [ ] Firewall activé sur le serveur Infomaniak
- [ ] Ports ouverts : 22 (SSH), 80 (HTTP), 443 (HTTPS)
- [ ] Port 3306 (MySQL) : localhost uniquement (non exposé publiquement)
- [ ] Port 4000 (Node.js) : localhost uniquement (non exposé publiquement)

### Secrets
- [ ] `JWT_SECRET` changé (différent de `dev_jwt_secret_changez_moi_en_production`)
- [ ] Mot de passe MySQL fort et unique
- [ ] Fichier `.env` non accessible via HTTP (protection `.htaccess` ou hors webroot)
- [ ] Copie de backup des secrets stockée en lieu sûr (gestionnaire de mots de passe)

### Rate Limiting
- [ ] Rate limiting actif sur l'API (test : faire 150 requêtes rapidement → doit bloquer après 100)

---

## 🔄 Maintenance

### Backups
- [ ] Script de backup DB créé : `backend/scripts/backup-db.sh`
- [ ] Permissions exécutables : `chmod +x backend/scripts/backup-db.sh`
- [ ] Test manuel du backup : `./backend/scripts/backup-db.sh`
- [ ] Cron job configuré : `crontab -e` → ajouté `0 3 * * * ...`
- [ ] Vérifier que le backup s'exécute : `ls ~/backups/cirque-app/`

### Monitoring
- [ ] Monitoring Infomaniak configuré (uptime, alertes)
- [ ] Logs accessibles : `pm2 logs`, logs Apache
- [ ] PM2 monit : `pm2 monit` affiche métriques en temps réel

### Documentation
- [ ] URL de production documentées dans le README
- [ ] Identifiants de connexion SSH sauvegardés
- [ ] Identifiants DB sauvegardés
- [ ] Procédure de mise à jour documentée

---

## 📊 Métriques de Succès

### Performance
- [ ] Backend répond en < 200ms
- [ ] Frontend charge en < 3s
- [ ] 0 erreur 500 dans les logs
- [ ] Uptime > 99%

### Fonctionnel
- [ ] Tous les tests manuels passent
- [ ] Aucune régression par rapport au dev
- [ ] Comptes de test fonctionnels

---

## 🎉 Déploiement Finalisé

- [ ] Toutes les cases cochées ci-dessus
- [ ] Tests post-déploiement validés
- [ ] Monitoring actif
- [ ] Backups configurés
- [ ] Documentation à jour

**Date de mise en production** : _______________
**Validé par** : _______________

**🚀 Cirque App v1.0 est officiellement en production sur Infomaniak !**

---

## 📞 Support & Ressources

- **Guide détaillé** : [docs/DEPLOIEMENT_INFOMANIAK.md](docs/DEPLOIEMENT_INFOMANIAK.md)
- **Support Infomaniak** : https://www.infomaniak.com/fr/support
- **Documentation API** : [backend/docs/API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md)
- **Issues GitHub** : [Créer une issue](https://github.com/votre-compte/cirque-app/issues)

---

## 🐛 Troubleshooting Rapide

**Backend ne démarre pas** :
```bash
pm2 logs cirque-app-backend --err
pm2 restart cirque-app-backend
```

**CORS bloque requêtes** :
- Vérifier `FRONTEND_URL` dans `backend/.env`
- Vérifier domaine dans `backend/server.js` allowedPatterns
- Redémarrer : `pm2 restart cirque-app-backend`

**Page blanche frontend** :
- Vérifier console F12 pour erreurs
- Vérifier `.htaccess` React Router config
- Vérifier `REACT_APP_API_URL` dans build

**API retourne 404** :
- Tester directement : `curl http://localhost:4000/api/health`
- Vérifier PM2 status : `pm2 status`
- Vérifier `.htaccess` reverse proxy
