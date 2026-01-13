# Guide de Déploiement Infomaniak - Cirque App v1.0

Ce document décrit le processus complet de déploiement de l'application Cirque App sur l'hébergement Infomaniak.

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Architecture de Déploiement](#architecture-de-déploiement)
3. [Configuration Infomaniak](#configuration-infomaniak)
4. [Préparation du Code](#préparation-du-code)
5. [Déploiement Backend](#déploiement-backend)
6. [Déploiement Frontend](#déploiement-frontend)
7. [Configuration Base de Données](#configuration-base-de-données)
8. [Variables d'Environnement](#variables-denvironnement)
9. [Sécurité & SSL](#sécurité--ssl)
10. [Tests Post-Déploiement](#tests-post-déploiement)
11. [Maintenance & Mises à Jour](#maintenance--mises-à-jour)
12. [Troubleshooting](#troubleshooting)

---

## 📦 Prérequis

### Compte Infomaniak

- **Type de compte requis** : Cloud Server ou hébergement avec Node.js
  - ⚠️ **L'hébergement partagé standard ne supporte PAS Node.js**
  - Recommandé : **Managed Cloud Server** (à partir de 5.75€/mois)
  - Alternative : **Jelastic Cloud** pour auto-scaling avancé

### Accès Nécessaires

- [ ] Accès à Infomaniak Manager (https://manager.infomaniak.com)
- [ ] Accès SSH au serveur
- [ ] Accès à phpMyAdmin ou outil de gestion MySQL
- [ ] Nom de domaine configuré (ex: `cirqueapp.ch` ou sous-domaine)
- [ ] Git installé localement pour pousser le code

### Versions Requises

- Node.js : **18.x** (LTS)
- MySQL/MariaDB : **8.0+** ou **10.6+**
- npm : **9.x+**

---

## 🏗️ Architecture de Déploiement

### Option A : Déploiement Séparé (Recommandé pour v1.0)

```
┌─────────────────────────────────────────────────────────────┐
│                    INFOMANIAK CLOUD SERVER                   │
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────────┐ │
│  │  Backend (Node.js)   │      │  Frontend (Static Files) │ │
│  │  Port: 4000          │◄─────┤  Served by Apache/Nginx  │ │
│  │  PM2 Process Manager │      │  Port: 80/443            │ │
│  └──────────┬───────────┘      └──────────────────────────┘ │
│             │                                                │
│             ▼                                                │
│  ┌─────────────────────────────────────┐                    │
│  │  MySQL Database (MariaDB)           │                    │
│  │  cirque_app_prod                    │                    │
│  └─────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

**Avantages** :
- Simple à configurer
- Backend et frontend séparés (meilleure isolation)
- Frontend servi par Apache (rapide pour fichiers statiques)
- Backend Node.js géré par PM2 (auto-restart)

### Option B : Déploiement Docker (Futur)

Pour v2.0+, possibilité d'utiliser Jelastic Cloud avec Docker Compose (voir section avancée).

---

## 🔧 Configuration Infomaniak

### Étape 1 : Créer un Site Node.js

1. **Se connecter à Infomaniak Manager** : https://manager.infomaniak.com
2. **Accéder aux Produits** : Cliquer sur votre Cloud Server
3. **Créer un Nouveau Site** :
   - Cliquer sur le bouton bleu **"Ajouter"**
   - Sélectionner **"Technologies avancées"**
   - Choisir **Node.js** (version 18.x)
   - Cliquer sur **"Suivant"**

4. **Configurer le Domaine** :
   - Option A : Domaine existant (ex: `api.cirqueapp.ch` pour le backend)
   - Option B : Sous-domaine (ex: `api.mondomaine.ch`)
   - Configurer SSL : **Activer Let's Encrypt**

5. **Méthode de Déploiement** :
   - Choisir **"Déploiement personnalisé"**
   - Sélectionner **Git** ou **SSH/SFTP**

### Étape 2 : Configurer SSH

1. Dans Infomaniak Manager, aller dans **"Paramètres SSH"**
2. Générer une paire de clés SSH si nécessaire :
   ```bash
   ssh-keygen -t rsa -b 4096 -C "cirque-app-deploy"
   ```
3. Ajouter la clé publique dans Infomaniak Manager
4. Tester la connexion :
   ```bash
   ssh utilisateur@votreserveur.infomaniak.ch
   ```

### Étape 3 : Créer la Base de Données MySQL

1. Dans Infomaniak Manager, aller dans **"Bases de données"**
2. Cliquer sur **"Créer une base de données"**
3. Paramètres :
   - Nom : `cirque_app_prod`
   - Utilisateur : `cirque_user_prod`
   - Mot de passe : Générer un mot de passe fort (noter précieusement)
   - Type : **MySQL 8.0** ou **MariaDB 10.6+**

4. **Noter les informations de connexion** :
   ```
   DB_HOST: localhost (ou mysql.votreserveur.infomaniak.ch)
   DB_NAME: cirque_app_prod
   DB_USER: cirque_user_prod
   DB_PASSWORD: [mot de passe généré]
   DB_PORT: 3306
   ```

---

## 📝 Préparation du Code

### Étape 1 : Créer les Fichiers de Production

#### A) Backend - `.env.production`

Créer `backend/.env.production` (NE PAS commiter ce fichier !) :

```bash
# Base de données
DB_NAME=cirque_app_prod
DB_USER=cirque_user_prod
DB_PASSWORD=VOTRE_MOT_DE_PASSE_FORT_ICI
DB_HOST=localhost
DB_PORT=3306

# Backend
PORT=4000
NODE_ENV=production

# JWT Secret (générer avec: openssl rand -base64 32)
JWT_SECRET=VOTRE_SECRET_JWT_SUPER_SECURISE_64_CARACTERES_MINIMUM

# Frontend URL (votre domaine de production)
FRONTEND_URL=https://cirqueapp.ch

# Logs
LOG_LEVEL=info
```

**Génération du JWT_SECRET sécurisé** :
```bash
# Sur Linux/Mac/Git Bash:
openssl rand -base64 32

# Sur Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### B) Frontend - `.env.production`

Créer `frontend/.env.production` :

```bash
# URL de l'API backend
REACT_APP_API_URL=https://api.cirqueapp.ch

# Pas de proxy en production
# (le proxy package.json est ignoré en production)
```

#### C) Mettre à Jour `server.js` - CORS Production

Éditer `backend/server.js` pour ajouter le domaine de production dans CORS :

```javascript
// Ligne ~20-40
const allowedPatterns = [
  /^http:\/\/localhost:3000$/,
  /^http:\/\/127\.0\.0\.1:3000$/,
  /^http:\/\/backend:4000$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3000$/,

  // AJOUTER VOS DOMAINES DE PRODUCTION :
  /^https:\/\/cirqueapp\.ch$/,
  /^https:\/\/www\.cirqueapp\.ch$/,
  /^https:\/\/api\.cirqueapp\.ch$/,
];
```

#### D) Frontend - Configuration API Dynamique

Vérifier que `frontend/src/utils/api.js` utilise `REACT_APP_API_URL` :

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const apiRequest = async (endpoint, options = {}) => {
  const url = API_BASE_URL + endpoint;
  // ... reste du code
};
```

#### E) Mettre à Jour `.gitignore`

Ajouter à `.gitignore` (racine du projet) :

```gitignore
# Production environment files
backend/.env.production
frontend/.env.production

# Build artifacts
frontend/build/

# Uploads (generated files)
backend/uploads/

# PM2 logs
backend/logs/
backend/*.log
```

### Étape 2 : Créer le Script de Build Production

Créer `scripts/build-production.sh` (Git Bash/Linux/Mac) :

```bash
#!/bin/bash
set -e

echo "🏗️  Building Cirque App for Production..."

# 1. Build Frontend
echo "📦 Building frontend..."
cd frontend
npm ci --production=false  # Install all deps including devDeps for build
npm run build
echo "✅ Frontend build complete (frontend/build/)"
cd ..

# 2. Prepare Backend
echo "📦 Preparing backend..."
cd backend
npm ci --production  # Production deps only
echo "✅ Backend dependencies installed"
cd ..

echo "✅ Production build complete!"
echo ""
echo "📁 Deployment artifacts:"
echo "  - Frontend: frontend/build/"
echo "  - Backend:  backend/"
```

Créer `scripts/build-production.ps1` (Windows PowerShell) :

```powershell
Write-Host "🏗️  Building Cirque App for Production..." -ForegroundColor Green

# 1. Build Frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm ci --production=false
npm run build
Write-Host "✅ Frontend build complete (frontend/build/)" -ForegroundColor Green
Set-Location ..

# 2. Prepare Backend
Write-Host "📦 Preparing backend..." -ForegroundColor Yellow
Set-Location backend
npm ci --production
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host "✅ Production build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Deployment artifacts:" -ForegroundColor Cyan
Write-Host "  - Frontend: frontend/build/"
Write-Host "  - Backend:  backend/"
```

Rendre exécutable (Linux/Mac) :
```bash
chmod +x scripts/build-production.sh
```

---

## 🚀 Déploiement Backend

### Étape 1 : Transférer le Code Backend

#### Option A : Via Git (Recommandé)

1. **Pousser le code sur Git** (GitHub, GitLab, Bitbucket) :
   ```bash
   git add .
   git commit -m "Prepare production deployment"
   git push origin main
   ```

2. **Sur le serveur Infomaniak** (via SSH) :
   ```bash
   ssh utilisateur@votreserveur.infomaniak.ch
   cd ~/sites/api.cirqueapp.ch  # Ou le chemin de votre site Node.js

   # Cloner le repo
   git clone https://github.com/votre-compte/cirque-app.git .

   # Ou mettre à jour
   git pull origin main
   ```

#### Option B : Via SFTP

1. Utiliser FileZilla ou WinSCP
2. Se connecter avec les identifiants SSH
3. Uploader le dossier `backend/` complet

### Étape 2 : Installer les Dépendances

```bash
cd ~/sites/api.cirqueapp.ch/backend
npm ci --production
```

### Étape 3 : Configurer l'Environnement

```bash
# Créer le fichier .env
nano .env

# Coller le contenu de .env.production (préparé localement)
# Sauvegarder : Ctrl+X, Y, Enter
```

**⚠️ IMPORTANT** : Vérifier que les permissions sont correctes :
```bash
chmod 600 .env  # Lecture/écriture uniquement par le propriétaire
```

### Étape 4 : Initialiser la Base de Données

```bash
cd ~/sites/api.cirqueapp.ch/backend

# Reset et seed la base de données
npm run reset-and-seed
```

**Sortie attendue** :
```
Base de données réinitialisée avec succès.
[Seed] 🌱 Starting seeding process...
[Seed] ✅ Seeding completed successfully!
```

### Étape 5 : Configurer PM2 (Process Manager)

PM2 permet de garder le backend Node.js actif en permanence et de redémarrer automatiquement en cas de crash.

#### Installer PM2 Globalement

```bash
npm install -g pm2
```

#### Créer le Fichier de Configuration PM2

Créer `backend/ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'cirque-app-backend',
    script: './server.js',
    cwd: '/home/utilisateur/sites/api.cirqueapp.ch/backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
```

#### Démarrer l'Application avec PM2

```bash
cd ~/sites/api.cirqueapp.ch/backend

# Créer le dossier logs
mkdir -p logs

# Démarrer l'app
pm2 start ecosystem.config.js

# Sauvegarder la config pour redémarrage auto
pm2 save

# Configurer le démarrage auto au boot serveur
pm2 startup
# Suivre les instructions affichées (copier-coller la commande)
```

#### Vérifier le Status

```bash
pm2 status
pm2 logs cirque-app-backend
pm2 monit  # Moniteur en temps réel
```

**Commandes PM2 utiles** :
```bash
pm2 restart cirque-app-backend   # Redémarrer
pm2 stop cirque-app-backend      # Arrêter
pm2 delete cirque-app-backend    # Supprimer
pm2 logs                          # Voir les logs en temps réel
```

### Étape 6 : Configurer le Reverse Proxy (Apache)

Par défaut, Infomaniak utilise Apache. Il faut configurer un reverse proxy pour que `https://api.cirqueapp.ch` redirige vers `localhost:4000`.

#### Créer le fichier `.htaccess` dans le dossier racine du site

Créer `~/sites/api.cirqueapp.ch/.htaccess` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Rediriger toutes les requêtes vers le backend Node.js
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ http://localhost:4000/$1 [P,L]
</IfModule>

# Headers de sécurité
<IfModule mod_headers.c>
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

**Note** : Le flag `[P]` active le mode proxy (ProxyPass).

#### Activer les Modules Apache Requis

Contacter le support Infomaniak si ces modules ne sont pas activés :
- `mod_rewrite`
- `mod_proxy`
- `mod_proxy_http`
- `mod_headers`

### Étape 7 : Tester le Backend

```bash
# Test local sur le serveur
curl http://localhost:4000/api/health

# Test depuis l'extérieur
curl https://api.cirqueapp.ch/api/health
```

**Réponse attendue** :
```json
{
  "status": "OK",
  "timestamp": "2026-01-13T10:30:00.000Z"
}
```

---

## 🎨 Déploiement Frontend

### Étape 1 : Build du Frontend en Local

```bash
# Sur votre machine locale
cd frontend

# Build de production
npm run build
```

Cela génère le dossier `frontend/build/` contenant les fichiers statiques optimisés.

### Étape 2 : Transférer les Fichiers Build

#### Option A : Via SFTP (Recommandé)

1. Se connecter au serveur via FileZilla/WinSCP
2. Aller dans `~/sites/cirqueapp.ch/` (ou votre domaine principal)
3. Uploader le contenu de `frontend/build/` dans le dossier racine

#### Option B : Via SSH + SCP

```bash
# Sur votre machine locale
cd frontend
scp -r build/* utilisateur@votreserveur.infomaniak.ch:~/sites/cirqueapp.ch/
```

#### Option C : Via Git + Build sur Serveur

```bash
# Sur le serveur
cd ~/sites/cirqueapp.ch
git pull origin main
cd frontend
npm ci
npm run build
cp -r build/* ../  # Copier le build à la racine du site
```

### Étape 3 : Configurer Apache pour React SPA

Créer `~/sites/cirqueapp.ch/.htaccess` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Rediriger toutes les requêtes vers index.html (pour React Router)
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compression GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache des fichiers statiques
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/json "access plus 1 week"
</IfModule>

# Headers de sécurité
<IfModule mod_headers.c>
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"

  # CSP (Content Security Policy) - adapter selon vos besoins
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.cirqueapp.ch https://jugglinglab.org; font-src 'self' data:;"
</IfModule>
```

### Étape 4 : Vérifier le Déploiement

Ouvrir le navigateur : https://cirqueapp.ch

**Vérifications** :
- [ ] La page d'accueil charge correctement
- [ ] Les images et styles sont chargés
- [ ] Le routage React fonctionne (naviguer entre pages)
- [ ] Les appels API fonctionnent (tester connexion)
- [ ] Pas d'erreurs dans la console navigateur (F12)

---

## 🗄️ Configuration Base de Données

### Vérification de la Connexion

```bash
# Sur le serveur
mysql -u cirque_user_prod -p cirque_app_prod

# Entrer le mot de passe
# Tester quelques requêtes
SHOW TABLES;
SELECT COUNT(*) FROM Utilisateurs;
SELECT * FROM Disciplines LIMIT 5;
EXIT;
```

### Backup Automatique (Recommandé)

Créer un script de backup : `backend/scripts/backup-db.sh`

```bash
#!/bin/bash
BACKUP_DIR="/home/utilisateur/backups/cirque-app"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cirque_app_prod"
DB_USER="cirque_user_prod"
DB_PASS="VOTRE_MOT_DE_PASSE"

mkdir -p $BACKUP_DIR

# Dump de la base
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Compression
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Garder seulement les 30 derniers backups
ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +31 | xargs rm -f

echo "✅ Backup terminé : backup_$DATE.sql.gz"
```

Rendre exécutable et configurer une cron job :

```bash
chmod +x backend/scripts/backup-db.sh

# Éditer crontab
crontab -e

# Ajouter (backup tous les jours à 3h du matin)
0 3 * * * /home/utilisateur/sites/api.cirqueapp.ch/backend/scripts/backup-db.sh
```

---

## 🔐 Variables d'Environnement

### Checklist des Variables

**Backend** (`.env`) :
- [x] `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- [x] `JWT_SECRET` (32+ caractères, aléatoire)
- [x] `NODE_ENV=production`
- [x] `PORT=4000`
- [x] `FRONTEND_URL` (URL complète avec https://)
- [x] `LOG_LEVEL=info`

**Frontend** (`.env.production`, intégré au build) :
- [x] `REACT_APP_API_URL=https://api.cirqueapp.ch`

### Sécurité des Variables

**⚠️ RÈGLES CRITIQUES** :
1. **JAMAIS commiter `.env` ou `.env.production`** dans Git
2. Utiliser des mots de passe forts (20+ caractères)
3. Changer tous les secrets par défaut
4. Permissions fichier : `chmod 600 .env`
5. Stocker une copie sécurisée hors serveur (gestionnaire de mots de passe)

---

## 🔒 Sécurité & SSL

### SSL/TLS (Let's Encrypt)

1. Dans Infomaniak Manager, aller dans **"Certificats SSL"**
2. Activer **Let's Encrypt** pour :
   - `cirqueapp.ch`
   - `www.cirqueapp.ch`
   - `api.cirqueapp.ch`
3. Le renouvellement est automatique (tous les 90 jours)

### Forcer HTTPS

Ajouter au début du `.htaccess` (frontend et backend) :

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Firewall & Ports

Sur Cloud Server Infomaniak :
1. Activer le firewall dans Infomaniak Manager
2. Autoriser uniquement :
   - Port 22 (SSH) - IP restreintes si possible
   - Port 80 (HTTP) - redirection vers HTTPS
   - Port 443 (HTTPS)
   - Port 3306 (MySQL) - localhost uniquement

### Headers de Sécurité

Déjà configurés dans :
- `backend/server.js` (Helmet.js)
- `.htaccess` (Apache headers)

Vérifier avec : https://securityheaders.com/?q=https://cirqueapp.ch

### Rate Limiting

Le backend utilise déjà `express-rate-limit` (voir `backend/server.js` lignes 70-80).

Configuration par défaut :
- 100 requêtes / 15 minutes par IP
- Augmenter si nécessaire pour usage intensif

---

## ✅ Tests Post-Déploiement

### Checklist de Validation

**Backend API** :
```bash
# Health check
curl https://api.cirqueapp.ch/api/health

# Disciplines (public)
curl https://api.cirqueapp.ch/api/disciplines

# Figures (public)
curl https://api.cirqueapp.ch/api/figures
```

**Frontend** :
- [ ] Page d'accueil charge (https://cirqueapp.ch)
- [ ] Inscription d'un nouvel utilisateur
- [ ] Connexion avec compte test
- [ ] Navigation entre pages
- [ ] Affichage du catalogue de figures
- [ ] Affichage du profil utilisateur
- [ ] Enregistrement d'une tentative d'entraînement
- [ ] Visualisation des statistiques

**Sécurité** :
- [ ] HTTPS actif (cadenas vert)
- [ ] Redirect HTTP → HTTPS fonctionne
- [ ] Headers de sécurité présents (F12 > Network > Headers)
- [ ] Pas d'erreurs CORS
- [ ] JWT fonctionne (login/logout)

**Performance** :
- [ ] Time to First Byte (TTFB) < 500ms
- [ ] Page Load < 2s
- [ ] API responses < 200ms (hors 1ère génération JugglingLab)
- [ ] Images optimisées (WebP si possible)

**SEO & Accessibilité** (pour future optimisation) :
- [ ] Lighthouse score > 80
- [ ] Meta tags présents
- [ ] Sitemap.xml généré

---

## 🔄 Maintenance & Mises à Jour

### Workflow de Mise à Jour

```bash
# 1. Sur votre machine locale
git pull origin main
# Faire vos modifications
git add .
git commit -m "Feature: nouvelle fonctionnalité"
git push origin main

# 2. Sur le serveur (via SSH)
ssh utilisateur@votreserveur.infomaniak.ch

# Backend
cd ~/sites/api.cirqueapp.ch/backend
git pull origin main
npm ci --production
pm2 restart cirque-app-backend

# Frontend
cd ~/sites/cirqueapp.ch
git pull origin main
cd frontend
npm ci
npm run build
cp -r build/* ../
```

### Migrations de Base de Données

Si vous ajoutez des colonnes ou tables :

```bash
cd ~/sites/api.cirqueapp.ch/backend

# Créer un backup AVANT migration
./scripts/backup-db.sh

# Appliquer les migrations SQL manuellement
mysql -u cirque_user_prod -p cirque_app_prod < migrations/004_nouvelle_migration.sql

# Ou utiliser le script de migration (à adapter pour MySQL)
node scripts/run-migrations.js
```

### Monitoring

**Logs Backend** :
```bash
pm2 logs cirque-app-backend
tail -f ~/sites/api.cirqueapp.ch/backend/logs/pm2-error.log
```

**Logs Apache** :
```bash
tail -f /var/log/apache2/error.log
tail -f /var/log/apache2/access.log
```

**Monitoring Infomaniak** :
- Utiliser le dashboard Infomaniak Manager
- Alertes de disponibilité (uptime monitoring)
- Métriques CPU/RAM/Disk

---

## 🐛 Troubleshooting

### Problème : Le backend ne démarre pas

**Symptômes** : `pm2 status` montre "errored" ou "stopped"

**Solutions** :
```bash
# Voir les logs d'erreur
pm2 logs cirque-app-backend --err

# Erreurs courantes :
# 1. Port 4000 déjà utilisé
lsof -i :4000  # Voir quel process utilise le port
kill -9 [PID]  # Tuer le process

# 2. Erreur de connexion MySQL
mysql -u cirque_user_prod -p  # Tester la connexion
# Vérifier DB_HOST, DB_USER, DB_PASSWORD dans .env

# 3. Module manquant
cd ~/sites/api.cirqueapp.ch/backend
npm ci --production
```

### Problème : CORS bloque les requêtes frontend

**Symptômes** : Erreur dans console navigateur "blocked by CORS policy"

**Solutions** :
1. Vérifier `FRONTEND_URL` dans `backend/.env`
2. Vérifier les patterns CORS dans `backend/server.js`
3. S'assurer que le domaine frontend est bien dans `allowedPatterns`

```javascript
// backend/server.js - Ajouter votre domaine
const allowedPatterns = [
  // ... existant
  /^https:\/\/cirqueapp\.ch$/,  // AJOUTER CETTE LIGNE
];
```

4. Redémarrer : `pm2 restart cirque-app-backend`

### Problème : Frontend affiche page blanche

**Symptômes** : Page blanche, erreur dans console "Unexpected token <"

**Solutions** :
1. Vérifier que `frontend/build/` a été correctement uploadé
2. Vérifier le `.htaccess` pour React Router
3. Vérifier les permissions :
   ```bash
   chmod -R 755 ~/sites/cirqueapp.ch
   ```
4. Vérifier que `index.html` existe à la racine
5. Voir les logs Apache pour erreurs 404/500

### Problème : Les appels API retournent 404

**Symptômes** : Frontend charge mais API ne répond pas

**Solutions** :
1. Tester l'API directement :
   ```bash
   curl https://api.cirqueapp.ch/api/health
   ```
2. Vérifier le reverse proxy Apache (`.htaccess`)
3. Vérifier que PM2 tourne :
   ```bash
   pm2 status
   pm2 restart cirque-app-backend
   ```
4. Vérifier `REACT_APP_API_URL` dans le build frontend

### Problème : Base de données vide après déploiement

**Symptômes** : Aucune discipline/figure n'apparaît

**Solutions** :
```bash
cd ~/sites/api.cirqueapp.ch/backend
npm run reset-and-seed
```

**⚠️ ATTENTION** : Cela efface toutes les données ! En production, utiliser plutôt :
```bash
node seed/index.js  # Seed uniquement (sans reset)
```

### Problème : PM2 ne démarre pas au boot

**Solutions** :
```bash
# Régénérer le script de démarrage
pm2 unstartup
pm2 startup
# Copier-coller la commande affichée

# Sauvegarder la config actuelle
pm2 save
```

### Problème : Certificat SSL invalide

**Symptômes** : Avertissement "Connexion non sécurisée"

**Solutions** :
1. Vérifier l'activation Let's Encrypt dans Infomaniak Manager
2. Attendre 10-15 minutes après activation
3. Renouveler manuellement si nécessaire
4. Contacter le support Infomaniak si le problème persiste

---

## 📚 Ressources & Support

### Documentation Infomaniak
- [Node.js Hosting](https://www.infomaniak.com/en/hosting/nodejs-hosting)
- [Create a Node.js Site at Infomaniak](https://www.infomaniak.com/en/support/faq/2537/create-a-nodejs-site-at-infomaniak)
- [Install Node.js on Cloud Server](https://www.infomaniak.com/en/support/faq/2052/install-nodejs-on-cloud-server)
- [Managed Cloud Server](https://www.infomaniak.com/en/hosting/managed-cloud-server)

### Documentation Projet
- [README.md](../README.md) - Vue d'ensemble du projet
- [DOCKER.md](DOCKER.md) - Déploiement Docker (alternative)
- [API_DOCUMENTATION.md](../backend/docs/API_DOCUMENTATION.md) - Référence API
- [SECURITY.md](SECURITY.md) - Architecture de sécurité

### Support
- **Infomaniak Support** : https://www.infomaniak.com/fr/support
- **Issues GitHub** : [Créer une issue](https://github.com/votre-compte/cirque-app/issues)

---

## 🎉 Déploiement Réussi !

Une fois toutes les étapes complétées :

- ✅ Backend Node.js opérationnel sur `https://api.cirqueapp.ch`
- ✅ Frontend React déployé sur `https://cirqueapp.ch`
- ✅ Base de données MySQL initialisée et peuplée
- ✅ SSL/HTTPS activé
- ✅ PM2 configuré pour auto-restart
- ✅ Backups automatiques planifiés
- ✅ Monitoring en place

**Prochaines étapes** (optionnel) :
- Configurer les analytics (Google Analytics, Matomo)
- Mettre en place un monitoring avancé (Sentry, LogRocket)
- Optimiser les performances (CDN, caching avancé)
- Configurer un CI/CD (GitHub Actions)

**Bon courage pour votre déploiement !** 🚀
