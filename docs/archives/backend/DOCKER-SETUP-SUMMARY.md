# 📦 Configuration Docker - Résumé

Cette configuration Docker complète a été ajoutée à votre projet Cirque App pour faciliter le développement multi-plateformes (PC Windows ↔ Mac).

## 🆕 Fichiers Ajoutés

### Configuration Docker
- **`docker-compose.yml`** - Orchestration de 3 services (MySQL + Backend + Frontend)
- **`.env.docker`** - Variables d'environnement Docker
- **`.dockerignore`** - Exclut les fichiers inutiles des builds
- **`backend/Dockerfile`** - Image Docker backend (mis à jour)
- **`frontend/Dockerfile`** - Image Docker frontend (mis à jour)
- **`backend/nodemon.json`** - Configuration hot-reload backend

### Documentation
- **`DOCKER.md`** - Guide complet Docker (troubleshooting, commandes avancées)
- **`README-DOCKER-QUICKSTART.md`** - Quick start simplifié
- **`DOCKER-SETUP-SUMMARY.md`** - Ce fichier

### Utilitaires
- **`Makefile`** - Commandes simplifiées (`make up`, `make down`, etc.)
- **`docker-helper.sh`** - Script bash interactif pour gérer Docker

### Modifications
- **`backend/package.json`** - Ajout de `nodemon` et script `npm run dev`
- **`CLAUDE.md`** - Ajout section Docker dans Quick Start
- **`.gitignore`** - Ajout exclusions Docker

## 🚀 Utilisation Immédiate

### Option 1 : Docker Compose (Recommandé)

```bash
# Démarrer tout
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Option 2 : Avec Makefile (Plus simple)

```bash
make up          # Démarrer
make logs        # Voir les logs
make down        # Arrêter
make reset       # Reset DB
make test        # Lancer les tests
```

### Option 3 : Script Helper (Interactif)

```bash
./docker-helper.sh install   # Premier setup
./docker-helper.sh start     # Démarrer
./docker-helper.sh logs      # Logs
./docker-helper.sh stop      # Arrêter
```

## 🎯 Avantages de Cette Configuration

### ✅ Portabilité PC ↔ Mac
- **Avant** : Installer Node.js, MySQL, configurer les chemins différents, gérer les versions
- **Après** : 1 seule commande identique sur PC et Mac

### ✅ Isolation Complète
- Pas de conflits avec d'autres projets Node.js
- Pas besoin d'installer MySQL localement
- Versions fixes (Node 18, MySQL 8.0)

### ✅ Hot-Reload Activé
- Backend : Nodemon redémarre automatiquement à chaque modification
- Frontend : React dev server recompile en temps réel
- Modifications reflétées instantanément

### ✅ Environnement Identique
- Même configuration dev/test/prod
- Pas de "ça marche sur ma machine"
- Facile à partager avec l'équipe

### ✅ Base de Données Persistante
- Volume Docker conserve les données entre redémarrages
- Reset rapide avec `docker-compose down -v`
- Backup/restore simplifié

## 📊 Architecture Docker

```
┌─────────────────────────────────────────────────┐
│              Docker Compose                     │
│                                                 │
│  Network: cirque-network                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────┐  ┌────────────────┐        │
│  │   Frontend     │  │    Backend     │        │
│  │   (React)      │  │   (Node.js)    │        │
│  │   Port: 3000   │→ │   Port: 4000   │        │
│  │                │  │                │        │
│  │  - Hot reload  │  │  - Nodemon     │        │
│  │  - Volume src/ │  │  - Volume src/ │        │
│  └────────────────┘  └───────┬────────┘        │
│                              │                  │
│                              ↓                  │
│                     ┌────────────────┐          │
│                     │     MySQL      │          │
│                     │   Port: 3306   │          │
│                     │                │          │
│                     │ Volume persist │          │
│                     └────────────────┘          │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 🔧 Configuration Réseau

- **Frontend** : http://localhost:3000 (exposé sur l'hôte)
- **Backend** : http://localhost:4000 (exposé sur l'hôte)
- **MySQL** : localhost:3306 (exposé pour accès externe)
- **Réseau interne** : `cirque-network` (communication inter-containers)

## 💾 Volumes Docker

1. **`mysql_data`** : Données MySQL persistantes
   - Survit aux `docker-compose down`
   - Supprimé par `docker-compose down -v`

2. **Bind mounts** :
   - `./backend:/app` - Code backend monté
   - `./frontend:/app` - Code frontend monté
   - `/app/node_modules` - Anonyme (évite conflits Win/Mac)

## 🛠️ Workflow de Développement

### Développement Local
```bash
# 1. Démarrer l'environnement
docker-compose up -d

# 2. Éditer le code localement (VS Code, etc.)
# Les changements sont automatiquement détectés

# 3. Voir les logs si besoin
docker-compose logs -f backend

# 4. Arrêter quand terminé
docker-compose down
```

### Passage PC → Mac (ou inverse)
```bash
# Sur PC
git add .
git commit -m "Feature XYZ"
git push

# Sur Mac
git pull
docker-compose restart  # Redémarrage rapide
# OU
docker-compose up -d --build  # Si package.json modifié
```

### Debugging
```bash
# Accéder au shell backend
docker-compose exec backend sh

# Exécuter des commandes
docker-compose exec backend npm run reset-and-seed
docker-compose exec backend npm test

# Inspecter MySQL
docker-compose exec db mysql -u root -p
```

## 📚 Documentation Disponible

1. **[DOCKER.md](DOCKER.md)** - Guide complet
   - Toutes les commandes Docker
   - Troubleshooting détaillé
   - Configuration avancée
   - Production

2. **[README-DOCKER-QUICKSTART.md](README-DOCKER-QUICKSTART.md)** - Quick start
   - Setup en 3 commandes
   - Workflow PC/Mac
   - Dépannage rapide

3. **[CLAUDE.md](CLAUDE.md)** - Documentation projet
   - Section Docker ajoutée
   - Commandes essentielles
   - Architecture complète

## 🐛 Problèmes Fréquents

### Backend ne démarre pas
```bash
docker-compose logs db
# Attendre que MySQL soit "healthy"
docker-compose restart backend
```

### Port déjà utilisé
```bash
# Changer dans docker-compose.yml:
ports:
  - "4001:4000"  # Au lieu de 4000:4000
```

### Modifications non reflétées
```bash
docker-compose up -d --build
```

### Reset complet
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## 🎓 Commandes à Retenir

```bash
# Basiques
docker-compose up -d              # Démarrer
docker-compose down               # Arrêter
docker-compose logs -f            # Logs
docker-compose restart            # Redémarrer

# Utiles
docker-compose exec backend sh   # Shell backend
docker-compose ps                # État des services
docker-compose build             # Rebuild images

# Maintenance
docker-compose down -v           # Reset DB
docker system prune -a           # Nettoyer Docker
```

## 📈 Performance

- **Démarrage initial** : ~60 secondes (build images + seed DB)
- **Démarrage suivant** : ~10 secondes (containers existants)
- **Hot-reload backend** : ~1 seconde (Nodemon)
- **Hot-reload frontend** : ~2-3 secondes (React)

## 🔐 Sécurité

⚠️ **Important** : Les mots de passe dans `.env.docker` sont pour le **développement uniquement**.

Pour la production :
1. Créer `.env.production`
2. Utiliser des secrets forts
3. Ne jamais commit les secrets
4. Utiliser Docker secrets ou variables d'environnement sécurisées

## ✅ Checklist Mise en Route

- [ ] Docker Desktop installé
- [ ] Cloner le repo
- [ ] `docker-compose up -d`
- [ ] Attendre 60 secondes
- [ ] Ouvrir http://localhost:3000
- [ ] Se connecter avec `admin1@example.com` / `admin123`
- [ ] Tester les modifications hot-reload

## 🆘 Support

- Problèmes Docker : Voir [DOCKER.md](DOCKER.md) section Troubleshooting
- Questions architecture : Voir [CLAUDE.md](CLAUDE.md)
- Issues générales : README.md

---

**Prêt à développer sur PC et Mac avec le même environnement !** 🎉
