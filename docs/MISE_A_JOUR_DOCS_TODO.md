# Mises à Jour Documentation - TODO

**Date**: 2025-12-25

Ce fichier liste les mises à jour manuelles à effectuer dans la documentation pour refléter la nouvelle structure monorepo.

---

## 📝 CLAUDE.md - Ajouts Requis

### 1. Ajouter une note en haut du fichier (après le titre)

```markdown
> **⚠️ STRUCTURE MONOREPO**: Le projet a été restructuré en monorepo.
> - Backend: `backend/` (modèles dans `backend/src/models/`, routes dans `backend/src/routes/`, etc.)
> - Frontend: `frontend/`
> - Docs: `docs/`
> - **IMPORTANT**: Toutes les commandes backend doivent être exécutées depuis `backend/`: `cd backend && npm <command>`
```

### 2. Mettre à jour la section "Essential Commands"

**Avant**:
```bash
npm run reset-and-seed
npm test
npm start
```

**Après**:
```bash
cd backend && npm run reset-and-seed
cd backend && npm test
cd backend && npm start
```

### 3. Mettre à jour tous les chemins de fichiers

Remplacer dans tout le document:
- `models/` → `backend/src/models/`
- `routes/` → `backend/src/routes/`
- `services/` → `backend/src/services/`
- `middleware/` → `backend/src/middleware/`
- `seed/` → `backend/seed/`
- `__tests__/` → `backend/test/`
- `server.js` → `backend/server.js`
- `db.js` → `backend/db.js`

### 4. Mettre à jour la section "Testing Philosophy"

```markdown
### Test Organization
\`\`\`
backend/test/
├── helpers/
│   └── auth-helper.js      # Shared authentication utilities
├── integration/
│   └── progression.test.js # Integration tests
└── security/
    ├── auth.test.js         # JWT, registration, login
    ├── permissions-figures.js
    └── permissions-disciplines.js
\`\`\`
```

---

## 📝 API_DOCUMENTATION.md - Ajouts Requis

### 1. Ajouter une note en haut du fichier

```markdown
> **📁 Structure Backend**: Tous les fichiers backend sont maintenant dans `backend/`.
> Les chemins référencés dans cette documentation sont relatifs à `backend/src/`.
```

### 2. Mettre à jour les exemples de chemins de fichiers

Quand des chemins de fichiers sont mentionnés, les préfixer avec `backend/src/`:

**Exemple**:
- `routes/progression.js` → `backend/src/routes/progression.js`
- `models/ProgrammePartage.js` → `backend/src/models/ProgrammePartage.js`

---

## 📝 README.md (racine) - Révision Complète

Le README.md à la racine contient des informations obsolètes. **Options**:

### Option 1: Remplacer par un README Minimaliste

```markdown
# Cirque App

Application full-stack pour la gestion et l'apprentissage de figures de cirque avec système de progression.

## 🚀 Quick Start

### Backend
\`\`\`bash
cd backend
npm install
npm run reset-and-seed
npm start  # Port 4000
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm start  # Port 3000
\`\`\`

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Guide complet pour développeurs (backend)
- **[API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md)** - Documentation des endpoints API
- **[INTEGRATION_LOG.md](backend/docs/INTEGRATION_LOG.md)** - Journal des changements backend/frontend
- **[docs/](docs/)** - Documentation générale du projet

## 🏗️ Structure du Projet

\`\`\`
cirque-app/
├── backend/           # Backend Node.js + Express
│   ├── src/           # Code source (models, routes, services)
│   ├── seed/          # Données de test
│   ├── test/          # Tests
│   └── docs/          # Documentation API
├── frontend/          # Frontend React
├── docs/              # Documentation projet
└── README.md          # Ce fichier
\`\`\`

## 🔐 Comptes de Test

Voir [docs/COMPTES_TEST.md](docs/COMPTES_TEST.md)

**Quick Access**:
- Admin: `admin@cirqueapp.com` / `Admin123!`
- Prof: `jean.martin@voltige.fr` / `Password123!`
- Élève: `lucas.moreau@voltige.fr` / `Password123!`

## 🧪 Tests

\`\`\`bash
cd backend
npm run reset-and-seed  # REQUIS avant les tests
npm test
\`\`\`

## 📝 License

[Votre licence]
```

### Option 2: Faire Référence à CLAUDE.md

```markdown
# Cirque App

Pour la documentation complète, voir **[CLAUDE.md](CLAUDE.md)**.

## Quick Start

### Backend
\`\`\`bash
cd backend && npm install && npm run reset-and-seed && npm start
\`\`\`

### Frontend
\`\`\`bash
cd frontend && npm install && npm start
\`\`\`

## Documentation

- [CLAUDE.md](CLAUDE.md) - Documentation complète
- [API Documentation](backend/docs/API_DOCUMENTATION.md)
- [Integration Log](backend/docs/INTEGRATION_LOG.md)
```

---

## 📝 Autres Fichiers à Vérifier

### 1. docs/STRUCTURE.md

Vérifier que la structure documentée correspond à la nouvelle organisation:
- `backend/src/models/`
- `backend/src/routes/`
- `backend/src/services/`
- etc.

### 2. docs/TESTING.md

Mettre à jour les chemins vers les tests:
- `backend/test/` au lieu de `__tests__/`

### 3. frontend/docs/README.md

Vérifier que les références au backend pointent vers `backend/docs/` pour l'API.

---

## ✅ Checklist de Validation

Après avoir effectué les mises à jour:

- [ ] CLAUDE.md: Note monorepo ajoutée
- [ ] CLAUDE.md: Commandes préfixées avec `cd backend &&`
- [ ] CLAUDE.md: Tous les chemins mis à jour
- [ ] API_DOCUMENTATION.md: Note sur structure backend ajoutée
- [ ] README.md: Remplacé ou simplifié avec références correctes
- [ ] docs/STRUCTURE.md: Vérifié et mis à jour si nécessaire
- [ ] docs/TESTING.md: Chemins de tests mis à jour
- [ ] Vérifier que le backend démarre: `cd backend && npm start`
- [ ] Vérifier que les tests passent: `cd backend && npm test`

---

**Notes**:
- Utiliser la recherche/remplacement globale pour les chemins fréquents
- Toujours tester après les modifications
- Commit les changements de documentation séparément du code
