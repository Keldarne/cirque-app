# Integration Log - Backend ↔ Frontend

Ce fichier documente les changements backend qui impactent le frontend et permet de synchroniser les besoins entre les deux parties.

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

### 📅 2025-12-25 - Partage Multi-Professeurs ✅

### ✅ Modifications Backend Complétées
... (contenu précédent conservé) ...