# Docker Setup Guide - Cirque App

Ce guide explique comment utiliser Docker pour développer Cirque App sur n'importe quelle plateforme (Windows, Mac, Linux).

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé
- Git installé

## Architecture Docker

```
┌─────────────────────────────────────────────────┐
│  Docker Compose                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────┐│
│  │  Frontend    │  │   Backend    │  │ MySQL ││
│  │  React:3000  │→ │  Node:4000   │→ │ :3306 ││
│  │              │  │              │  │       ││
│  │  Hot-reload  │  │  Nodemon     │  │ Volume││
│  └──────────────┘  └──────────────┘  └───────┘│
│                                                 │
└─────────────────────────────────────────────────┘
```

## Démarrage Rapide

### 1. Premier Lancement (PC ou Mac)

```bash
# Cloner le projet
git clone <votre-repo>
cd cirque-app

# Démarrer tous les services (DB + Backend + Frontend)
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f
```

Attendez environ 30-60 secondes que :
- MySQL démarre et soit "healthy"
- Le backend réinitialise et seed la base de données
- Le frontend compile

Ensuite, ouvrez votre navigateur :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:4000

### 🌐 Accès Réseau Local

Le frontend est accessible depuis **tout le réseau local** :
- Sur votre PC : http://localhost:3000
- Depuis un autre appareil : http://<VOTRE-IP>:3000

**Trouver votre IP locale** :
```bash
# Windows
ipconfig | findstr "IPv4"

# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Exemple : http://192.168.1.10:3000
```

**Note** : Assurez-vous que le pare-feu autorise le port 3000 et 4000.

### 2. Comptes de Test

Utilisez les comptes suivants pour vous connecter :

- **Admin** : `admin1@example.com` / `admin123`
- **Professeur** : `prof1@example.com` / `prof123`
- **Étudiant** : `user1@example.com` / `user123`

## Commandes Essentielles

### Gestion des Conteneurs

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs (tous les services)
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (reset DB complète)
docker-compose down -v

# Redémarrer un service spécifique
docker-compose restart backend
docker-compose restart frontend
```

### Reconstruction des Images

```bash
# Rebuild après modification des Dockerfiles ou package.json
docker-compose up -d --build

# Rebuild un service spécifique
docker-compose build backend
docker-compose build frontend

# Rebuild complet sans cache
docker-compose build --no-cache
```

### Accès aux Conteneurs

```bash
# Accéder au shell du backend
docker-compose exec backend sh

# Accéder au shell du frontend
docker-compose exec frontend sh

# Accéder à MySQL
docker-compose exec db mysql -u cirque_user -pcirque_pass_2024 cirque_app
```

## Développement avec Docker

### Hot-Reload Activé

Les volumes montés permettent le hot-reload automatique :

- **Backend** : Nodemon redémarre le serveur à chaque modification de fichier `.js`
- **Frontend** : React dev server recompile à chaque modification

Éditez vos fichiers localement, les changements sont reflétés instantanément dans les conteneurs.

### Exécuter des Commandes dans les Conteneurs

```bash
# Reset et reseed la base de données
docker-compose exec backend npm run reset-and-seed

# Lancer les tests backend
docker-compose exec backend npm test

# Lancer les tests de sécurité
docker-compose exec backend npm run test:security

# Installer une nouvelle dépendance backend
docker-compose exec backend npm install <package-name>

# Installer une nouvelle dépendance frontend
docker-compose exec frontend npm install <package-name>
```

### Déboguer les Problèmes

```bash
# Vérifier l'état de santé de MySQL
docker-compose exec db mysqladmin ping -h localhost -u root -pcirque_root_2024

# Vérifier les connexions réseau
docker-compose exec backend ping db

# Inspecter les variables d'environnement
docker-compose exec backend env | grep DB_

# Vérifier les processus en cours
docker-compose ps
```

## Workflow Multi-Plateformes (PC ↔ Mac)

### Sur votre PC Windows

```bash
cd C:\Users\Joseph\CIRQUE-APP\cirque-app
docker-compose up -d
```

### Sur votre Mac

```bash
cd ~/Projects/cirque-app
docker-compose up -d
```

**Les deux environnements sont identiques !** Pas de configuration différente, pas de problème de versions Node.js ou MySQL.

### Synchronisation via Git

```bash
# Sur PC : Commit et push vos changements
git add .
git commit -m "Feature XYZ"
git push origin main

# Sur Mac : Pull et redémarrez
git pull origin main
docker-compose restart backend frontend
```

## Configuration Avancée

### Modifier les Variables d'Environnement

Éditez `.env.docker` pour changer :
- Mots de passe MySQL
- JWT secret
- Timezone
- etc.

Puis redémarrez :
```bash
docker-compose down
docker-compose up -d
```

### Changer les Ports

Si les ports 3000, 4000 ou 3306 sont déjà utilisés, modifiez `docker-compose.yml` :

```yaml
services:
  backend:
    ports:
      - "4001:4000"  # Hôte:Container
```

### Persistance des Données

La base de données MySQL utilise un volume Docker nommé `mysql_data`. Les données survivent aux redémarrages :

```bash
# Voir les volumes
docker volume ls

# Inspecter le volume
docker volume inspect cirque-app_mysql_data

# Supprimer le volume (⚠️ perte de données)
docker-compose down -v
```

## Production

Pour un déploiement production, créez un `docker-compose.prod.yml` :

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      # Utilisez des secrets plus robustes
    restart: always
    # Pas de volumes montés en production

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod  # Créer ce fichier avec build multi-stage
    restart: always
```

## Dépannage

### Le backend ne se connecte pas à MySQL

```bash
# Vérifier que MySQL est "healthy"
docker-compose ps

# Attendre que le healthcheck passe
docker-compose logs db

# Forcer un redémarrage
docker-compose restart db
sleep 10
docker-compose restart backend
```

### Le frontend ne se connecte pas au backend

Vérifiez que :
1. Le backend est démarré : `docker-compose logs backend`
2. Le proxy est configuré dans `frontend/package.json` : `"proxy": "http://localhost:4000"`
3. CORS est configuré dans `backend/server.js`

### Les modifications ne sont pas reflétées

```bash
# Rebuild les images
docker-compose up -d --build

# Si ça persiste, nettoyage complet
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

### Erreur "port already allocated"

Un autre processus utilise le port. Trouvez et arrêtez-le :

**Windows** :
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux** :
```bash
lsof -ti:3000 | xargs kill -9
```

Ou changez le port dans `docker-compose.yml`.

## Ressources

- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Troubleshooting Docker](https://docs.docker.com/config/daemon/)

## Comparaison : Docker vs Local

| Aspect | Docker | Local (npm) |
|--------|--------|-------------|
| Setup initial | 1 commande | 3+ étapes (Node, MySQL, config) |
| Portabilité PC↔Mac | ✅ Identique | ❌ Config différente |
| Isolation | ✅ Complet | ❌ Conflits possibles |
| Performance | ⚠️ Légèrement plus lent | ✅ Natif |
| Hot-reload | ✅ Fonctionne | ✅ Fonctionne |
| Debugging | ⚠️ Plus complexe | ✅ Simple |

**Recommandation** : Utilisez Docker pour la portabilité et la cohérence entre environnements.
