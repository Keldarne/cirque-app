# Structure du Projet - Cirque App

Guide rapide pour naviguer dans le codebase.

---

## 📁 Architecture Globale

```
cirque-app/
├── backend/
│   ├── models/          # Sequelize models (20+ fichiers)
│   ├── routes/          # Express routes (API REST)
│   ├── services/        # Business logic layer
│   ├── middleware/      # Auth, validation, context injection
│   ├── migrations/      # DB migrations (6 fichiers Phase 2)
│   └── seed/            # Seed data (multi-tenant)
├── frontend/
│   └── src/
│       ├── pages/       # React pages par rôle
│       ├── components/  # Composants réutilisables
│       ├── contexts/    # React Context (Auth, Ecole)
│       └── utils/       # Utilities (memoryDecay.js)
└── docs/                # Documentation
```

---

## 🗄️ Base de Données (Sequelize + MySQL)

### Modèles Principaux

**Core:**
- `Ecole` - Multi-tenant root
- `Utilisateur` - Users (admin, professeur, eleve)
- `Discipline` - Catégories (Acrobatie, Balles, etc.)
- `Figure` - Tricks/figures
- `EtapeProgression` - Steps d'une figure (structure)
- `ProgressionEtape` - User's progress on individual steps (source of truth)

**Prof-Élève:**
- `RelationProfEleve` - Teacher-student relationships
- `Groupe` - Classes/groups
- `GroupeEleve` - Group membership

**Gamification:**
- `Badge` - Achievements
- `BadgeUtilisateur` - User badges earned
- `Titre` - Titles (Apprenti, Maître, etc.)
- `TitreUtilisateur` - User titles
- `Defi` - Challenges
- `DefiUtilisateur` - User challenges
- `Streak` - Daily streak tracking

**Phase 2 - Stats Avancées:**
- `InteractionProfEleve` - Teacher-student interactions (view, comment, validate, message)
- `TentativeEtape` - Attempt tracking (success/failure) linked to ProgressionEtape
- Fields: `lateralite` (ProgressionEtape), `lateralite_requise` (Figure), `seuil_echecs_critique` (EtapeProgression)

**Architecture Progression Refactorisée:**
- **Figure** → hasMany → **EtapeProgression** (structure des étapes définies)
- **Utilisateur** + **EtapeProgression** → **ProgressionEtape** (état utilisateur sur étape)
- **ProgressionEtape** → hasMany → **TentativeEtape** (historique tentatives)

**Flow:**
1. Une Figure a plusieurs EtapeProgression (structure)
2. Un Utilisateur peut avoir une ProgressionEtape par EtapeProgression (état)
3. Chaque ProgressionEtape peut avoir plusieurs TentativeEtape (historique)

### Fichier Central
`models/index.js` - Définit toutes les relations Sequelize

---

## 🛣️ Routes API (Express)

### Structure
```
routes/
├── index.js                    # Router principal
├── utilisateurs.js             # Auth, login, register, profile
├── figures.js                  # CRUD figures
├── disciplines.js              # CRUD disciplines
├── progression.js              # Progress tracking + Phase 2 endpoints
├── gamification.js             # Badges, titres, défis, streaks
├── statistiques.js             # Stats publiques
├── admin/                      # Admin routes
│   ├── index.js
│   ├── figures.js
│   └── disciplines.js
└── prof/                       # Prof routes
    ├── index.js
    ├── invitations.js          # Invite students
    ├── eleves.js               # Manage students
    ├── groupes.js              # Manage groups
    └── statistiques.js         # Phase 2: neglected students, engagement
```

### Endpoints Clés Phase 2

**Progression (tentatives/grit):**
- `POST /api/progression/:progressionId/etapes/:etapeId/tenter` - Record attempt
- `GET /api/progression/grit-score` - Get user's grit score
- `GET /api/progression/:progressionId/etapes/:etapeId/tentatives` - Attempt history

**Latéralité:**
- `POST /api/progression/:progressionId/etapes/:etapeId/valider` - Body: `{ cote: 'gauche'|'droite'|'bilateral' }`

**Prof Stats:**
- `GET /api/prof/statistiques/eleves-negliges?seuil_jours=30` - Neglected students
- `GET /api/prof/statistiques/engagement` - Engagement stats
- `GET /api/prof/statistiques/interactions/:eleveId` - Interaction history

---

## 🧩 Services (Business Logic)

`services/`
- `StatsService.js` - XP dynamique, KPIs
- `InteractionService.js` - Neglected students detection
- `TentativeService.js` - Grit score calculation, attempt tracking

---

## 🔐 Middleware

`middleware/`
- `auth.js` - JWT verification, role checks
  - `verifierToken` - Require authentication
  - `estProfesseurOuAdmin` - Require prof/admin role
  - `estAdmin` - Require admin role
- `injecterContexteEcole.js` - Inject school context into req

---

## 🌱 Seed System

`seed/`
- `index.js` - Orchestrator
- `modules/`
  - `seedEcoles.js` - 2 test schools
  - `seedCataloguePublic.js` - Disciplines, figures, badges, titres
  - `seedUtilisateurs.js` - Admin, profs, students
  - `seedRelations.js` - Prof-student relationships + groups
  - `seedInteractions.js` - Phase 2: fake interactions
  - `seedTentatives.js` - Phase 2: fake attempts (grit scenarios)
- `data/`
  - `figures.js` - 50+ figures (3 with bilateral laterality)
  - `disciplines.js` - 13 disciplines
  - `scenarios.js` - Test scenarios (at_risk, stable, etc.)

### Exécution
```bash
npm run seed  # Full seed
```

---

## 🎨 Frontend (React)

### Pages par Rôle

**Public:**
- `LoginPage.js` - Authentication
- `RegisterPage.js` - Registration

**Élève:**
- `MonProgrammePage.js` - Student's program
- `FigureDetailPage.js` - Figure detail + validation
- `ProfilPage.js` - User profile
- `DisciplinesPage.js` - Browse disciplines

**Professeur:**
- `DashboardProfPage.js` - Prof dashboard
- `MesElevesPage.js` - Manage students
- `GestionGroupesPage.js` - Manage groups
- `InvitationsPage.js` - Invite students

**Admin:**
- `AdminPage.js` - Admin dashboard
- `AdminFiguresPage.js` - Manage all figures
- `AdminDisciplinesPage.js` - Manage disciplines

### Utilities Phase 2
`frontend/src/utils/memoryDecay.js` - Memory decay calculation (frontend-only)

---

## 🔑 Authentification

**JWT Flow:**
1. Login: `POST /api/login` → Returns JWT token
2. Store in `localStorage`
3. All requests: `Authorization: Bearer <token>`
4. Frontend: `AuthContext` manages auth state

**Roles:**
- `admin` - Full access
- `professeur` - Manage students, create figures
- `eleve` - Own progress only

---

## 🏫 Multi-Tenant

**Row-Level Security:**
- Chaque école a `ecole_id`
- Middleware `injecterContexteEcole` filtre automatiquement
- Admin global: `ecole_id = NULL`

**Isolation:**
- Figures, badges, titres: peuvent être publics (catalogue) ou école-specific
- Utilisateurs: toujours liés à une école (sauf admin global + solo users)

---

## 📊 Phase 2 - Features Implémentées

### 1. Latéralité (Bilateral Validation)
**Files:** `migrations/001-add-laterality.js`, `models/Figure.js`, `models/EtapeUtilisateur.js`
**Logic:** `routes/progression.js:261-398`
**XP Split:** 50% per side

### 2. Grit Score (Persévérance)
**Files:** `migrations/003-add-tentatives-etapes.js`, `models/TentativeEtape.js`, `services/TentativeService.js`
**Logic:** `routes/progression.js:410-549`
**Bonus XP:** 3 échecs=+10%, 5=+20%, 10=+50%

### 3. Memory Decay
**Files:** `frontend/src/utils/memoryDecay.js`
**Logic:** Frontend-only, pure CSS/JS
**Timeline:** 0-30d=Fresh, 30-90d=Warning, 90-180d=Critical, 180+d=Forgotten

### 4. Élèves Négligés
**Files:** `migrations/002-add-interactions-prof-eleve.js`, `models/InteractionProfEleve.js`, `services/InteractionService.js`
**Logic:** `routes/prof/statistiques.js:102-183`
**Alerts:** 30d=Warning, 60d=Critical

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run db:reset    # Reset + migrate + seed
npm run dev         # Start server (port 5000)
```

### Frontend
```bash
cd frontend
npm install
npm start           # Start React (port 3000)
```

### Test Accounts
See `docs/COMPTES.md`

---

## 📖 Documentation

- `COMPTES.md` - Test accounts + API examples
- `STRUCTURE.md` - This file (architecture overview)
- `FEATURES.md` - Features list + implementation status
- `SECURITE.md` - Security patterns + best practices
- `TESTS.md` - Testing guide

---

## 🔍 Navigation Rapide

**Chercher un endpoint:** `routes/`
**Chercher une table DB:** `models/`
**Chercher business logic:** `services/`
**Chercher une page React:** `frontend/src/pages/`
**Seed data:** `seed/data/` et `seed/modules/`
