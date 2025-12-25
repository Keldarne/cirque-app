# Frontend - Cirque App

> **Zone de travail de Gemini** - Interface React pour l'application de gestion de figures de cirque

## 🎯 Responsabilités Frontend

Ce dossier contient l'interface utilisateur React de Cirque App, développée par **Gemini**.

### Architecture Frontend

- **Framework**: React 18+
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Port de développement**: 3000

## 📡 Communication avec le Backend

Le backend (développé par Claude) expose une API REST sur le port **4000**.

### Configuration API

```javascript
// src/utils/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
```

### Documentation API

Consulter les fichiers suivants dans le dossier racine:
- **`API_DOCUMENTATION.md`**: Documentation complète des endpoints
- **`INTEGRATION_LOG.md`**: Journal des changements backend impactant le frontend
- **`CLAUDE.md`**: Guide technique du backend

## 🚀 Installation et Démarrage

```bash
# Installer les dépendances
cd frontend
npm install

# Lancer le serveur de développement
npm start

# Build de production
npm run build
```

## 📁 Structure Attendue

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/        # Composants réutilisables
│   ├── pages/            # Pages de l'application
│   ├── contexts/         # Context API (Auth, etc.)
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilitaires (api.js, etc.)
│   ├── App.js            # Composant racine
│   └── index.js          # Point d'entrée
├── package.json
└── README.md
```

## 🔐 Authentification

Le système utilise JWT (JSON Web Tokens).

### Flow d'authentification

1. **Login**: `POST /api/auth/login` → Retourne `{ token, utilisateur }`
2. **Stockage**: Sauvegarder le token dans `localStorage`
3. **Requêtes**: Inclure le header `Authorization: Bearer <token>`
4. **Vérification**: `GET /api/auth/me` pour récupérer l'utilisateur actuel

## 📱 Pages Principales

### Pages Publiques
- **Accueil** (`/`)
- **Catalogue Disciplines** (`/disciplines`)
- **Catalogue Figures** (`/figures`)
- **Login** (`/login`)
- **Inscription** (`/register`)

### Pages Authentifiées
- **Dashboard** (`/dashboard`)
- **Ma Progression** (`/progression`)
- **Mon Programme** (`/programme`)
- **Entraînement** (`/entrainement`)
- **Statistiques** (`/stats`)

### Pages Professeur
- **Mes Élèves** (`/prof/eleves`)
- **Mes Programmes** (`/prof/programmes`)
- **Créer Figure** (`/prof/figures/nouveau`)

### Pages Admin
- **Gestion Disciplines** (`/admin/disciplines`)
- **Gestion Figures** (`/admin/figures`)

## 🔄 Système de Partage

Le backend supporte le partage polymorphique peer-to-peer.

### Endpoints Partage

```javascript
// Voir programmes partagés
GET /api/progression/partages

// Accepter un partage
POST /api/progression/partages/:id/accepter

// Refuser un partage
POST /api/progression/partages/:id/refuser

// Détacher un programme
POST /api/progression/programmes/:id/detacher

// Partager avec un pair
POST /api/progression/programmes/:id/partager
```

## 📊 Gamification

- **XP et Niveaux**: `utilisateur.xp`
- **Badges**: `GET /api/gamification/badges/utilisateur/:id`
- **Titres**: `GET /api/gamification/titres/utilisateur/:id`
- **Streaks**: `GET /api/gamification/streaks/utilisateur/:id`

## 🔗 Ressources Backend

- **`INTEGRATION_LOG.md`**: Changements d'API
- **`API_DOCUMENTATION.md`**: Référence endpoints
- **`CLAUDE.md`**: Architecture backend

### Comptes de Test

- **Admin**: admin1@example.com / admin123
- **Professeur**: prof1@example.com / prof123
- **Élève**: user1@example.com / user123

## 🤝 Collaboration Claude ↔️ Gemini

- **Gemini**: Développe le frontend dans ce dossier
- **Claude**: Développe le backend à la racine
- **Communication**: Via `INTEGRATION_LOG.md`

---

**Bonne chance Gemini! 🚀**
