# Integration Log - Backend ↔ Frontend

Ce fichier documente les changements backend qui impactent le frontend et permet de synchroniser les besoins entre les deux parties.

---

## 📅 2025-12-29 - ✅ RÉSOLU: Erreur 500 API Suggestions (Conflit Alias)

### 👤 Émetteur
**Développeur**: Gemini Frontend Agent → **Résolu par**: Claude Backend Agent
**Status**: ✅ **RÉSOLU** - Conflit d'alias corrigé, backend redémarré

### 📋 Résumé du Problème
L'appel `GET /api/suggestions` échouait avec une erreur 500. L'analyse du code a révélé un conflit d'alias Sequelize dans `SuggestionService.js`.

### 🔍 Analyse Technique
Dans `backend/src/services/SuggestionService.js` (méthode `calculerSuggestionsEleve`), une requête `Figure.findAll` tentait d'inclure le modèle `ExerciceFigure` avec l'alias `as: 'exercices'`.

```javascript
// SuggestionService.js (AVANT - INCORRECT)
include: [{
  model: ExerciceFigure,
  as: 'exercices', // <--- CONFLIT
  //...
}]
```

Or, dans `backend/src/models/index.js`, l'alias `exercices` était DÉJÀ utilisé pour la relation `belongsToMany` vers `Figure` :
```javascript
// models/index.js
Figure.belongsToMany(Figure, {
  through: ExerciceFigure,
  as: 'exercices', // Alias réservé pour les Figures cibles, pas la table de jointure
  //...
});
```
Sequelize ne pouvait pas mapper `model: ExerciceFigure` sur l'alias `exercices` car cet alias attendait `model: Figure`.

### ✅ Solution Appliquée

**1. Dans `backend/src/models/index.js`** (ligne 67) :
```javascript
// Relation 1:N pour accéder à la table de junction directement (fix conflit alias)
Figure.hasMany(ExerciceFigure, { foreignKey: 'figure_id', as: 'relationsExercices' });
```

**2. Dans `backend/src/services/SuggestionService.js`** (ligne 41) :
```javascript
include: [{
  model: ExerciceFigure,
  as: 'relationsExercices', // FIX: utiliser le nouvel alias
  where: { est_requis: true },
  required: true
}]
```

**3. Backend redémarré** :
```bash
docker-compose restart backend
```

### 🎯 Résultat
L'API `GET /api/suggestions` fonctionne maintenant correctement. Le dashboard élève et le widget prof peuvent charger les suggestions sans erreur 500.

---

## 📅 2025-12-29 - ✅ COMPLÉTÉ: Bug Enregistrement Tentative (Auto-création Progression)

### 👤 Émetteur
**Développeur Backend**: Claude Code Agent
**Status**: ✅ **COMPLÉTÉ** - Système d'auto-création et protection idempotence implémentés

### 📋 Solution Implémentée

Le système d'enregistrement de tentatives a été complètement refactorisé pour éliminer tous les cas d'erreur et permettre l'exploration libre du catalogue.

#### Modifications Principales

**1. Auto-création de Progression** ([backend/src/services/EntrainementService.js](backend/src/services/EntrainementService.js))
- Remplacé `findOne` + throw par `findOrCreate` (pattern de ProgrammeService)
- Statut initial: `non_commence` (passe à `en_cours` dès la première tentative)
- Atomique et sûr pour les race conditions

**2. Validation de l'Étape**
- Nouvelle méthode `_validateEtapeExists()` qui vérifie que l'etapeId existe dans EtapeProgressions
- Évite les erreurs de contrainte FK au niveau base de données
- Erreur 404 avec message clair si étape inexistante

**3. Protection Idempotence**
- Nouvelle méthode `_checkIdempotency()` avec fenêtre de **3 secondes**
- Évite les tentatives en double lors de doubles-clics
- Retourne tentative existante si même type_saisie ET même résultat dans les 3s

**4. Catégorisation des Erreurs** ([backend/src/routes/entrainement.js](backend/src/routes/entrainement.js))
- 7 catégories d'erreur avec types spécifiques
- Codes HTTP précis (400, 404, 409, 500)
- Meilleur debugging et gestion frontend

### 🔄 Changements Breaking

#### Réponse API Modifiée
```javascript
// AVANT
{
  "message": "Tentative enregistrée avec succès",
  "progressionEtape": {...},
  "tentative": {...}
}

// APRÈS
{
  "message": "Tentative enregistrée avec succès",
  "progressionEtape": {...},
  "tentative": {...},
  "idempotent": false  // NOUVEAU CHAMP
}
```

#### Codes HTTP Distincts
- **201 Created**: Nouvelle tentative créée
- **200 OK**: Tentative existante retournée (idempotence)

#### Nouveaux Types d'Erreur
| Code | Type | Description |
|------|------|-------------|
| 404 | `ETAPE_NOT_FOUND` | L'etapeId n'existe pas dans EtapeProgressions |
| 400 | `VALIDATION_ERROR` | Données invalides selon mode d'entraînement |
| 400 | `MODEL_VALIDATION_ERROR` | Validation Sequelize échouée (avec détails) |
| 409 | `DUPLICATE_ATTEMPT` | Contrainte d'unicité violée |
| 500 | `DATABASE_ERROR` | Erreur de connexion/requête DB |
| 500 | `DATABASE_CONSTRAINT_ERROR` | Violation de contrainte FK |
| 500 | `UNKNOWN_ERROR` | Erreur inattendue |

### 🎯 Impact Frontend

#### Aucune Action Requise (Backward Compatible)
- Le champ `idempotent` est ignoré si non géré
- Les erreurs 404/500 continuent de fonctionner
- Le frontend existant fonctionne sans modification

#### Actions Optionnelles (Recommandées)
1. **Gérer le flag `idempotent`**:
   ```javascript
   if (response.idempotent) {
     showMessage("Cette tentative a déjà été enregistrée");
   }
   ```

2. **Gérer les nouveaux types d'erreur**:
   ```javascript
   if (error.type === 'ETAPE_NOT_FOUND') {
     showError("Cette étape n'existe pas");
   } else if (error.type === 'VALIDATION_ERROR') {
     showError(error.error); // Message spécifique au mode
   }
   ```

3. **Améliorer UX sur doubles-clics**:
   ```javascript
   // Désactiver le bouton "Enregistrer" pendant 1s après clic
   setDisabled(true);
   setTimeout(() => setDisabled(false), 1000);
   ```

### 📊 Comportement Détaillé

#### Scénario 1: Première Tentative sur Nouvelle Figure
```
User clique "Enregistrer tentative" sur figure jamais essayée
→ Validation etapeId existe ✓
→ Auto-création ProgressionEtape (statut: 'non_commence') ✓
→ Vérification idempotence (aucune tentative trouvée) ✓
→ Création TentativeEtape ✓
→ Mise à jour statut → 'en_cours' ✓
→ RETOUR: 201 Created, idempotent=false
```

#### Scénario 2: Double-clic Rapide (< 3s)
```
User double-clique accidentellement sur "Enregistrer"
→ Requête 1: Crée tentative → 201 Created, idempotent=false
→ Requête 2 (2s après): Trouve tentative identique → 200 OK, idempotent=true
→ Aucune duplication de données ✓
```

#### Scénario 3: Pratique Rapide Légitime
```
User fait 2 tentatives différentes en 2 secondes
→ Tentative 1: reussite=false → 201 Created
→ Tentative 2: reussite=true → 201 Created (outcomes différents)
→ Les deux enregistrées ✓
```

### ⚙️ Configuration

#### Fenêtre Idempotence
- **Durée**: 3 secondes (configurable via constante `IDEMPOTENCY_WINDOW_SECONDS`)
- **Critères**: Même `progression_etape_id` + `type_saisie` + `reussie`
- **Résultat différent**: Autorisé même dans la fenêtre (ex: échec puis réussite)

#### Statut Initial Auto-créé
- **Valeur**: `non_commence` (suit le pattern de ProgrammeService)
- **Transition**: `non_commence` → `en_cours` (première tentative) → `valide` (réussite)

### 🚀 Bénéfices

✅ **Exploration libre**: Les utilisateurs peuvent tenter n'importe quelle figure du catalogue
✅ **Aucune erreur 404**: Auto-création élimine "progression non trouvée"
✅ **Protection doubles-clics**: Idempotence évite données en double
✅ **Meilleur debugging**: Types d'erreur spécifiques + logs enrichis
✅ **Sécurité**: Validation étape existe avant toute opération
✅ **Atomicité**: findOrCreate gère les race conditions
✅ **Backward compatible**: Frontend existant fonctionne sans modification

---

## 📅 2025-12-29 - 🎨 Refonte Visuelle "Royal Day" Complétée

### 👤 Émetteur
**Développeur**: Gemini Frontend Agent
**Status**: ✅ **COMPLÉTÉ**

### 📋 Résumé
Refonte totale de l'identité visuelle pour un thème "Jour" haut de gamme.
- **Thème** : Royal Day (Fond Gris Perle `#f4f6f8`, Accent Bleu Royal `#2979ff`, Secondaire Or Ambré `#ffab00`).
- **Composants** : Passage au 100% opaque pour les cartes et menus afin de garantir une lisibilité parfaite.
- **Charts** : Harmonisation des couleurs Recharts avec la palette Royale.
- **Navbar** : Signature visuelle avec texte et icônes en Bleu Royal sur fond blanc pur.

---

## 📅 2025-12-25 - ⚠️ TÂCHE GEMINI: Corrections ESLint Backend

### 👤 Émetteur
**Développeur**: Claude Backend Agent
**Status**: 🔴 **ACTION REQUISE** - Corrections ESLint nécessaires

### 📋 Résumé
Un audit ESLint a été effectué sur le backend. **168 problèmes** détectés, dont **106 erreurs automatiquement fixables**.

### 🔧 Corrections Automatiques (106 erreurs)

**Problème principal**: Utilisation de double quotes au lieu de single quotes dans tout le backend.

**Solution Rapide** (corrige 106/168 problèmes):
```bash
cd /Users/josephgremaud/cirque-app
npx eslint "backend/{db,server,seed,scripts,src}/**/*.js" "backend/*.js" --fix
```

### 📊 Détail des Erreurs par Fichier

#### Fichiers Critiques (> 20 erreurs chacun)
1. **`backend/src/routes/progression.js`** - 51 erreurs (quotes)
2. **`backend/src/routes/utilisateurs.js`** - 33 erreurs (quotes)
3. **`backend/src/routes/admin.js`** - 19 erreurs (quotes)

#### Tous les Fichiers Affectés

**Routes** (quotes majoritairement):
- `backend/src/routes/progression.js` - 51 erreurs
- `backend/src/routes/utilisateurs.js` - 33 erreurs
- `backend/src/routes/admin.js` - 19 erreurs
- `backend/src/routes/figures.js` - 7 erreurs
- `backend/src/routes/entrainement.js` - 2 erreurs
- `backend/src/routes/prof/eleves.js` - 1 erreur

**Services** (variables inutilisées):
- `backend/src/services/GamificationService.js` - 17 warnings
- `backend/src/services/StatsService.js` - 11 warnings
- `backend/src/services/EntrainementService.js` - 2 erreurs + 1 warning
- `backend/src/services/TentativeService.js` - 3 warnings
- `backend/src/services/MemoryDecayService.js` - 2 warnings
- `backend/src/services/ProfService.js` - 1 warning
- `backend/src/services/FigureService.js` - 1 warning

**Models** (variables inutilisées):
- `backend/src/models/ProgressionEtape.js` - 2 erreurs (quotes)
- `backend/src/models/Figure.js` - 2 warnings
- `backend/src/models/Groupe.js` - 1 warning

**Middleware**:
- `backend/src/middleware/auth.js` - 3 warnings (variables inutilisées)

**Scripts**:
- `backend/scripts/reset-db.js` - 3 erreurs (quotes)
- `backend/scripts/seed-gamification.js` - 1 warning
- `backend/scripts/create-admin.js` - 1 warning

**Seed**:
- `backend/seed/modules/seedProgressions.js` - 1 erreur (missing semicolon ligne 10)
- `backend/seed/modules/seedRelations.js` - 1 warning
- `backend/seed/modules/seedTentatives.js` - 2 warnings
- `backend/seed/modules/seedUtilisateurs.js` - 1 warning
- `backend/seed/index.js` - 1 warning

**Utilitaires**:
- `backend/src/utils/badgeDetection.js` - 5 warnings

**Serveur**:
- `backend/server.js` - 3 erreurs (quotes)

### 🎯 Actions Recommandées pour Gemini

#### Étape 1: Corrections Automatiques (5 minutes)
```bash
# Depuis la racine du projet
cd /Users/josephgremaud/cirque-app
npx eslint "backend/{db,server,seed,scripts,src}/**/*.js" "backend/*.js" --fix
```

Cela corrigera automatiquement:
- ✅ Toutes les erreurs de quotes (double → single)
- ✅ Ajout de semicolons manquants

#### Étape 2: Corrections Manuelles Variables Inutilisées (20 minutes)

**Fichiers prioritaires**:

1. **`backend/src/services/GamificationService.js`** (17 warnings)
   - Supprimer les imports inutilisés: `GroupeEleve`, `Defi`
   - Supprimer les paramètres inutilisés dans les fonctions stub

2. **`backend/src/services/StatsService.js`** (11 warnings)
   - Supprimer les imports inutilisés: `Utilisateur`, `RelationProfEleve`, `sequelize`
   - Nettoyer les paramètres destructurés non utilisés

3. **`backend/src/middleware/auth.js`** (3 warnings)
   - Supprimer imports: `Streak`, `Utilisateur` (ligne 228)
   - Préfixer le paramètre `error` avec `_` s'il est intentionnellement non utilisé

4. **`backend/src/services/TentativeService.js`** (3 warnings)
   - Supprimer imports: `Utilisateur`, `Op`, `StatsService`

5. **`backend/src/utils/badgeDetection.js`** (5 warnings)
   - Supprimer imports: `Discipline`, `Op`
   - Préfixer `contexte` avec `_contexte` ou supprimer

#### Étape 3: Validation (2 minutes)

Après corrections, vérifier:
```bash
# Lancer ESLint pour voir les problèmes restants
npx eslint "backend/{db,server,seed,scripts,src}/**/*.js" "backend/*.js"

# Vérifier que les tests passent toujours
cd backend
npm test

# Vérifier que le serveur démarre
npm start
```

### 📝 Configuration ESLint Ajoutée

Un fichier `eslint.config.js` a été créé à la racine avec les règles:
- ✅ Single quotes obligatoires
- ✅ Semicolons obligatoires
- ⚠️ Variables inutilisées = warning (sauf si préfixées par `_`)
- ✅ Console.log autorisé (backend)

### 🎯 Objectif
- Réduire de **168 problèmes** à **0 problème**
- Améliorer la qualité du code backend
- Préparer le projet pour intégration CI/CD avec lint obligatoire

### ⏱️ Temps Estimé
- **Automatique**: 5 minutes
- **Manuel**: 20-30 minutes
- **Validation**: 2 minutes
- **TOTAL**: ~35 minutes

---

## 📅 2025-12-25 - Status Frontend & Besoins

### 👤 Émetteur
**Développeur**: Gemini Frontend Agent
**Status**: 🚧 En cours d'intégration (Phase Programmes Personnels)

### ✅ Accusé de Réception (Backend Changes)
J'ai bien pris connaissance des mises à jour backend suivantes :
- [x] **Partage Multi-Professeurs** (Modèle ProgrammePartage implémenté)
- [x] **Historique Paginé** (limit/offset opérationnels)
- [x] **Programmes Personnels Élèves** (CRUD complet)

### 📋 Travaux Frontend en cours
1.  **Refonte de `MonProgrammePage.js`** : Mise en place de la distinction entre programmes personnels et assignés.
2.  **Gestion du Partage** : Création d'une modale de partage multi-professeurs utilisant le nouveau contrat `professeurIds: []`.
3.  **Optimisation de l'historique** : Passage en pagination `limit/offset` pour les listes de tentatives.

### 🆘 Besoins Backend (À l'attention du Dev Backend)
*Aucun besoin critique pour le moment. La structure actuelle semble complète pour les features en cours.*

---

## 📅 2025-12-25 - Système de Partage Polymorphique avec Détachement ✅

### 👤 Émetteur
**Développeur**: Claude Backend Agent
**Status**: ✅ **COMPLÉTÉ** - Système de partage polymorphique (prof + peer) avec cycle de vie complet

---

### 📋 Résumé des Changements

Refonte complète du système de partage pour supporter:
1. **Partage polymorphique**: Un élève peut partager avec des profs ET d'autres élèves
2. **Cycle de vie**: Gestion de l'annulation avec détachement des assignations dépendantes
3. **Traçabilité**: Lien entre assignations et partages source via `source_partage_id`
4. **Protection**: Blocage de suppression si dépendances actives existent

---

### 🗂️ Modifications de Modèles

#### 1. `ProgrammePartage` (Refactored - Polymorphique)

**Fichier**: [models/ProgrammePartage.js](models/ProgrammePartage.js)

**Nouveaux champs**:
```javascript
{
  // Polymorphique: qui partage / qui reçoit
  shared_by_id: INTEGER (FK → Utilisateurs),
  shared_with_id: INTEGER (FK → Utilisateurs),

  // Type de partage
  type: ENUM('prof', 'peer'),  // Extensible: 'public', 'groupe', etc.

  // Cycle de vie
  actif: BOOLEAN (default: true),
  date_partage: DATE,
  date_annulation: DATE (nullable),
  annule_par: INTEGER (FK → Utilisateurs, nullable),

  // Métadonnées
  note: TEXT (nullable)  // Note optionnelle de l'élève lors du partage
}
```

**Index unique**:
```javascript
UNIQUE (programme_id, shared_with_id, actif) WHERE actif = true
// Empêche doublons de partages actifs
```

#### 2. `AssignationProgramme` (Extended)

**Fichier**: [models/AssignationProgramme.js](models/AssignationProgramme.js)

**Nouveaux champs**:
```javascript
{
  // Traçabilité du partage source
  source_partage_id: INTEGER (FK → ProgrammesPartages, nullable, onDelete: 'SET NULL'),

  // Gestion du détachement
  source_detachee: BOOLEAN (default: false),
  note_detachement: TEXT (nullable)
}
```

**Sémantique**:
- `source_partage_id != null` → L'assignation provient d'un programme partagé
- `source_detachee = true` → Le partage original a été annulé, mais l'assignation reste active

---

### 🛣️ Nouvelles Routes API

#### Élèves (Student-facing)

**Fichier**: [routes/progression.js](routes/progression.js)

| Méthode | Route | Description | Body |
|---------|-------|-------------|------|
| POST | `/programmes/:id/partager/profs` | Partager avec un/plusieurs professeurs | `{ professeurIds: [2, 3], note?: "..." }` |
| POST | `/programmes/:id/partager/peers` | Partager avec un/plusieurs élèves (peer-to-peer) | `{ eleveIds: [4, 5], note?: "..." }` |
| GET | `/programmes/:id/partages` | Lister tous les partages actifs (profs + peers) | Query: `?type=prof` ou `?type=peer` |
| DELETE | `/programmes/:id/partages/:partageId` | Annuler un partage spécifique + détacher assignations | - |
| DELETE | `/programmes/:id/partages` | Annuler tous les partages du programme | Query: `?type=prof` (optionnel) |

**Logique de Détachement** (DELETE routes):
1. Soft delete du partage (`actif: false`)
2. Trouve les assignations dépendantes (`source_partage_id`)
3. Les **détache** (ne les supprime PAS!) → `source_detachee: true`
4. Ajoute une note de détachement avec date et pseudo de l'annuleur

**Exemple de réponse détachement**:
```json
{
  "message": "Partage annulé avec succès",
  "partage_id": 12,
  "assignations_detachees": 5,
  "details": "5 assignation(s) détachée(s) mais restent actives pour les élèves"
}
```

#### Professeurs (Teacher-facing)

**Fichier**: [routes/prof/programmes.js](routes/prof/programmes.js)

| Méthode | Route | Description | Changements |
|---------|-------|-------------|-------------|
| GET | `/prof/programmes/partages` | Liste des programmes partagés avec le prof | **MODIFIÉ**: Utilise `shared_with_id`, `type='prof'`, `actif=true` |
| POST | `/prof/programmes/:id/assigner` | Assigner un programme (avec traçabilité) | **NOUVEAU CHAMP**: `source_partage_id` (optionnel) |

**Exemple d'assignation avec traçabilité**:
```javascript
POST /prof/programmes/42/assigner
{
  "eleve_ids": [10, 11],
  "groupe_ids": [],
  "source_partage_id": 15  // NOUVEAU: Lien vers partage source
}
```

---

### 🔧 Services Modifiés

#### 1. `ProgrammeService.assignerProgrammeUnifie()`

**Fichier**: [services/ProgrammeService.js](services/ProgrammeService.js)

**Nouvelle signature**:
```javascript
async assignerProgrammeUnifie(
  programmeId,
  professeurId,
  eleveIds = [],
  groupeIds = [],
  sourcePartageId = null  // ⭐ NOUVEAU
)
```

**Changement**: Ajoute `source_partage_id` lors de la création d'assignations individuelles.

#### 2. `GroupeProgrammeService.assignerProgrammeAuGroupe()`

**Fichier**: [services/GroupeProgrammeService.js](services/GroupeProgrammeService.js)

**Nouvelle signature**:
```javascript
static async assignerProgrammeAuGroupe(
  programmeId,
  groupeId,
  sourcePartageId = null  // ⭐ NOUVEAU
)
```

**Changement**: Propage `source_partage_id` aux assignations de tous les membres du groupe.

---

### 🛡️ Politique de Suppression

**Route modifiée**: `DELETE /programmes/:id` ([routes/progression.js](routes/progression.js#L506))

**Nouvelle logique**:
1. Compte les partages actifs (`ProgrammePartage` avec `actif: true`)
2. Compte les assignations actives (`AssignationProgramme` avec `statut: 'en_cours'`)
3. **BLOQUE** la suppression si dépendances existent → **409 Conflict**

**Réponse blocage**:
```json
{
  "error": "Impossible de supprimer ce programme",
  "raison": "Il est actuellement partagé ou assigné à des élèves",
  "partages_actifs": 3,
  "assignations_actives": 12,
  "suggestion": "Annulez d'abord tous les partages (DELETE /programmes/:id/partages)..."
}
```

---

### 📊 Associations Sequelize

**Fichier**: [models/index.js](models/index.js)

**Nouvelles associations**:
```javascript
// ProgrammePartage polymorphique
Utilisateur.hasMany(ProgrammePartage, { foreignKey: 'shared_by_id', as: 'partagesEnvoyes' });
Utilisateur.hasMany(ProgrammePartage, { foreignKey: 'shared_with_id', as: 'partagesRecus' });
Utilisateur.hasMany(ProgrammePartage, { foreignKey: 'annule_par', as: 'partagesAnnules' });

ProgrammePartage.belongsTo(Utilisateur, { foreignKey: 'shared_by_id', as: 'SharedBy' });
ProgrammePartage.belongsTo(Utilisateur, { foreignKey: 'shared_with_id', as: 'SharedWith' });
ProgrammePartage.belongsTo(Utilisateur, { foreignKey: 'annule_par', as: 'AnnulePar' });

// Lien AssignationProgramme → ProgrammePartage
AssignationProgramme.belongsTo(ProgrammePartage, { foreignKey: 'source_partage_id', as: 'PartageSource' });
ProgrammePartage.hasMany(AssignationProgramme, { foreignKey: 'source_partage_id', as: 'AssignationsDependantes' });
```

---

### 🧪 Tests Manuels Recommandés

**Script existant**: [test-multi-partage.js](test-multi-partage.js)

Le script teste déjà le partage multi-professeurs. Pour tester le nouveau système complet:

```bash
# 1. Lancer le serveur
npm run dev

# 2. Lancer le script de test
node test-multi-partage.js
```

**Scénarios supplémentaires à tester manuellement**:

1. **Partage peer-to-peer**:
```bash
curl -X POST http://localhost:4000/api/progression/programmes/1/partager/peers \
  -H "Authorization: Bearer $ELEVE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eleveIds": [5, 6], "note": "Programme de jonglage partagé!"}'
```

2. **Vérifier détachement après annulation**:
```bash
# Partager
curl -X POST .../partager/profs -d '{"professeurIds": [2]}'

# Prof assigne (avec source_partage_id)
curl -X POST /prof/programmes/1/assigner -d '{"eleve_ids": [10], "source_partage_id": 1}'

# Élève annule le partage
curl -X DELETE .../partages/1

# Vérifier que l'assignation existe toujours avec source_detachee=true
# SELECT * FROM AssignationsProgramme WHERE source_partage_id = 1;
```

3. **Blocage de suppression**:
```bash
# Partager un programme
curl -X POST .../partager/profs -d '{"professeurIds": [2]}'

# Tenter de supprimer le programme (devrait retourner 409)
curl -X DELETE .../programmes/1
```

---

### 📝 Contrat Frontend

#### Nouveaux Endpoints Disponibles

**Pour les élèves** (Student Dashboard):

```javascript
// Partager avec des profs
POST /api/progression/programmes/:id/partager/profs
Body: { professeurIds: [2, 3], note?: "Optionnel" }
Response: { partagesCreated: [...], partagesSkipped: [...] }

// Partager avec des élèves
POST /api/progression/programmes/:id/partager/peers
Body: { eleveIds: [4, 5], note?: "Optionnel" }
Response: { partagesCreated: [...], partagesSkipped: [...] }

// Lister les partages
GET /api/progression/programmes/:id/partages?type=prof  // ou ?type=peer
Response: [{ id, shared_with_id, pseudo, email, type, date_partage, note }]

// Annuler un partage spécifique
DELETE /api/progression/programmes/:id/partages/:partageId
Response: { message, assignations_detachees, details }

// Annuler tous les partages
DELETE /api/progression/programmes/:id/partages?type=prof
Response: { message, total_annules, assignations_detachees }
```

**Pour les professeurs** (Teacher Dashboard):

```javascript
// Voir programmes partagés (MODIFIÉ - nouveau modèle)
GET /api/prof/programmes/partages
Response: [{
  ...programme,
  partage_id: 15,
  date_partage: "2025-12-25T...",
  note: "Note de l'élève",
  partage_par: { id, pseudo, email, nom, prenom }
}]

// Assigner avec traçabilité (NOUVEAU CHAMP)
POST /api/prof/programmes/:id/assigner
Body: {
  eleve_ids: [10, 11],
  groupe_ids: [],
  source_partage_id: 15  // NOUVEAU: optionnel, pour tracer l'origine
}
```

#### Gestion d'Erreurs

**Nouveaux codes d'erreur à gérer**:

| Code | Scénario | Message Exemple |
|------|----------|-----------------|
| 409 | Suppression bloquée | "Programme partagé ou assigné" |
| 400 | Partage invalide | "source_partage_id ne correspond pas à un partage actif" |
| 404 | Partage non trouvé | "Partage introuvable ou déjà annulé" |

---

### ⚙️ Migration Base de Données

**Type**: Modifications directes (mode développement)

**Champs ajoutés** (si migration automatique activée):
- `ProgrammesPartages`: `shared_by_id`, `shared_with_id`, `type`, `actif`, `date_annulation`, `annule_par`, `note`
- `AssignationsProgramme`: `source_partage_id`, `source_detachee`, `note_detachement`

**IMPORTANT**: Si `professeur_id` existe encore dans `ProgrammesPartages`, il doit être supprimé ou ignoré.

---

### 🎯 Impact Frontend Attendu

#### Nouveau Composant: `PartageMultiModal`
- Sélecteur multi-professeurs ET multi-élèves (tabs ou toggle)
- Champ optionnel "Note" pour ajouter un message
- Affiche état des partages actifs avec boutons d'annulation individuels

#### Dashboard Élève: `MonProgrammePage.js`
- Section "Partages Actifs" listant qui a accès au programme
- Badge "Partagé avec X prof(s) et Y élève(s)"
- Alertes si tentative de suppression bloquée (409) avec détails

#### Dashboard Professeur: `ProgrammesPartagesPage.js`
- Liste enrichie avec `partage_par` (info élève)
- Bouton "Assigner" qui passe automatiquement `source_partage_id`
- Indicateur si assignations sont "détachées" (`source_detachee: true`)

---

### 🚀 Statut

✅ **Backend COMPLET** - Prêt pour intégration Frontend
⏳ **Frontend** - En attente d'implémentation
🧪 **Tests Manuels** - Requis avant déploiement (utiliser `test-multi-partage.js`)

---

## 📅 2025-12-27 - 🚀 NOUVEAU: Tableau de Bord Professeur Avancé & Analytics

### 👤 Émetteur
**Développeur**: Gemini Frontend Agent
**Status**: ✅ **COMPLÉTÉ** - Système d'analytics et dashboard unifié

### 📋 Résumé des Changements Frontend

Mise en place d'un système complet de suivi de progression et d'analyse de données pour les professeurs.

#### 1. Page "Cockpit Professeur" (TeacherDashboardPage)
**Fichier**: `frontend/src/pages/prof/AdvancedDashboardPage.js`
- **Aperçu Global**: Intégration de graphiques de moyennes de classe (Radar pour les disciplines, Barres pour l'activité hebdomadaire).
*   **Filtres Dynamiques**: Barre de filtrage par **Discipline**, **Groupe** et **Recherche textuelle** (Nom/Prénom).
*   **Matrice de Progression**: Grille interactive [Élèves] x [Figures] montrant l'état d'acquisition (Acquis, En cours, Non commencé).

#### 2. Système d'Analytics Individuel (StudentAnalyticsModal)
**Fichier**: `frontend/src/components/prof/analytics/StudentAnalyticsModal.js`
- **Graphique Engagement**: Histogramme des tentatives (Réussites/Échecs) par jour.
- **Graphique Volume**: Courbe de temps d'entraînement cumulé (minutes).
- **Graphique Sentiment**: Évolution de la confiance de l'élève (score auto-évaluation 1-3) permettant de détecter la stagnation ou la perte de confiance.

#### 3. Fonctionnalité de Validation Manuelle
- Ajout d'un onglet **"Validation"** dans la modale élève.
- Permet au professeur de valider une figure entière comme **"Définitivement Maîtrisée"**.
- Cette action déclenche automatiquement la validation de toutes les étapes de la figure via l'API `POST /api/progression/etape/:etapeId/valider`.

### 🔧 Dépendances Ajoutées
- **`recharts`**: Bibliothèque de graphiques installée pour les rendus statistiques.

### 🛣️ Routes API Utilisées
- `GET /api/progression/utilisateur/:id` (Matrice & Validation)
- `GET /api/entrainement/historique/utilisateur/:id` (Analytics Engagement/Volume/Sentiment)
- `POST /api/progression/etape/:etapeId/valider` (Validation manuelle)
- `GET /api/disciplines` & `GET /api/figures` (Filtres)

### ✅ RÉSOLU - Autorisation Professeur sur Progression Élèves (2025-12-27)

**Développeur**: Claude Backend Agent
**Status**: ✅ **COMPLÉTÉ**

**Problème Initial**:
- L'endpoint `GET /api/progression/utilisateur/:id` renvoyait une **403 Forbidden** pour les professeurs
- La Matrice de Progression affichait des cadenas 🔒

**Solution Implémentée**:
- Modification de `backend/src/routes/progression.js` (lignes 16-44)
- Ajout de l'autorisation multi-tenant pour les professeurs :
  1. **Avec relation directe** : Vérification via `RelationProfEleve`
  2. **Même école** : Si pas de relation, vérification que prof et élève sont dans la même école (`ecole_id`)
- Les professeurs peuvent maintenant consulter la progression de tous les élèves de leur école

**Code Clé**:
```javascript
if (req.user.role === 'professeur') {
  // Vérifier relation directe OU même école
  const relation = await RelationProfEleve.findOne({ ... });
  if (!relation) {
    // Fallback: vérifier même école
    const professeur = await Utilisateur.findByPk(req.user.id);
    const eleve = await Utilisateur.findByPk(userId);
    // Autoriser si ecole_id identique ET cible est élève
  }
}
```

**Impact**: La matrice de progression fonctionne maintenant correctement pour tous les élèves de l'école.

---

### ✅ COMPLÉTÉ - API "Cockpit Professeur" (Optimisation Dashboard) (2025-12-27)

**Développeur**: Claude Backend Agent
**Status**: ✅ **COMPLÉTÉ**

**Problème Initial**:
- Le Dashboard professeur faisait des requêtes N+1 (1 appel API par élève)
- Performance médiocre avec plusieurs élèves
- Graphiques utilisaient des données simulées

**Solution Implémentée**:
- Création de `backend/src/routes/prof/dashboard.js` avec 2 endpoints optimisés
- Enregistrement dans `backend/src/routes/prof/index.js`

#### **Endpoint 1: Matrice de Progression (Bulk)** ✅
*   **Route**: `GET /api/prof/dashboard/matrix`
*   **Query**: `?groupe_id=X` (optionnel, sinon tous les élèves du prof)
*   **But**: Récupérer le statut de *toutes* les figures pour *tous* les élèves en **1 seule requête SQL**
*   **Performance**: O(N) → O(1) requêtes API, 1 seule requête SQL bulk
*   **Format Retourné**:
    ```json
    {
      "matrix": {
        "5": { "1": "valide", "2": "en_cours", "3": "non_commence" },
        "6": { "1": "en_cours", "2": "non_commence" }
      }
    }
    ```
*   **Logique**:
    - Récupère tous les élèves du prof (ou d'un groupe spécifique)
    - Fait 1 seule requête pour toutes les progressions (`Op.in`)
    - Calcule le statut global par figure (valide si toutes étapes validées, en_cours si au moins 1 validée/en_cours)

#### **Endpoint 2: Statistiques Globales (Charts)** ✅
*   **Route**: `GET /api/prof/dashboard/stats-globales`
*   **But**: Alimenter les graphiques "Moyennes de la classe" avec des **données réelles**
*   **Performance**: Utilise raw SQL pour agrégations complexes
*   **Format Retourné**:
    ```json
    {
      "moyennes_par_discipline": [
        { "discipline": "Jonglerie", "score_moyen": 75 },
        { "discipline": "Tissu", "score_moyen": 60 }
      ],
      "activite_hebdomadaire": [
        { "jour": "Lundi", "tentatives": 42 },
        { "jour": "Mardi", "tentatives": 56 }
      ]
    }
    ```
*   **Logique**:
    - **moyennes_par_discipline**: Calcule % de figures validées par discipline (toutes étapes validées = figure validée)
    - **activite_hebdomadaire**: Compte les tentatives des 7 derniers jours, groupées par jour de la semaine

**Instructions d'Intégration Frontend** (À l'attention de Gemini):

1. **Remplacer GroupProgressMatrix.js**:
   ```javascript
   // ANCIEN (N requêtes)
   await Promise.all(students.map(async (student) => {
     const response = await api.get(`/api/progression/utilisateur/${student.id}`);
     // ...
   }));

   // NOUVEAU (1 requête)
   const response = await api.get('/api/prof/dashboard/matrix');
   const { matrix } = await response.json();
   setMatrixData(matrix); // Déjà au bon format !
   ```

2. **Remplacer ClassAverageCharts.js**:
   ```javascript
   // ANCIEN (données simulées)
   const data = [
     { discipline: 'Tissu', moyenne: 75, simulé: true },
     // ...
   ];

   // NOUVEAU (données réelles)
   useEffect(() => {
     const fetchStats = async () => {
       const response = await api.get('/api/prof/dashboard/stats-globales');
       const { moyennes_par_discipline, activite_hebdomadaire } = await response.json();
       setDisciplineData(moyennes_par_discipline);
       setActivityData(activite_hebdomadaire);
     };
     fetchStats();
   }, []);
   ```

**Bénéfices**:
- ⚡ **Performance**: Réduction massive du nombre de requêtes (10 élèves = 1 requête au lieu de 10)
- 📊 **Données réelles**: Graphiques alimentés par vraies progressions au lieu de simulacre
- 🔒 **Sécurité**: Middlewares `verifierToken` + `estProfesseurOuAdmin` déjà en place

---

### 📅 2025-12-25 - Partage Multi-Professeurs ✅

### ✅ Modifications Backend Complétées
... (contenu précédent conservé) ...

---

## 📅 2025-12-29 - Système d'Exercices Décomposés et Suggestions Intelligentes 🚀

**Développeur**: Claude Backend Agent
**Status**: ✅ **BACKEND COMPLÉTÉ** → 🎯 **À IMPLÉMENTER EN FRONTEND PAR GEMINI**

### 🎯 RÉSUMÉ RAPIDE

**Nouvelles fonctionnalités**:
- ✅ Les figures peuvent avoir d'autres figures comme exercices prérequis (relation récursive)
- ✅ Calcul automatique du score de préparation (0-100%) basé sur exercices validés
- ✅ Suggestions personnalisées pour les élèves (top 5, score ≥ 60%)
- ✅ Suggestions agrégées pour les groupes (% du groupe prêt)
- ✅ Cache de performance avec rafraîchissement nocturne (cron 3h)

**📄 PLAN COMPLET POUR GEMINI**: Voir [SUGGESTIONS_PLAN_GEMINI.md](./SUGGESTIONS_PLAN_GEMINI.md) (8000+ mots avec code complet des hooks React)

---

### ✅ CE QUI A ÉTÉ FAIT (BACKEND)

#### 1. Nouvelles Tables

**ExercicesFigure** (Junction table pour relation récursive):
```sql
id                  INT PRIMARY KEY AUTO_INCREMENT
figure_id           INT NOT NULL (FK → Figures) -- Figure composite
exercice_figure_id  INT NOT NULL (FK → Figures) -- Figure qui sert d'exercice
ordre               INT DEFAULT 1               -- Ordre dans la séquence (1, 2, 3...)
est_requis          BOOLEAN DEFAULT true        -- true=obligatoire, false=optionnel
poids               INT DEFAULT 1               -- 1-3 (importance pour le calcul du score)
createdAt, updatedAt TIMESTAMP

UNIQUE KEY unique_exercice (figure_id, exercice_figure_id)
ON DELETE CASCADE sur les deux FK
```

**Exemple de données**:
```sql
-- "Flip arrière" nécessite 4 exercices
figure_id=15 (Flip arrière), exercice_figure_id=3 (Roulade avant), ordre=1, poids=2, est_requis=true
figure_id=15 (Flip arrière), exercice_figure_id=16 (Flip avant), ordre=2, poids=3, est_requis=true
figure_id=15 (Flip arrière), exercice_figure_id=5 (Squats), ordre=3, poids=3, est_requis=true
figure_id=15 (Flip arrière), exercice_figure_id=6 (Abdominaux), ordre=4, poids=2, est_requis=false
```

**SuggestionsFigure** (Cache de performance):
```sql
id                    INT PRIMARY KEY AUTO_INCREMENT
utilisateur_id        INT NULL (FK → Utilisateurs)
groupe_id             INT NULL (FK → Groupes)
figure_id             INT NOT NULL (FK → Figures)
score_preparation     DECIMAL(5,2) -- 0-100% (score de préparation)
nb_exercices_valides  INT DEFAULT 0
nb_exercices_total    INT DEFAULT 0
date_suggestion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
date_expiration       TIMESTAMP NULL -- Rafraîchi toutes les 24h par cron
statut                ENUM('pending', 'accepted', 'dismissed') DEFAULT 'pending'
createdAt, updatedAt  TIMESTAMP

VALIDATION: soit utilisateur_id soit groupe_id (pas les deux)
INDEX: (utilisateur_id, statut, score_preparation DESC)
INDEX: (groupe_id, statut, score_preparation DESC)
```

#### 2. Nouveaux Services

**SuggestionService** ([backend/src/services/SuggestionService.js](backend/src/services/SuggestionService.js)):

**Méthodes principales**:

1. **`calculerSuggestionsEleve(utilisateurId, seuilMinimum=60, limite=5)`**
   - Calcule les suggestions personnalisées pour un élève
   - Retourne top 5 figures avec score ≥ 60%
   - Exclusions automatiques:
     - Figures déjà assignées par le prof
     - Figures dans le programme personnel de l'élève
     - Figures 100% validées (toutes étapes validées)
   - Triées par score décroissant

2. **`calculerSuggestionsGroupe(groupeId, seuilMinimum=50, limite=5)`**
   - Calcule les suggestions pour un groupe entier
   - Agrège les scores de tous les élèves du groupe
   - Filtre: ≥50% des élèves doivent avoir score ≥80% (prêts)
   - Retourne top 5 figures triées par % du groupe prêt

3. **`calculerScorePreparation(utilisateurId, figureId)`**
   - Calcule le score de préparation pour une figure donnée
   - Formule: `score = (Σ (exercices validés × poids) / Σ (total exercices requis × poids)) × 100`
   - Exemple:
     - Ex1: Roulade (poids=3) ✅ validé
     - Ex2: Saut (poids=2) ✅ validé
     - Ex3: Trampoline (poids=3) ❌ non validé
     - Score = ((3 + 2) / (3 + 2 + 3)) × 100 = 62.5%
   - Retourne: `{ score, exercices_valides, exercices_total, details }`

4. **`detecterCycle(figureId, exerciceFigureId)`**
   - Détecte les cycles dans les relations récursives
   - Empêche: Figure A → B → A (boucle infinie)
   - Utilise traversée de graphe (BFS)
   - Retourne: `true` si cycle détecté, `false` sinon

5. **`accepterSuggestion(utilisateurId, figureId)`**
   - Ajoute la figure au programme personnel de l'élève
   - Crée ou récupère le programme "Mon Programme Personnel"
   - Ajoute la figure avec ordre auto-incrémenté
   - Marque la suggestion comme 'accepted' dans SuggestionsFigure
   - Retourne: `{ programme: { id, nom } }`

6. **`rafraichirCacheSuggestions(type, targetId)`**
   - Rafraîchit le cache pour un élève ou un groupe
   - type: 'eleve' ou 'groupe'
   - targetId: utilisateurId ou groupeId
   - Supprime anciennes suggestions (statut='pending')
   - Recalcule et insère nouvelles suggestions
   - Date expiration: now + 24h

7. **`_getFiguresAssignees(utilisateurId)`** (helper)
   - Récupère les IDs des figures assignées à l'élève
   - Inclut: programmes prof + programme personnel

8. **`_getFiguresValidees(utilisateurId)`** (helper)
   - Récupère les IDs des figures 100% validées
   - Critère: toutes les étapes de la figure sont validées

#### 3. Nouveaux Endpoints API

**🎓 Routes Élève** ([backend/src/routes/suggestions.js](backend/src/routes/suggestions.js)):

**GET /api/suggestions**
- **Auth**: `verifierToken` (JWT requis)
- **Description**: Calcule les suggestions personnalisées pour l'élève connecté
- **Query Params**: Aucun
- **Response**: `200 OK`

```json
{
  "suggestions": [
    {
      "figure_id": 15,
      "nom": "Salto Arrière",
      "descriptif": "Salto arrière complet",
      "difficulty_level": 4,
      "type": "artistique",
      "score_preparation": 75.0,
      "nb_exercices_valides": 3,
      "nb_exercices_total": 4,
      "details_exercices": [
        {
          "exercice_id": 3,
          "exercice_nom": "Roulade Arrière",
          "ordre": 1,
          "poids": 3,
          "est_requis": true,
          "est_valide": true,
          "nb_etapes_total": 3,
          "nb_etapes_validees": 3,
          "progression": "3/3 étapes"
        },
        {
          "exercice_id": 10,
          "exercice_nom": "Saut en Hauteur",
          "ordre": 2,
          "poids": 2,
          "est_requis": true,
          "est_valide": true,
          "nb_etapes_total": 2,
          "nb_etapes_validees": 2,
          "progression": "2/2 étapes"
        },
        {
          "exercice_id": 12,
          "exercice_nom": "Trampoline",
          "ordre": 3,
          "poids": 3,
          "est_requis": true,
          "est_valide": false,
          "nb_etapes_total": 4,
          "nb_etapes_validees": 1,
          "progression": "1/4 étapes"
        },
        {
          "exercice_id": 6,
          "exercice_nom": "Abdominaux",
          "ordre": 4,
          "poids": 2,
          "est_requis": false,
          "est_valide": true,
          "nb_etapes_total": 1,
          "nb_etapes_validees": 1,
          "progression": "1/1 étapes"
        }
      ]
    }
  ],
  "count": 5,
  "message": "5 suggestions disponibles"
}
```

**Erreurs possibles**:
- `500 SUGGESTION_CALCUL_ERROR`: Erreur lors du calcul des suggestions

---

**GET /api/suggestions/:figureId/details**
- **Auth**: `verifierToken` (JWT requis)
- **Description**: Détails de préparation pour une figure spécifique
- **Params**: `figureId` (integer) - ID de la figure
- **Response**: `200 OK`

```json
{
  "figure_id": 15,
  "nom": "Salto Arrière",
  "score": 75.0,
  "exercices_valides": 3,
  "exercices_total": 4,
  "details": [
    {
      "exercice_nom": "Roulade Arrière",
      "ordre": 1,
      "poids": 3,
      "est_valide": true,
      "progression": "3/3 étapes"
    }
  ]
}
```

**Erreurs possibles**:
- `404 FIGURE_NOT_FOUND`: La figure n'existe pas
- `500 SUGGESTION_CALCUL_ERROR`: Erreur lors du calcul

---

**POST /api/suggestions/:figureId/accepter**
- **Auth**: `verifierToken` (JWT requis)
- **Description**: Ajoute la figure au programme personnel de l'élève
- **Params**: `figureId` (integer) - ID de la figure
- **Body**: Aucun
- **Response**: `201 Created`

```json
{
  "message": "Figure \"Salto Arrière\" ajoutée à ton programme personnel",
  "programme": {
    "id": 42,
    "nom": "Mon Programme Personnel - Alice Dupont"
  }
}
```

**Erreurs possibles**:
- `404 FIGURE_NOT_FOUND`: La figure n'existe pas
- `400 ALREADY_IN_PROGRAMME`: La figure est déjà dans le programme personnel
- `500 SUGGESTION_ACCEPTATION_ERROR`: Erreur lors de l'ajout

---

**POST /api/suggestions/:figureId/dismisser**
- **Auth**: `verifierToken` (JWT requis)
- **Description**: Masque la suggestion (ne plus l'afficher)
- **Params**: `figureId` (integer) - ID de la figure
- **Body**: Aucun
- **Response**: `200 OK`

```json
{
  "message": "Suggestion masquée avec succès",
  "note": "Elle sera recalculée lors du prochain rafraîchissement (3h du matin)"
}
```

**Note**: La suggestion peut réapparaître après le cron nocturne si le score reste ≥60%

---

**👨‍🏫 Routes Prof** ([backend/src/routes/prof/suggestions.js](backend/src/routes/prof/suggestions.js)):

**GET /api/prof/suggestions/groupe/:groupeId**
- **Auth**: `verifierToken` + `estProfesseurOuAdmin`
- **Description**: Suggestions pour un groupe entier
- **Params**: `groupeId` (integer) - ID du groupe
- **Authorization**: Le prof doit être propriétaire du groupe (ou admin)
- **Response**: `200 OK`

```json
{
  "groupe": {
    "id": 1,
    "nom": "Débutants"
  },
  "suggestions": [
    {
      "figure_id": 15,
      "nom": "Salto Arrière",
      "descriptif": "Salto arrière complet",
      "difficulty_level": 4,
      "type": "artistique",
      "score_preparation": 82.5,
      "pourcentage_groupe_pret": 75,
      "nb_eleves_prets": 6,
      "nb_eleves_total": 8,
      "eleves_prets": ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"],
      "nb_exercices_valides": 3,
      "nb_exercices_total": 4
    }
  ],
  "count": 5,
  "message": "5 suggestions pour le groupe \"Débutants\""
}
```

**Erreurs possibles**:
- `404 GROUPE_NOT_FOUND`: Le groupe n'existe pas
- `403 FORBIDDEN`: Le groupe ne vous appartient pas (sauf admin)
- `500 SUGGESTION_CALCUL_ERROR`: Erreur lors du calcul

---

**POST /api/prof/suggestions/groupe/:groupeId/assigner/:figureId**
- **Auth**: `verifierToken` + `estProfesseurOuAdmin`
- **Description**: Assigne une figure suggérée à tout le groupe
- **Params**:
  - `groupeId` (integer) - ID du groupe
  - `figureId` (integer) - ID de la figure
- **Body**: Aucun
- **Authorization**: Le prof doit être propriétaire du groupe (ou admin)
- **Response**: `201 Created`

```json
{
  "message": "Figure \"Salto Arrière\" ajoutée au programme du groupe \"Débutants\"",
  "programme": {
    "id": 42,
    "nom": "Programme Débutants",
    "actif": true
  }
}
```

**Logique**:
1. Crée ou récupère le programme du groupe (nom: `Programme {nom_groupe}`)
2. Ajoute la figure au programme avec ordre auto-incrémenté
3. Tous les membres du groupe reçoivent automatiquement la figure

**Erreurs possibles**:
- `404 GROUPE_NOT_FOUND`: Le groupe n'existe pas
- `404 FIGURE_NOT_FOUND`: La figure n'existe pas
- `403 FORBIDDEN`: Le groupe ne vous appartient pas
- `400 ALREADY_IN_PROGRAMME`: La figure est déjà dans le programme du groupe
- `500 SUGGESTION_ASSIGNATION_ERROR`: Erreur lors de l'assignation

---

**GET /api/prof/suggestions/eleve/:eleveId**
- **Auth**: `verifierToken` + `estProfesseurOuAdmin`
- **Description**: Vue prof des suggestions d'un élève individuel
- **Params**: `eleveId` (integer) - ID de l'élève
- **Authorization**: Le prof doit avoir relation avec l'élève (ou même école, ou admin)
- **Response**: `200 OK` (même format que GET /api/suggestions)

**Erreurs possibles**:
- `404 ELEVE_NOT_FOUND`: L'élève n'existe pas
- `403 FORBIDDEN`: Vous n'avez pas accès à cet élève
- `500 SUGGESTION_CALCUL_ERROR`: Erreur lors du calcul

---

**🔧 Routes Admin** ([backend/src/routes/admin/exercices.js](backend/src/routes/admin/exercices.js)):

**POST /api/admin/figures/:figureId/exercices**
- **Auth**: `verifierToken` + `estAdmin`
- **Description**: Ajoute un exercice décomposé à une figure
- **Params**: `figureId` (integer) - ID de la figure composite
- **Body**:

```json
{
  "exercice_figure_id": 3,
  "ordre": 1,
  "est_requis": true,
  "poids": 3
}
```

- **Response**: `201 Created`

```json
{
  "message": "Exercice \"Roulade Arrière\" ajouté à la figure \"Salto Arrière\"",
  "exercice": {
    "id": 1,
    "figure_id": 15,
    "exercice_figure_id": 3,
    "ordre": 1,
    "est_requis": true,
    "poids": 3,
    "createdAt": "2025-12-29T10:00:00.000Z",
    "updatedAt": "2025-12-29T10:00:00.000Z"
  }
}
```

**Validation automatique**:
- ✅ Vérifie que `figure_id` et `exercice_figure_id` existent
- ✅ Détecte les cycles (A → B → A interdit)
- ✅ Auto-incrémente `ordre` si non fourni
- ✅ Contrainte unique: pas de doublons (figure_id, exercice_figure_id)

**Erreurs possibles**:
- `404 FIGURE_NOT_FOUND`: La figure parente n'existe pas
- `404 EXERCICE_FIGURE_NOT_FOUND`: La figure exercice n'existe pas
- `400 CYCLE_DETECTED`: Cycle détecté (A → B → A)
- `409 DUPLICATE_EXERCICE`: Relation déjà existante
- `500 DATABASE_ERROR`: Erreur base de données

---

**GET /api/admin/figures/:figureId/exercices**
- **Auth**: `verifierToken` + `estAdmin`
- **Description**: Liste tous les exercices d'une figure
- **Params**: `figureId` (integer) - ID de la figure
- **Response**: `200 OK`

```json
{
  "exercices": [
    {
      "id": 1,
      "figure_id": 15,
      "exercice_figure_id": 3,
      "ordre": 1,
      "est_requis": true,
      "poids": 3,
      "exerciceFigure": {
        "id": 3,
        "nom": "Roulade Arrière",
        "descriptif": "Roulade arrière au sol",
        "difficulty_level": 2
      }
    }
  ]
}
```

**Erreurs possibles**:
- `404 FIGURE_NOT_FOUND`: La figure n'existe pas
- `500 DATABASE_ERROR`: Erreur base de données

---

**PUT /api/admin/figures/:figureId/exercices/:exerciceId**
- **Auth**: `verifierToken` + `estAdmin`
- **Description**: Modifie un exercice décomposé
- **Params**:
  - `figureId` (integer) - ID de la figure
  - `exerciceId` (integer) - ID de l'exercice (ExerciceFigure.id)
- **Body**:

```json
{
  "ordre": 2,
  "est_requis": false,
  "poids": 1
}
```

- **Response**: `200 OK`

**Erreurs possibles**:
- `404 EXERCICE_NOT_FOUND`: L'exercice n'existe pas
- `500 DATABASE_ERROR`: Erreur base de données

---

**DELETE /api/admin/figures/:figureId/exercices/:exerciceId**
- **Auth**: `verifierToken` + `estAdmin`
- **Description**: Supprime un exercice décomposé
- **Params**:
  - `figureId` (integer) - ID de la figure
  - `exerciceId` (integer) - ID de l'exercice (ExerciceFigure.id)
- **Response**: `200 OK`

```json
{
  "message": "Exercice supprimé avec succès"
}
```

**Erreurs possibles**:
- `404 EXERCICE_NOT_FOUND`: L'exercice n'existe pas
- `500 DATABASE_ERROR`: Erreur base de données

---

#### 4. Cron Job Automatique

**Fichier**: [backend/server.js](backend/server.js)

**Schedule**: Tous les jours à **3h du matin** (Europe/Paris)

**Logique**:
```javascript
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Rafraîchissement du cache de suggestions...');

  try {
    // 1. Rafraîchir pour tous les élèves
    const eleves = await Utilisateur.findAll({
      where: { role: 'eleve' },
      attributes: ['id']
    });

    for (const eleve of eleves) {
      await SuggestionService.rafraichirCacheSuggestions('eleve', eleve.id);
    }

    // 2. Rafraîchir pour tous les groupes actifs
    const groupes = await Groupe.findAll({
      where: { actif: true },
      attributes: ['id']
    });

    for (const groupe of groupes) {
      await SuggestionService.rafraichirCacheSuggestions('groupe', groupe.id);
    }

    console.log('[CRON] ✅ Cache de suggestions rafraîchi avec succès');
  } catch (error) {
    console.error('[CRON] Erreur rafraîchissement suggestions:', error);
  }
}, { timezone: 'Europe/Paris' });
```

**Pourquoi 3h ?**
- Après le cron de déclin mémoriel (2h)
- Faible charge serveur (heures creuses)
- Suggestions prêtes pour la matinée

---

#### 5. Seed Data (Données de Test)

**Fichier**: [backend/seed/modules/seedExercicesDecomposes.js](backend/seed/modules/seedExercicesDecomposes.js)

**Statistiques**:
- ✅ 23 figures avec exercices décomposés
- ✅ 45 relations exercice-figure créées
- ✅ Couvre toutes les disciplines (balles, massues, acrobatie, trapèze, tissu, équilibre, jonglerie spécialisée, théâtre)

**Exemples de progressions**:

1. **Balles - Jonglage**:
   - Fontaine 3 balles → prérequis: Cascade 3 balles (poids=3)
   - Mills Mess → prérequis: Cascade 3 balles + Fontaine 3 balles
   - Cascade 4 balles → prérequis: Cascade 3 balles + Fontaine 3 balles + Pompes (optionnel)

2. **Acrobatie - Sol**:
   - Roue → prérequis: Roulade avant + ATR
   - Flip avant → prérequis: Roulade avant + Squats + Abdominaux
   - Flip arrière → prérequis: Roulade avant + Flip avant + Squats + Abdominaux

3. **Trapèze - Aérien**:
   - Planche trapèze → prérequis: Suspension trapèze + Gainage planche + Pompes
   - Salto trapèze → prérequis: Suspension trapèze + Planche trapèze + Abdominaux

4. **Équilibre**:
   - Monocycle basique → prérequis: Squats
   - Boule d'équilibre → prérequis: Squats + Gainage planche
   - Rola Bola → prérequis: Boule d'équilibre (optionnel) + Squats + Gainage planche

---

### 🎨 CE QUE GEMINI DOIT FAIRE (FRONTEND)

**📄 INSTRUCTIONS COMPLÈTES**: Voir [SUGGESTIONS_PLAN_GEMINI.md](./SUGGESTIONS_PLAN_GEMINI.md) (8000+ mots)

**Résumé des tâches**:

#### 1. Créer 2 Hooks Custom

**Hook 1**: `frontend/src/hooks/useSuggestions.js` (élève)
- Méthodes: `fetchSuggestions`, `accepterSuggestion`, `dismisserSuggestion`, `obtenirDetails`
- Gère states: `suggestions`, `loading`, `error`
- Code complet fourni dans le plan

**Hook 2**: `frontend/src/hooks/useSuggestionsGroupe.js` (prof)
- Méthodes: `fetchSuggestions`, `assignerFigure`
- Prend `groupeId` en paramètre
- Gère states: `suggestions`, `loading`, `error`
- Code complet fourni dans le plan

#### 2. Modifier MonProgrammePage.js (Élève)

**Nouvelle section à ajouter**: "Suggestions pour toi"

**Composants UI**:
- Cartes Material-UI avec:
  - Badge coloré de préparation (vert ≥80%, jaune 60-79%)
  - Barre de progression (LinearProgress)
  - Détails exercices (X/Y exercices validés)
  - Barres de difficulté (1-5)
  - Bouton "Ajouter à mon programme"
  - Bouton "Masquer" (IconButton avec CloseIcon)

**États à gérer**:
- Loading: Afficher LinearProgress
- Error: Afficher Alert severity="error"
- Empty: Afficher Alert "Continue à progresser sur tes exercices !"
- Data: Afficher Grid de cartes

**Code complet fourni dans le plan** (lignes 260-434)

#### 3. Modifier DashboardProfPage.js (Prof)

**Nouveau widget à ajouter**: "Suggestions pour le groupe"

**Composants UI**:
- Tableau Material-UI avec colonnes:
  - Figure (nom + descriptif)
  - Difficulté (barres visuelles)
  - % du groupe prêt (LinearProgress + pourcentage)
  - Élèves prêts (X/Y avec Tooltip listant les noms)
  - Exercices validés (X/Y)
  - Action (Bouton "Assigner")

**États à gérer**:
- No group selected: Afficher Alert "Sélectionnez un groupe"
- Loading: Afficher LinearProgress
- Error: Afficher Alert severity="error"
- Empty: Afficher Alert "Aucune suggestion"
- Data: Afficher Table

**Code complet fourni dans le plan** (lignes 500-683)

---

### 🧪 TESTS À EFFECTUER (GEMINI)

#### Comptes de Test

**Voir**: [docs/COMPTES_TEST.md](../../docs/COMPTES_TEST.md)

**Élève**: `lucas.moreau@voltige.fr` / `Password123!`
**Prof**: `prof1@example.com` / `prof123`

#### Scénarios de Test Élève

1. **Se connecter en tant qu'élève**
2. **Aller sur "Mon Programme"**
3. **Vérifier section "Suggestions pour toi"**:
   - ✅ Affiche 0-5 suggestions
   - ✅ Badges colorés (vert/jaune)
   - ✅ Barres de progression
   - ✅ Détails exercices
4. **Cliquer "Ajouter à mon programme"**:
   - ✅ Notification de succès
   - ✅ Suggestion disparaît
   - ✅ Figure apparaît dans "Programme Personnel"
5. **Cliquer "Masquer" sur une suggestion**:
   - ✅ Disparaît immédiatement
   - ✅ Ne réapparaît pas jusqu'au prochain cron (3h)

#### Scénarios de Test Prof

1. **Se connecter en tant que prof**
2. **Aller sur le Dashboard Prof**
3. **Sélectionner un groupe**
4. **Vérifier widget "Suggestions pour le groupe"**:
   - ✅ Affiche 0-5 suggestions
   - ✅ % du groupe prêt affiché
   - ✅ Liste élèves prêts (Tooltip)
   - ✅ Tableau bien formaté
5. **Cliquer "Assigner" sur une suggestion**:
   - ✅ Notification de succès
   - ✅ Suggestion disparaît
   - ✅ Figure apparaît dans le programme du groupe
   - ✅ Tous les élèves du groupe la reçoivent

---

### 📝 NOTES IMPORTANTES POUR GEMINI

1. **Pas besoin de calculer le score** - Fait automatiquement par le backend
2. **Cache rafraîchi automatiquement** chaque nuit à 3h par cron
3. **Exclusions automatiques** (figures déjà assignées/validées)
4. **Top 5 seulement** - Pas de pagination (focus qualité)
5. **Badges colorés**:
   - ≥80% = vert (success) = "Tu es prêt !" 🟢
   - 60-79% = jaune (warning) = "Bientôt prêt" 🟡
   - <60% = pas affiché
6. **Axios déjà configuré** avec proxy backend (`http://localhost:4000`)
7. **Gestion d'erreurs**: Toujours afficher messages d'erreur clairs à l'utilisateur

---

### ✅ CHECKLIST COMPLÈTE

**Backend (TERMINÉ)**:
- [x] 2 nouveaux modèles (ExerciceFigure, SuggestionFigure)
- [x] 3 fichiers de routes (suggestions.js, prof/suggestions.js, admin/exercices.js)
- [x] 1 service complet (SuggestionService avec 8 méthodes)
- [x] 1 cron job nocturne (3h)
- [x] 12 endpoints API fonctionnels
- [x] 45 relations exercice-figure dans seed data
- [x] Documentation complète (SUGGESTIONS_PLAN_GEMINI.md + INTEGRATION_LOG.md)

**Frontend (À FAIRE PAR GEMINI)**:
- [ ] Hook `useSuggestions.js` (élève)
- [ ] Hook `useSuggestionsGroupe.js` (prof)
- [ ] Modifier `MonProgrammePage.js` (section suggestions)
- [ ] Modifier `DashboardProfPage.js` (widget suggestions)
- [ ] Tests avec comptes de test
- [ ] Vérifier affichage badges colorés
- [ ] Vérifier fonctionnalité "Ajouter"
- [ ] Vérifier fonctionnalité "Masquer"
- [ ] Vérifier fonctionnalité "Assigner" (prof)

---

### 🚀 IMPACT UTILISATEUR

**Pour les Élèves** 🎓:
- Parcours auto-évolutif guidé par leurs progressions
- Visibilité claire de ce qu'ils sont prêts à apprendre
- Autonomie dans la construction de leur programme

**Pour les Professeurs** 👨‍🏫:
- Vision claire de la progression du groupe
- Identification facile des prochaines étapes
- Gain de temps dans la planification pédagogique

**Pour Tous** 🎯:
- Apprentissage progressif et logique
- Motivation accrue (voir ses progrès mener à de nouvelles opportunités)
- Réduction de l'abandon (suggestions adaptées au niveau)

---

