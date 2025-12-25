# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cirque App** - Full-stack application for circus skill training management with progression tracking, multi-tenant architecture, and gamification features.

- **Backend**: Node.js + Express + MySQL/Sequelize (Port 4000)
- **Frontend**: React + Material-UI (Port 3000)
- **Database**: MySQL with Sequelize ORM
- **Auth**: JWT-based authentication

---

## Essential Commands

### Database Management
```bash
# Reset database and reseed (REQUIRED before tests)
npm run reset-and-seed

# Reset only
npm run reset-db

# Seed only
npm run seed
```

### Testing
```bash
# All tests with coverage
npm test

# Security tests only
npm run test:security

# Watch mode
npm run test:watch

# Specific test suites
npm run test:auth
npm run test:figures
npm run test:disciplines
```

**IMPORTANT**: Always run `npm run reset-and-seed` before running tests to ensure clean data state.

### Development
```bash
# Start backend (port 4000)
npm start

# Start frontend (port 3000)
cd frontend && npm start
```

---

## Architecture Overview

### Multi-Tenant System

The application supports multiple schools (écoles) with data isolation:

- **École Model** (`models/Ecole.js`): Each school has subscription type (basic/premium/trial)
- **Automatic Filtering**: Middleware `contexteEcole.js` automatically filters data by school
- **Public Catalog**: Figures and disciplines can be public (null ecole_id) or school-specific
- **User Visibility**: Users see public content + their school's private content

### Refactored Progression System

**Old Architecture** (deprecated):
- `EtapeUtilisateur` - tracked progression at step level
- Single-table approach

**Current Architecture** (refactored):
- **`ProgressionEtape`** (`models/ProgressionEtape.js`): Tracks user progress per step
  - Fields: `utilisateur_id`, `etape_id`, `statut` (non_commence/en_cours/valide)
  - Replaces old `EtapeUtilisateur` model
- **`TentativeEtape`** (`models/TentativeEtape.js`): Records all training attempts
  - Supports 4 training modes (see below)
  - Enables "Grit Score" calculation from attempts history
- **`EtapeProgression`** (`models/EtapeProgression.js`): Defines steps within figures
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
- Model validation: `models/TentativeEtape.js` (lines 52-72)
- Service validation: `services/EntrainementService.js` (`_validateTentativeData`, `_calculateReussie`)
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

Routes are modular and role-based:

```
routes/
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

Seed system (`seed/`) creates realistic multi-tenant test data:

### Seed Modules
```
seed/
├── index.js              # Orchestrator
├── modules/
│   ├── seedEcoles.js     # Schools (2: basic + premium trial)
│   ├── seedCatalogue.js  # Public catalog (disciplines, figures, badges)
│   ├── seedUsers.js      # Users (1 admin, 4 teachers, 20 students, 3 solo)
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
// server.js
cron.schedule('0 2 * * *', async () => {
  await MemoryDecayService.updateAllDecayLevels();
});
```

Updates `ProgressionEtape` records based on time since last validation.

---

## Testing Philosophy

### Test Organization
```
__tests__/
├── helpers/
│   └── auth-helper.js      # Shared authentication utilities
├── integration/
│   └── progression.test.js # Integration tests
└── security/
    ├── auth.test.js         # JWT, registration, login
    ├── permissions-figures.js
    └── permissions-disciplines.js
```

### Testing Requirements

- Always reseed before tests: `npm run reset-and-seed`
- 48 tests total covering auth, permissions, multi-tenant isolation
- Tests use predefined seed data (admin, teachers, students)
- Security tests verify double protection (frontend filtering + backend authorization)

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

## API Documentation

See `API_DOCUMENTATION.md` for complete endpoint reference.

**Recent Changes**: Check `INTEGRATION_LOG.md` for latest backend updates that impact frontend integration.

---

## Development Guidelines

### Backend Changes Protocol

When making backend modifications:

1. **Validate with seeds**: `npm run reset-and-seed` to verify logic
2. **Run tests**: `npm test` to catch regressions
3. **Update INTEGRATION_LOG.md**: Document changes for frontend team
4. **Update API_DOCUMENTATION.md**: Keep endpoint docs current

### Security Principles

- **Double Protection**: Frontend filters UI + Backend validates permissions
- **JWT Validation**: All protected routes use `verifierToken` middleware
- **Role-Based Access**: Use appropriate middleware (`estAdmin`, `estProfesseurOuAdmin`)
- **Ownership Checks**: Teachers can only modify their own content (except admins)
- **Multi-Tenant Isolation**: `contexteEcole` middleware ensures data separation

### Code Organization

- Routes: HTTP handling only (validation, error responses)
- Services: Business logic, database transactions
- Models: Sequelize definitions, validations, associations
- Middleware: Cross-cutting concerns (auth, multi-tenant, permissions)

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

- **Backend**: 4000 (configured in `server.js`)
- **Frontend**: 3000 (React dev server default)
- **CORS**: Configured for `http://localhost:3000` in development

Production deployments may use different ports - update CORS configuration accordingly.
