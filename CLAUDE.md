# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Important File Organization Rule

**DO NOT create files at the project root unless absolutely necessary or explicitly requested by the user.**

When creating new files, always organize them in the appropriate subdirectory:
- **Documentation** → `docs/` (or `docs/archives/` for historical docs)
- **Scripts/utilities** → `scripts/` (or `backend/scripts/` for backend-specific)
- **Tests** → `backend/test/` or `frontend/src/`
- **Configuration** → Keep at root ONLY if required by the tool (e.g., `.gitignore`, `package.json`, `docker-compose.yml`)

**Exceptions** (files that MUST remain at root):
- `.gitignore`, `.dockerignore`, `.editorconfig`, `.env.docker`
- `package.json`, `package-lock.json`
- `docker-compose.yml`, `Makefile`
- `eslint.config.js`
- `README.md`, `CLAUDE.md`, `GEMINI.md` (primary documentation)

## Project Overview

**Cirque App** - Full-stack application for circus skill training management with progression tracking, multi-tenant architecture, and gamification features.

- **Backend**: Node.js + Express + MySQL/Sequelize (Port 4000)
- **Frontend**: React + Material-UI (Port 3000)
- **Database**: MySQL with Sequelize ORM
- **Auth**: JWT-based authentication
- **Architecture**: Monorepo (backend/ and frontend/ folders)

## Quick Start

### Option 1: Docker (Recommandé pour PC ↔ Mac)

```bash
# Démarrer tout (DB + Backend + Frontend)
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Accès:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:4000
```

**Voir [docs/DOCKER.md](docs/DOCKER.md) pour le guide complet Docker.**

### Option 2: Installation Locale

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure environment (create backend/.env from backend/.env.example)
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Initialize database
npm run reset-and-seed

# 4. Start development (run from root in separate terminals)
npm run start:backend   # Terminal 1: Backend on port 4000
npm run start:frontend  # Terminal 2: Frontend on port 3000
```

**Test Accounts** (see [docs/COMPTES_TEST.md](docs/COMPTES_TEST.md)):
- Admin: `admin1@example.com` / `admin123`
- Teacher: `prof1@example.com` / `prof123`
- Student: `user1@example.com` / `user123`

---

## Essential Commands

### Monorepo Structure

This is a **monorepo** with `backend/` and `frontend/` folders. Commands can be run from root or within each folder.

### Initial Setup
```bash
# Install all dependencies (root + backend + frontend)
npm run install:all
```

### Database Management
```bash
# From root:
npm run reset-and-seed

# From backend/:
npm run reset-and-seed   # Reset database and reseed (REQUIRED before tests)
npm run reset-db         # Reset only
npm run seed             # Seed only
```

**IMPORTANT**: Always run `npm run reset-and-seed` before running tests to ensure clean data state.

### Testing
```bash
# From root:
npm run test:backend     # Run all backend tests
npm run test:frontend    # Run frontend tests

# From backend/:
npm test                 # All tests with coverage
npm run test:security    # Security tests only
npm run test:watch       # Watch mode
npm run test:auth        # Auth tests
npm run test:figures     # Figure permission tests
npm run test:disciplines # Discipline permission tests
```

### Development
```bash
# From root (recommended for parallel development):
npm run start:backend    # Start backend on port 4000
npm run start:frontend   # Start frontend on port 3000

# Or from each folder:
cd backend && npm start
cd frontend && npm start
```

### Docker Commands (Complete Setup)
```bash
# Démarrer tous les services (DB + Backend + Frontend)
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Reset complet (DB incluse)
docker-compose down -v
docker-compose up -d --build

# Rebuild après modification package.json
docker-compose up -d --build

# Accéder au shell backend
docker-compose exec backend sh

# Exécuter les tests dans le container
docker-compose exec backend npm test

# Reset et reseed la DB dans Docker
docker-compose exec backend npm run reset-and-seed
```

**Voir [docs/DOCKER.md](docs/DOCKER.md) pour le guide complet et le troubleshooting.**

### Code Quality
```bash
# Run ESLint on backend (from root)
npx eslint "backend/**/*.js" --fix
```

---

## Project Structure

```
cirque-app/                    # Monorepo root
├── backend/                   # Node.js + Express backend
│   ├── src/
│   │   ├── models/           # Sequelize models
│   │   ├── routes/           # Express routes (modular, role-based)
│   │   ├── services/         # Business logic layer
│   │   ├── middleware/       # Auth, multi-tenant, permissions
│   │   └── utils/            # Helper functions
│   ├── seed/                 # Database seeding system
│   │   ├── modules/          # Modular seed scripts
│   │   └── data/             # Figure definitions
│   ├── scripts/              # DB management scripts
│   ├── test/                 # Jest tests
│   │   ├── security/         # Security & permission tests
│   │   ├── integration/      # Integration tests
│   │   └── helpers/          # Test utilities
│   ├── docs/                 # Backend-specific docs
│   │   ├── API_DOCUMENTATION.md
│   │   └── INTEGRATION_LOG.md
│   ├── server.js             # Entry point
│   ├── db.js                 # Sequelize config
│   └── Dockerfile            # Backend containerization
├── frontend/                  # React + Material-UI frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts (Auth, etc.)
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Frontend utilities
│   ├── public/               # Static assets
│   └── Dockerfile            # Frontend containerization
├── docs/                      # Project documentation
│   ├── PLAN.md               # Development roadmap
│   ├── FEATURES.md           # Feature specifications
│   ├── SECURITY.md           # Security guidelines
│   ├── TESTING.md            # Testing strategy
│   ├── STRUCTURE.md          # Architecture details
│   ├── COMPTES_TEST.md       # Test account credentials
│   ├── DOCKER.md             # Docker complete guide
│   ├── DOCKER-QUICKSTART.md  # Docker quick start
│   ├── DOCKER-SETUP-SUMMARY.md # Docker setup summary
│   ├── MISE_A_JOUR_DOCS_TODO.md # Documentation updates TODO
│   ├── TESTS_MANUELS.md      # Manual testing guide
│   └── archives/             # Historical documentation
├── scripts/                   # Utility scripts
│   ├── docker-helper.sh      # Docker helper (Mac/Linux/Git Bash)
│   └── docker-helper.ps1     # Docker helper (Windows PowerShell)
├── eslint.config.js          # ESLint config (root level)
├── CLAUDE.md                 # This file
├── GEMINI.md                 # Gemini AI context (frontend focus)
└── README.md                 # Project overview
```

---

## Architecture Overview

### Multi-Tenant System

The application supports multiple schools (écoles) with data isolation:

- **École Model** ([backend/src/models/Ecole.js](backend/src/models/Ecole.js)): Each school has subscription type (basic/premium/trial)
- **Automatic Filtering**: Middleware ([backend/src/middleware/contexteEcole.js](backend/src/middleware/contexteEcole.js)) automatically filters data by school
- **Public Catalog**: Figures and disciplines can be public (null ecole_id) or school-specific
- **User Visibility**: Users see public content + their school's private content

### Refactored Progression System

**Old Architecture** (deprecated):
- `EtapeUtilisateur` - tracked progression at step level
- Single-table approach

**Current Architecture** (refactored):
- **`ProgressionEtape`** ([backend/src/models/ProgressionEtape.js](backend/src/models/ProgressionEtape.js)): Tracks user progress per step
  - Fields: `utilisateur_id`, `etape_id`, `statut` (non_commence/en_cours/valide)
  - Replaces old `EtapeUtilisateur` model
- **`TentativeEtape`** ([backend/src/models/TentativeEtape.js](backend/src/models/TentativeEtape.js)): Records all training attempts
  - Supports 4 training modes (see below)
  - Enables "Grit Score" calculation from attempts history
- **`EtapeProgression`** ([backend/src/models/EtapeProgression.js](backend/src/models/EtapeProgression.js)): Defines steps within figures
  - Linked to `Figure` model
  - Contains step metadata (nom, ordre, description)

**Key Concept**: Progression is tracked per individual step, not per global figure. This allows granular tracking of which specific step the user is working on.

### 4 Training Modes System

The application supports rich training data capture through 4 modes:

1. **Binaire** (Binary)
   - Simple success/failure tracking
   - Fields: `reussie` (boolean)

2. **Evaluation** (Self-assessment)
   - Qualitative self-evaluation
   - Fields: `score` (1-3: Échec/Instable/Maîtrisé)
   - Auto-mapped: score ≥ 2 → `reussie = true`

3. **Duree** (Duration)
   - Time-based practice tracking
   - Fields: `duree_secondes` (integer, seconds)
   - Always counted as success (`reussie = true`)

4. **Evaluation_Duree** (Combined)
   - Quality + quantity tracking
   - Fields: `score` (1-3) + `duree_secondes`
   - Example: "3 minutes of unstable practice"
   - Auto-mapped: score ≥ 2 → `reussie = true`

**Implementation**:
- Model validation: [backend/src/models/TentativeEtape.js](backend/src/models/TentativeEtape.js) (lines 52-72)
- Service validation: [backend/src/services/EntrainementService.js](backend/src/services/EntrainementService.js) (`_validateTentativeData`, `_calculateReussie`)
- API endpoint: `POST /api/entrainement/tentatives`

The `reussie` boolean is automatically calculated to maintain compatibility with Grit Score system.

### Service Layer Pattern

Business logic is centralized in service files (`services/`):

- **EntrainementService**: Training attempts validation and recording
- **GamificationService**: XP, badges, titles, streaks
- **ProfService**: Teacher-student relationship management
- **ProgrammeService**: Custom training programs
- **MemoryDecayService**: Automated skill decay calculation (cron job)
- **StatsService**: Analytics and statistics

**Pattern**: Routes handle HTTP concerns, services handle business logic.

### Route Organization

Routes are modular and role-based in [backend/src/routes/](backend/src/routes/):

```
backend/src/routes/
├── index.js              # Main router, mounts all sub-routes
├── utilisateurs.js       # Public: registration, login
├── figures.js            # Public + auth: list, details
├── disciplines.js        # Public: list disciplines
├── progression.js        # Auth: user progression tracking
├── entrainement.js       # Auth: training attempts + history
├── statistiques.js       # Auth: user stats
├── admin.js             # Admin only: disciplines, figures CRUD
├── prof/                # Teacher routes
│   ├── eleves.js        # Student management
│   ├── groupes.js       # Class groups
│   ├── programmes.js    # Custom programs
│   └── statistiques.js  # Teacher analytics
└── gamification/        # Gamification features
    ├── badges.js
    ├── defis.js
    ├── titres.js
    └── streaks.js
```

**Middleware Chain**:
- `verifierToken`: JWT authentication (all protected routes)
- `contexteEcole`: Multi-tenant filtering (auto-scopes queries)
- `estProfesseurOuAdmin`: Role-based access (admin/teacher routes)
- `estAdmin`: Admin-only routes
- `peutModifierFigure`: Ownership verification (teacher can only edit own figures)

---

## Data Seeding Strategy

Seed system ([backend/seed/](backend/seed/)) creates realistic multi-tenant test data:

### Seed Modules
```
backend/seed/
├── index.js              # Orchestrator
├── modules/
│   ├── seedEcoles.js     # Schools (2: basic + premium trial)
│   ├── seedCatalogue.js  # Public catalog (disciplines, figures, badges)
│   ├── seedUtilisateurs.js # Users (1 admin, 4 teachers, 20 students, 3 solo)
│   ├── seedRelations.js  # Teacher-student relationships + groups
│   ├── seedProgressions.js # User progression on steps
│   ├── seedInteractions.js # Teacher-student interaction history
│   └── seedTentatives.js # Training attempts with 4 modes
└── data/
    └── figures-data.js   # Figure definitions
```

### Seed Data Profiles

**Student Profiles** (assigned randomly):
- `balanced`: 30 steps validated across disciplines
- `specialist_juggling`: 15 steps, juggling-focused
- `specialist_aerial`: 15 steps, aerial-focused
- `progressing`: 30 steps, active learner
- `stable`: 30 steps, consistent
- `at_risk`: 30 steps, needs attention
- `low_safety`: 60 steps (excessive, safety concern)

**Training Attempt Profiles**:
- `high_grit`: 20% of students, 5-12 attempts per step
- `talent_naturel`: 15% of students, 1-3 attempts per step
- `normal`: 65% of students, 2-6 attempts per step

Seeds automatically distribute the 4 training modes across attempts for realistic test data.

---

## Key Workflows

### New Training Attempt Flow

1. Frontend calls `POST /api/entrainement/tentatives`
2. Route validates `typeSaisie` is required
3. `EntrainementService.enregistrerTentative`:
   - Validates data per mode (via `_validateTentativeData`)
   - Calculates `reussie` boolean (via `_calculateReussie`)
   - Creates `TentativeEtape` record
   - Updates `ProgressionEtape.statut` if successful
   - Transaction-wrapped for atomicity

### Pagination Pattern (New)

Training history endpoints support pagination to avoid loading excessive data:

- `GET /api/entrainement/tentatives/:etapeId?limit=20&offset=0`
- `GET /api/entrainement/historique/utilisateur/:id?limit=20&offset=0`

Default limit: 20, max: 100. See `INTEGRATION_LOG.md` for frontend integration details.

### Memory Decay Cron Job

Automated skill decay calculation runs daily at 2 AM (Europe/Paris):

```javascript
// backend/server.js
cron.schedule('0 2 * * *', async () => {
  await MemoryDecayService.updateAllDecayLevels();
});
```

Updates `ProgressionEtape` records based on time since last validation. See [backend/src/services/MemoryDecayService.js](backend/src/services/MemoryDecayService.js).

---

## Testing Philosophy

### Test Organization
```
backend/test/
├── helpers/
│   └── auth-helper.js      # Shared authentication utilities
├── integration/
│   └── progression.test.js # Integration tests
└── security/
    ├── auth.test.js         # JWT, registration, login
    ├── permissions-figures.test.js
    └── permissions-disciplines.test.js
```

### Testing Requirements

- **Always reseed before tests**: `npm run reset-and-seed` (from root or backend/)
- **48 tests total** covering auth, permissions, multi-tenant isolation
- Tests use predefined seed data (admin, teachers, students)
- Security tests verify double protection (frontend filtering + backend authorization)
- Run specific test suites: `npm run test:auth`, `npm run test:figures`, `npm run test:disciplines`

### Frontend Testing
- Location: [frontend/src/](frontend/src/)
- Command: `npm run test:frontend` (from root) or `npm test` (from frontend/)
- Framework: React Testing Library + Jest

---

## Database Schema Notes

### Core Tables

- **Utilisateur**: Users (role: eleve/professeur/admin, école affiliation)
- **Ecole**: Schools (subscription_type, trial_end_date)
- **Discipline**: Skill categories (public catalog)
- **Figure**: Skills (public or school-specific, belongs to Discipline)
- **EtapeProgression**: Steps within a Figure
- **ProgressionEtape**: User progress on steps (statut: non_commence/en_cours/valide)
- **TentativeEtape**: Training attempt records (4 modes, reussie, timestamps)

### Relationships

- `Ecole` → many `Utilisateur`
- `Discipline` → many `Figure`
- `Figure` → many `EtapeProgression` (steps)
- `Utilisateur` + `EtapeProgression` → `ProgressionEtape` (user's progress on step)
- `ProgressionEtape` → many `TentativeEtape` (attempt history for grit tracking)

### Multi-Tenant Keys

- `ecole_id` on `Utilisateur`, `Figure` (nullable for public content)
- Middleware automatically adds `WHERE ecole_id IN (null, user.ecole_id)` to queries

---

## Documentation Reference

### API & Integration
- **[backend/docs/API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md)**: Complete API endpoint reference
- **[backend/docs/INTEGRATION_LOG.md](backend/docs/INTEGRATION_LOG.md)**: Backend changes impacting frontend (check before frontend work)

### Project Documentation
- **[README.md](README.md)**: Project overview, installation, test accounts
- **[docs/PLAN.md](docs/PLAN.md)**: Development roadmap and milestones
- **[docs/FEATURES.md](docs/FEATURES.md)**: Feature specifications
- **[docs/SECURITY.md](docs/SECURITY.md)**: Security architecture and guidelines
- **[docs/TESTING.md](docs/TESTING.md)**: Comprehensive testing strategy
- **[docs/STRUCTURE.md](docs/STRUCTURE.md)**: Detailed architecture documentation
- **[docs/COMPTES_TEST.md](docs/COMPTES_TEST.md)**: Test account credentials

### AI Agent Context
- **[CLAUDE.md](CLAUDE.md)**: This file - guidance for Claude Code
- **[GEMINI.md](GEMINI.md)**: Frontend-focused context for Gemini AI

---

## Development Guidelines

### Backend vs Frontend Work

**When working on Backend** ([backend/](backend/)):
- Modify routes, services, models, middleware
- Follow the Backend Changes Protocol below
- Update API documentation
- Run backend tests before committing

**When working on Frontend** ([frontend/](frontend/)):
- Consult [GEMINI.md](GEMINI.md) for frontend-specific context
- Check [backend/docs/INTEGRATION_LOG.md](backend/docs/INTEGRATION_LOG.md) for recent backend changes
- Never modify backend code - read it for understanding only
- Frontend proxies API requests to backend via `proxy: "http://localhost:4000"` in package.json

### Backend Changes Protocol

When making backend modifications:

1. **Validate with seeds**: `npm run reset-and-seed` to verify logic
2. **Run tests**: `npm test` (from backend/) to catch regressions
3. **Update INTEGRATION_LOG.md**: Document changes for frontend team in [backend/docs/INTEGRATION_LOG.md](backend/docs/INTEGRATION_LOG.md)
4. **Update API_DOCUMENTATION.md**: Keep endpoint docs current in [backend/docs/API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md)
5. **Run ESLint**: `npx eslint "backend/**/*.js" --fix` to ensure code quality

### Security Principles

- **Double Protection**: Frontend filters UI + Backend validates permissions
- **JWT Validation**: All protected routes use `verifierToken` middleware
- **Role-Based Access**: Use appropriate middleware (`estAdmin`, `estProfesseurOuAdmin`)
- **Ownership Checks**: Teachers can only modify their own content (except admins)
- **Multi-Tenant Isolation**: `contexteEcole` middleware ensures data separation

### Code Organization

- **Routes** ([backend/src/routes/](backend/src/routes/)): HTTP handling only (validation, error responses)
- **Services** ([backend/src/services/](backend/src/services/)): Business logic, database transactions
- **Models** ([backend/src/models/](backend/src/models/)): Sequelize definitions, validations, associations
- **Middleware** ([backend/src/middleware/](backend/src/middleware/)): Cross-cutting concerns (auth, multi-tenant, permissions)

### Code Quality

- **ESLint**: Configured at root level ([eslint.config.js](eslint.config.js))
- **Style Guide**: Single quotes, semicolons required, CommonJS modules
- **Before Commits**: Run `npx eslint "backend/**/*.js" --fix` to auto-fix formatting issues
- Check [backend/docs/INTEGRATION_LOG.md](backend/docs/INTEGRATION_LOG.md) for any pending ESLint issues

---

## Common Pitfalls

### Seed Data Dependencies

Seed modules must run in order (orchestrated by `seed/index.js`):
1. Écoles → Users → Relations → Progressions → Tentatives

Breaking this order causes foreign key constraint errors.

### Progression vs EtapeUtilisateur

**Old code may reference `EtapeUtilisateur`** - this is deprecated. Use `ProgressionEtape` instead.

### Training Mode Validation

Don't bypass service validation - modes have strict rules:
- `binaire`: requires `reussite`, no score/duration
- `evaluation`: requires `score` (1-3), no duration
- `duree`: requires `dureeSecondes`, no score
- `evaluation_duree`: requires both `score` AND `dureeSecondes`

Violating these rules will cause model-level validation errors.

---

## Environment Variables

Required in `.env`:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cirque_app
JWT_SECRET=your_secret_key_production
```

See `.env.example` for complete reference.

---

## Port Configuration

- **Backend**: 4000 (configured in [backend/server.js](backend/server.js))
- **Frontend**: 3000 (React dev server default)
- **Frontend Proxy**: Frontend proxies API requests to `http://localhost:4000` (configured in [frontend/package.json](frontend/package.json))
- **CORS**: Configured for `http://localhost:3000` in development ([backend/server.js](backend/server.js))

Production deployments may use different ports - update CORS and proxy configuration accordingly.

---

## Key Files to Know

### Backend Entry Points
- **[backend/server.js](backend/server.js)**: Main server, CORS, cron jobs
- **[backend/db.js](backend/db.js)**: Sequelize database connection
- **[backend/src/routes/index.js](backend/src/routes/index.js)**: Main router that mounts all routes

### Configuration Files
- **[backend/.env](backend/.env)**: Database credentials and secrets (not in git)
- **[backend/.env.example](backend/.env.example)**: Template for .env
- **[backend/jest.config.js](backend/jest.config.js)**: Jest test configuration
- **[eslint.config.js](eslint.config.js)**: ESLint rules (root level)

### Database Scripts
- **[backend/scripts/reset-db.js](backend/scripts/reset-db.js)**: Drop and recreate all tables
- **[backend/seed/index.js](backend/seed/index.js)**: Main seed orchestrator
- **[backend/seed/data/figures-data.js](backend/seed/data/figures-data.js)**: Figure definitions for seeding

### Frontend Entry Points
- **[frontend/src/index.js](frontend/src/index.js)**: React app entry
- **[frontend/src/App.js](frontend/src/App.js)**: Main app component with routing
- **[frontend/package.json](frontend/package.json)**: Frontend deps + proxy config
