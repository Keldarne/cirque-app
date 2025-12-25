# Cirque App - Application de Gestion de Figures de Cirque

Application full-stack pour la gestion et l'apprentissage de figures de cirque avec système de progression.

## Architecture

### Backend (Node.js + Express + MySQL)
- **Port**: 4000
- **Base de données**: MySQL
- **ORM**: Sequelize
- **Authentification**: JWT

### Frontend (React)
- **Port**: 3000 (dev)
- **UI**: Material-UI
- **Routing**: React Router

## Installation

### Prérequis
- Node.js (v14+)
- MySQL (v8+)
- npm ou yarn

### Configuration Backend
```bash
# Installer les dépendances
npm install

# Créer le fichier .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=cirque_app
JWT_SECRET=votre_cle_secrete_production

# Initialiser la base de données
node utilitaires-reset-db.js
node utilitaires-seed-data.js

# Lancer le serveur
node server.js
```

### Configuration Frontend
```bash
cd frontend
npm install
npm start
```

## Tests de Sécurité

### Lancer les Tests

```bash
# Tous les tests de sécurité
npm run test:security

# Tests spécifiques
npm run test:auth          # Authentification uniquement
npm run test:figures       # Permissions figures
npm run test:disciplines   # Permissions disciplines

# Avec coverage
npm test
```

### Avant de Lancer les Tests

**IMPORTANT**: Toujours remonter la DB avant de lancer les tests:

```bash
npm run reset-and-seed
npm run test:security
```

### Résultats Attendus

- **48 tests** au total
- **100% de réussite** si tout fonctionne correctement
- Tests d'authentification, permissions figures et disciplines

Pour plus de détails, voir [README-TESTS-SECURITE.md](README-TESTS-SECURITE.md)

## Scripts Utilitaires

### `utilitaires-reset-db.js`
Réinitialise complètement la base de données (supprime toutes les tables et les recrée).

**Utilisation:**
```bash
node utilitaires-reset-db.js
```

⚠️ **Attention**: Cette commande supprime TOUTES les données existantes!

### `utilitaires-seed-data.js`
Insère des données de test dans la base de données (utilisateurs, disciplines, figures).

**Utilisation:**
```bash
node utilitaires-seed-data.js
```

**Données créées:**
- 3 utilisateurs (admin1, prof1, user1)
- 21 disciplines de cirque
- 15 figures avec leurs étapes de progression

### `utilitaires-create-admin.js`
Crée un nouvel utilisateur administrateur.

**Utilisation:**
```bash
node utilitaires-create-admin.js
```

Script interactif qui demande:
- Pseudo
- Email
- Mot de passe

## Système de Permissions

### Rôles

#### 👤 **Utilisateur Standard** (`standard`)
- Voir toutes les disciplines et figures
- Créer et gérer son programme d'entraînement
- Valider des étapes de progression
- Pas d'accès à la page Administration

#### 👨‍🏫 **Professeur** (`professeur`)
- Toutes les permissions d'un utilisateur standard
- Accès à la page Administration
- Créer de nouvelles figures
- **Modifier/supprimer uniquement ses propres figures**
- Ne peut PAS gérer les disciplines

#### 👑 **Administrateur** (`admin`)
- Toutes les permissions
- Créer/modifier/supprimer toutes les disciplines
- Modifier/supprimer toutes les figures (même celles des autres)
- Contrôle total de l'application

### Comptes de Test

Voir [README-COMPTES.md](README-COMPTES.md) pour les détails des comptes de test.

**Résumé:**
- **Admin**: admin1@example.com / admin123
- **Professeur**: prof1@example.com / prof123
- **Utilisateur**: user1@example.com / user123

## Documentation

### [README-PERMISSIONS.md](README-PERMISSIONS.md)
Détaille le système de permissions pour les professeurs:
- Filtrage frontend/backend
- Middleware d'autorisation
- Protection double couche
- Exemples de scénarios de test

### [README-PROGRESSION.md](README-PROGRESSION.md)
Explique le système de progression des utilisateurs:
- Étapes d'apprentissage
- Validation des étapes
- Calcul de l'XP
- Progression par figure

## Structure du Projet

```
cirque-app/
├── backend/
│   ├── models/          # Modèles Sequelize
│   ├── routes/          # Routes API
│   ├── middleware/      # Middlewares (auth, etc.)
│   ├── migrations/      # Migrations de DB
│   ├── db.js           # Configuration Sequelize
│   └── server.js       # Point d'entrée backend
├── frontend/
│   └── src/
│       ├── components/  # Composants React
│       ├── pages/       # Pages de l'application
│       ├── contexts/    # Contexts React (Auth, etc.)
│       ├── hooks/       # Custom hooks
│       └── utils/       # Utilitaires
├── utilitaires-*.js    # Scripts utilitaires
└── README-*.md         # Documentation
```

## API Endpoints

### Routes Publiques
- `GET /figures` - Liste des figures
- `GET /figures/:id` - Détail d'une figure
- `GET /figures/:id/etapes` - Étapes d'une figure
- `GET /disciplines` - Liste des disciplines

### Routes Authentifiées
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /auth/me` - Profil utilisateur

### Routes Admin (professeur + admin)
- `POST /admin/figures` - Créer une figure
- `PUT /admin/figures/:id` - Modifier une figure (créateur ou admin)
- `DELETE /admin/figures/:id` - Supprimer une figure (créateur ou admin)

### Routes Admin (admin uniquement)
- `POST /admin/disciplines` - Créer une discipline
- `PUT /admin/disciplines/:id` - Modifier une discipline
- `DELETE /admin/disciplines/:id` - Supprimer une discipline

## Sécurité

### Double Protection
Les opérations sensibles sont protégées à deux niveaux:

1. **Frontend**: Filtrage de l'affichage pour une meilleure UX
2. **Backend**: Vérification des permissions via middleware

Exemple: Un professeur ne voit que ses propres figures dans l'interface, mais même s'il tentait de modifier une autre figure via l'API, le backend refuserait la requête (erreur 403).

### Middleware d'Authentification
- `verifierToken` - Vérifie le JWT
- `estProfesseurOuAdmin` - Vérifie le rôle professeur/admin
- `estAdmin` - Vérifie le rôle admin uniquement
- `peutModifierFigure` - Vérifie que l'utilisateur peut modifier une figure

## Développement

### Lancer l'application en mode développement

**Terminal 1 - Backend:**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Réinitialiser les données de test
```bash
node utilitaires-reset-db.js && node utilitaires-seed-data.js
```

## Technologies Utilisées

### Backend
- Express.js - Framework web
- Sequelize - ORM
- MySQL2 - Driver MySQL
- jsonwebtoken - Authentification JWT
- bcrypt - Hachage des mots de passe
- dotenv - Variables d'environnement
- cors - Cross-Origin Resource Sharing

### Frontend
- React - Bibliothèque UI
- React Router - Routing
- Material-UI - Composants UI
- Axios - Requêtes HTTP (via api.js)

## Contribution

Pour contribuer au projet:
1. Respecter le système de permissions
2. Tester avec les 3 types de comptes
3. Vérifier la double protection (frontend + backend)
4. Commenter le code selon les standards établis

## Support

Pour toute question sur:
- Les comptes de test: voir [README-COMPTES.md](README-COMPTES.md)
- Les permissions: voir [README-PERMISSIONS.md](README-PERMISSIONS.md)
- La progression: voir [README-PROGRESSION.md](README-PROGRESSION.md)
