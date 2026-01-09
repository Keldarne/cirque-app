# 🚀 Docker Quick Start

**Setup ultra-rapide sur PC ou Mac** - Identique sur les deux plateformes !

## 1️⃣ Prérequis (une seule fois)

1. Installer [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Vérifier l'installation :
   ```bash
   docker --version
   docker-compose --version
   ```

## 2️⃣ Démarrage (3 commandes)

```bash
# Cloner le projet (si pas déjà fait)
git clone <votre-repo>
cd cirque-app

# Démarrer TOUT (MySQL + Backend + Frontend)
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

**Attendez 30-60 secondes** que tout démarre, puis :

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:4000

## 3️⃣ Se connecter

- **Admin** : `admin1@example.com` / `admin123`
- **Prof** : `prof1@example.com` / `prof123`
- **Étudiant** : `user1@example.com` / `user123`

---

## 🛠️ Commandes de Base

```bash
# Arrêter
docker-compose down

# Redémarrer
docker-compose restart

# Voir les logs d'un service
docker-compose logs -f backend
docker-compose logs -f frontend

# Reset complet (efface DB)
docker-compose down -v
docker-compose up -d
```

---

## 🎯 Workflow PC ↔ Mac

### Sur votre PC (Windows)
```bash
cd C:\Users\Joseph\CIRQUE-APP\cirque-app
docker-compose up -d
```

### Sur votre Mac
```bash
cd ~/Projects/cirque-app
docker-compose up -d
```

**C'est IDENTIQUE !** Pas de config MySQL différente, pas de versions Node.js différentes.

### Synchronisation Git

```bash
# PC : Faire des changements
git add .
git commit -m "Feature XYZ"
git push

# Mac : Récupérer
git pull
docker-compose restart
```

---

## 🔧 Commandes Avancées

### Accéder aux shells

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MySQL
docker-compose exec db mysql -u cirque_user -pcirque_pass_2024 cirque_app
```

### Exécuter des commandes

```bash
# Reset et reseed la DB
docker-compose exec backend npm run reset-and-seed

# Lancer les tests
docker-compose exec backend npm test

# Installer une nouvelle dépendance
docker-compose exec backend npm install <package>
```

### Rebuild après modifications

```bash
# Si vous modifiez package.json ou Dockerfile
docker-compose up -d --build
```

---

## 📁 Structure des Fichiers Docker

```
cirque-app/
├── docker-compose.yml       # Configuration principale
├── .env.docker             # Variables d'environnement
├── backend/
│   ├── Dockerfile          # Image backend
│   └── nodemon.json        # Config hot-reload
├── frontend/
│   └── Dockerfile          # Image frontend
├── scripts/
│   ├── docker-helper.sh    # Helper script (Mac/Linux)
│   └── docker-helper.ps1   # Helper script (Windows)
└── docs/
    ├── DOCKER.md           # Documentation complète
    └── DOCKER-QUICKSTART.md # Ce fichier
```

---

## 🐛 Dépannage Rapide

### Le backend ne démarre pas

```bash
docker-compose logs backend
# Vérifier que MySQL est "healthy"
docker-compose ps
```

### Port déjà utilisé (3000 ou 4000)

**Windows** :
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac** :
```bash
lsof -ti:3000 | xargs kill -9
```

### Tout recommencer à zéro

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

---

## 📚 Documentation Complète

- **[DOCKER.md](DOCKER.md)** - Guide complet avec troubleshooting
- **[CLAUDE.md](../CLAUDE.md)** - Architecture et commandes projet
- **[README.md](../README.md)** - Documentation générale

---

## ✅ Avantages Docker

| Aspect | Avec Docker | Sans Docker |
|--------|-------------|-------------|
| Setup PC | 1 commande | ~10 commandes |
| Setup Mac | 1 commande | ~10 commandes |
| Identique PC/Mac | ✅ Oui | ❌ Non |
| Conflits dépendances | ✅ Aucun | ❌ Possibles |
| Version MySQL | ✅ Auto | ❌ À installer |
| Version Node | ✅ Auto | ❌ À gérer |

**Recommandation** : Utilisez Docker pour la portabilité !
