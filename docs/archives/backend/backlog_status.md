# Backlog Status - Fonctionnalités Incomplètes et Problèmes Identifiés

**Date de génération**: 2026-01-09
**Projet**: Cirque App
**Version**: Monorepo (Backend + Frontend)

---

## 📊 Résumé Exécutif

| Catégorie | Nombre | Priorité Critique |
|-----------|--------|-------------------|
| Commentaires TODO/FIXME | 14 | 2 |
| Erreurs de Tests Critiques | 4 | 4 |
| Services Sans Tests | 11/12 (92%) | Haute |
| Routes Sans Tests | 22/25 (88%) | Haute |
| Fonctionnalités Phase 3 Incomplètes | 4 | Moyenne |
| Erreurs ESLint Frontend | 9 | Basse |
| Documentation Obsolète | Multiple | Moyenne |

---

## 🚨 PROBLÈMES CRITIQUES (Action Immédiate Requise)

### 1. Test `progression.test.js` - Variable Non Définie ❌

**Fichier**: [backend/test/integration/progression.test.js:554](backend/test/integration/progression.test.js)
**Priorité**: **CRITIQUE**

**Problème**:
```javascript
// Ligne 554 - ERREUR: otherEleveFigure n'est pas défini
await request(app)
  .delete(`/api/progression/figure/${otherEleveFigure}`)
  .set('Authorization', `Bearer ${tokens.eleve1}`)
  .expect(200);
```

**Solution**:
```javascript
// Devrait être:
await request(app)
  .delete(`/api/progression/figure/${otherFigure.etapes[0].id}`)
  .set('Authorization', `Bearer ${tokens.eleve1}`)
  .expect(200);
```

**Impact**: Test crashe avec `ReferenceError`, toute la suite échoue.

---

### 2. Import Manquant - Opérateur Sequelize ❌

**Fichier**: [backend/test/integration/progression.test.js:87,101](backend/test/integration/progression.test.js)
**Priorité**: **CRITIQUE**

**Problème**:
```javascript
// Lignes 87, 101 - ERREUR: Op n'est pas importé
where: {
  etape_id: {
    [Op.in]: [etape1.id, etape2.id]
  }
}
```

**Solution**:
```javascript
// Ajouter en haut du fichier:
const { Utilisateur, Figure, EtapeProgression, ProgressionEtape, Op } = require('../../src/models');
```

**Impact**: Test crashe avec `ReferenceError` lors de l'utilisation de `Op.in`.

---

### 3. Blocs de Tests Dupliqués 🔄

**Fichier**: [backend/test/integration/progression.test.js](backend/test/integration/progression.test.js)
**Priorité**: **HAUTE**

**3 blocs de tests entièrement dupliqués**:

1. **Lignes 119-185 ET 153-185** - `describe('GET /api/progression/figure/:figureId/etapes - Données de progression complètes')`
2. **Lignes 187-240 ET 375-425** - `describe('DELETE /api/progression/figure/:etapeId - Suppression de progression')`
3. **Lignes 242-290 ET 427-479** - `describe('POST /api/progression/valider - Validation d\'étape')`

**Impact**: Tests exécutés 2 fois, ralentissement inutile, confusion dans les résultats.

**Solution**: Supprimer les duplications, garder une seule version de chaque bloc.

---

### 4. Logique de Test Contradictoire 🔀

**Fichier**: [backend/test/integration/progression.test.js:235-239](backend/test/integration/progression.test.js)
**Priorité**: **HAUTE**

**Problème**:
```javascript
// Ligne 235-239 - Test attend 200 pour une suppression non autorisée
it('should prevent deleting progression from another student', async () => {
  await request(app)
    .delete(`/api/progression/figure/${otherFigure.etapes[0].id}`)
    .set('Authorization', `Bearer ${tokens.eleve1}`)
    .expect(200); // ❌ ERREUR: Devrait être 403
});
```

**Version correcte (ligne 422-423)**:
```javascript
// Version dupliquée mais CORRECTE
it('should prevent deleting progression from another student', async () => {
  await request(app)
    .delete(`/api/progression/figure/${otherFigure.etapes[0].id}`)
    .set('Authorization', `Bearer ${tokens.eleve1}`)
    .expect(403); // ✅ CORRECT
});
```

**Impact**: Test valide à tort un comportement de sécurité incorrect.

---

## ⚠️ PROBLÈMES HAUTE PRIORITÉ

### 5. Méthode `calculerScoreSecurite()` Cassée

**Fichier**: [backend/src/services/StatsService.js:13](backend/src/services/StatsService.js)
**Priorité**: **HAUTE**

**Code Actuel**:
```javascript
// TODO: Re-implement this logic based on new XP model.
// This KPI is broken because `xp_gagne` was removed from the progression model.
async calculerScoreSecurite(_utilisateurId) {
  return {
    score: 50,
    xp_renforcement: 0,
    xp_total: 0,
    interpretation: this._interpreterScoreSecurite(50)
  };
}
```

**Contexte**: Après refactoring du modèle de progression, le champ `xp_gagne` a été supprimé. La méthode retourne maintenant une valeur dummy (50).

**Impact**: Le KPI "Score de Sécurité" n'est plus fonctionnel dans les statistiques professeur.

**Solution Suggérée**: Recalculer le score à partir des nouvelles tables `ProgressionEtape` et `TentativeEtape`.

---

### 6. Route de Validation en Masse - 404 Error 🔌

**Contexte**: Endpoint documenté mais non fonctionnel (contexte session précédente)

**Route Attendue**: `POST /api/prof/validation/eleves/:eleveId/figures/:figureId`

**Statut**:
- ✅ Code existe dans [backend/src/routes/prof/validation.js](backend/src/routes/prof/validation.js)
- ✅ Documenté dans [backend/docs/INTEGRATION_LOG.md](backend/docs/INTEGRATION_LOG.md)
- ❌ Retourne 404 Not Found lors de l'appel
- ⚠️ Route alternative créée dans [backend/src/routes/prof/eleves.js:35](backend/src/routes/prof/eleves.js) mais toujours 404

**Problème Suspecté**: Conflit de routing Express, ordre des middlewares, ou montage incorrect du sous-routeur.

**Impact**: Frontend ne peut pas valider une figure entière en un seul appel (doit itérer sur chaque étape).

---

### 7. Couverture de Tests Insuffisante 🧪

#### Services Sans Tests (11/12 = 92%)

| Service | Taille | Complexité | Tests |
|---------|--------|------------|-------|
| `DashboardService.js` | 4.7 KB | Moyenne | ❌ 0 |
| `DisciplineAvailabilityService.js` | Nouveau | Moyenne | ❌ 0 |
| `EntrainementService.js` | 6.2 KB | Haute | ❌ 0 |
| `FigureService.js` | 3.8 KB | Haute | ❌ 0 |
| `GamificationService.js` | 9.5 KB | Très Haute | ❌ 0 |
| `GroupeProgrammeService.js` | 3.1 KB | Moyenne | ❌ 0 |
| `InteractionService.js` | 2.8 KB | Moyenne | ❌ 0 |
| `MemoryDecayService.js` | 4.2 KB | Haute | ❌ 0 |
| `ProfService.js` | 5.9 KB | Haute | ❌ 0 |
| `ProgrammeService.js` | 4.5 KB | Haute | ❌ 0 |
| **`SuggestionService.js`** | **16 KB** | **Très Haute** | ❌ 0 |
| `StatsService.js` | 7.3 KB | Très Haute | ✅ Partiel (1 test stubbed) |

**Critique**: `SuggestionService.js` (16 KB, logique complexe de recommandations récursives) n'a AUCUN test.

#### Routes Sans Tests (22/25 = 88%)

**Fichiers avec tests existants**:
- ✅ `utilisateurs.js` (auth.test.js)
- ✅ `figures.js` (permissions-figures.test.js)
- ✅ `disciplines.js` (permissions-disciplines.test.js)

**Fichiers SANS tests** (22 fichiers):
- admin.js, entrainement.js, progression.js, statistiques.js
- prof/dashboard.js, prof/eleves.js, prof/groupes.js, prof/programmes.js, prof/statistiques.js, prof/suggestions.js, prof/validation.js
- gamification/badges.js, gamification/defis.js, gamification/streaks.js, gamification/titres.js
- ... et 7 autres

**Impact**: Risque élevé de régressions non détectées lors de refactorings.

---

## 📋 FONCTIONNALITÉS INCOMPLÈTES (Phase 3)

### 8. Système de Suggestions Intelligentes 🤖

**Statut**: Backend ✅ 100% | Frontend ❌ 0%

**Documentation**: [backend/docs/SUGGESTIONS_PLAN_GEMINI.md](backend/docs/SUGGESTIONS_PLAN_GEMINI.md)

**Backend Implémenté**:
- ✅ Service `SuggestionService.js` (16 KB, logique récursive complète)
- ✅ Routes `/api/prof/suggestions/*` (4 endpoints)
- ✅ Algorithme de recommandation basé prérequis
- ✅ Filtrage par statut progression/groupe/élève
- ✅ Support prérequis récursifs via `ExerciceFigure`

**Frontend Manquant**:
- ❌ Interface de suggestion dans `TeacherDashboardPage`
- ❌ Composants UI pour afficher recommandations
- ❌ Filtres (élève/groupe, statut progression)
- ❌ Intégration des appels API

**Fichiers Frontend à Créer**:
- `frontend/src/components/prof/SuggestionPanel.js`
- `frontend/src/hooks/useSuggestions.js`

**Effort Estimé**: 4-6 heures (composant + intégration dashboard).

---

### 9. Assignations de Programmes - UI Incomplète 📚

**Statut**: Backend ✅ Partiel | Frontend ⚠️ Partiel

**Backend**:
- ✅ Routes CRUD programmes (`/api/prof/programmes`)
- ✅ Assignation programmes à élèves (`POST /api/prof/eleves/:id/programmes/assigner`)
- ✅ Modèles `ProgrammeProf`, `AssignationProgramme`

**Frontend Manquant**:
- ⚠️ Interface de création de programme (existe mais incomplète?)
- ❌ Vue élève pour voir programmes assignés
- ❌ Tracking de progression dans les programmes
- ❌ Dashboard professeur - suivi assignations

**Documentation**: Pas de spécification UI détaillée.

---

### 10. Révision du Système Memory Decay 🧠

**Statut**: Documenté ❌ Non Implémenté

**Documentation**: [docs/PLAN.md:333](docs/PLAN.md) - "Tests: 0 (TODO)"

**Contexte**: Système de dégradation de mémoire existe (`MemoryDecayService.js`, cron quotidien) mais nécessite révision:
- Validation des algorithmes de decay
- Ajout de tests unitaires
- Calibration des seuils (fresh/fragile/stale/forgotten)

**Fichiers Concernés**:
- [backend/src/services/MemoryDecayService.js](backend/src/services/MemoryDecayService.js)
- [backend/server.js:82-85](backend/server.js) (cron job)

**Effort Estimé**: 2-3 jours (tests + calibration + validation médicale).

---

### 11. Analyse de Latéralité 🤸

**Statut**: Documenté ❌ Non Implémenté

**Contexte**: Système de tracking latéralité existe dans modèle (`ProgressionEtape.lateralite`), mais pas d'analytics:
- Pas de stats par latéralité (gauche/droite/bilatéral)
- Pas de détection déséquilibres
- Pas de suggestions pour équilibrer

**Fichiers à Modifier**:
- `backend/src/services/StatsService.js` (ajouter méthode `analyserLateralite()`)
- `frontend/src/pages/prof/StudentAnalyticsModal.js` (ajouter graphique latéralité)

**Effort Estimé**: 1-2 jours.

---

## 🐛 ERREURS FRONTEND (ESLint)

### 12. Imports Material-UI Manquants

**Total**: 9 erreurs dans 4 fichiers

#### [frontend/src/pages/common/FiguresPage.js:136](frontend/src/pages/common/FiguresPage.js)
```javascript
// Ligne 136
<Container maxWidth="lg"> {/* ❌ Container not imported */}
```
**Fix**: `import { Container } from '@mui/material';`

---

#### [frontend/src/pages/common/ListeDisciplinesPage.js:39](frontend/src/pages/common/ListeDisciplinesPage.js)
```javascript
// Ligne 39
<Container maxWidth="lg"> {/* ❌ Container not imported */}
```
**Fix**: `import { Container } from '@mui/material';`

---

#### [frontend/src/pages/eleve/BadgesPage.js:284,300,316](frontend/src/pages/eleve/BadgesPage.js)
```javascript
// Lignes 284, 300, 316
<Grid container spacing={3}> {/* ❌ Grid not imported */}
```
**Fix**: `import { Grid } from '@mui/material';`

---

#### [frontend/src/pages/eleve/TitresPage.js:285,301,319](frontend/src/pages/eleve/TitresPage.js)
```javascript
// Lignes 285, 301, 319
<Grid container spacing={3}> {/* ❌ Grid not imported */}
```
**Fix**: `import { Grid } from '@mui/material';`

---

**Impact**: Code fonctionne probablement en dev (imports globaux?) mais échoue en production.

**Effort de Fix**: 5 minutes (ajouter 4 imports).

---

## 📚 DOCUMENTATION OBSOLÈTE

### 13. Chemins de Fichiers Post-Monorepo 🗂️

**Fichier**: [docs/MISE_A_JOUR_DOCS_TODO.md](docs/MISE_A_JOUR_DOCS_TODO.md)

**Problème**: Restructuration en monorepo (backend/ + frontend/) a rendu obsolètes de nombreux chemins dans la documentation.

**Fichiers à Mettre à Jour**:
- ✅ `README.md` (fait partiellement)
- ⚠️ `docs/PLAN.md` (chemins anciens)
- ⚠️ `docs/FEATURES.md` (chemins anciens)
- ❌ `docs/TESTING.md` (chemins anciens)
- ❌ `docs/STRUCTURE.md` (architecture obsolète)

**Checklist Complète**: Voir [MISE_A_JOUR_DOCS_TODO.md](docs/MISE_A_JOUR_DOCS_TODO.md).

---

### 14. Sécurité - Helmet.js Non Implémenté 🔒

**Fichier**: [docs/SECURITY.md:204](docs/SECURITY.md)

**TODO**:
```markdown
## Security Headers (TODO)

Future implementation: Use Helmet.js for security headers
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy
```

**Impact**: Headers HTTP de sécurité manquants (risque XSS, clickjacking).

**Effort**: 30 minutes (installation + configuration Helmet.js).

---

## 🔍 AUTRES NOTES ET TODO

### Commentaires TODO/FIXME Restants

1. **[backend/src/routes/prof/eleves.js:9-16](backend/src/routes/prof/eleves.js)** - Route de test pour debugging (à supprimer en production)
2. **[backend/src/routes/prof/eleves.js:33](backend/src/routes/prof/eleves.js)** - NOTE: Route DOIT être déclarée AVANT `/:id` pour éviter conflits
3. **[backend/test/unit/StatsService.test.js:71-75](backend/test/unit/StatsService.test.js)** - Test stubbed pour `_trouverFiguresBloquantes()`
4. **[docs/PLAN.md:60](docs/PLAN.md)** - Phase 2.3 Gamification Backend en cours
5. **[docs/PLAN.md:217](docs/PLAN.md)** - Phase 3 Features (4 fonctionnalités incomplètes listées)

---

## 📊 PRIORISATION RECOMMANDÉE

### 🔴 URGENT (Cette Semaine)
1. **Fix test `progression.test.js`** (variable non définie + import manquant) - 30 min
2. **Supprimer blocs de tests dupliqués** - 15 min
3. **Corriger logique test authorization** (expect 403 au lieu de 200) - 5 min
4. **Fix imports ESLint frontend** (4 fichiers) - 5 min
5. **Debug route validation en masse 404** - 2 heures

**Effort Total**: ~3 heures

---

### 🟠 HAUTE PRIORITÉ (Ce Mois)
1. **Implémenter tests services critiques**:
   - `SuggestionService.js` (16 KB, 0 tests) - 1 jour
   - `GamificationService.js` (9.5 KB, 0 tests) - 1 jour
   - `StatsService.js` (compléter + fix `calculerScoreSecurite`) - 1 jour
2. **Frontend système suggestions** (backend 100% ready) - 6 heures
3. **Tests routes prof/** (11 fichiers sans tests) - 2 jours

**Effort Total**: ~5 jours

---

### 🟡 MOYENNE PRIORITÉ (Ce Trimestre)
1. **Révision Memory Decay** (tests + calibration) - 3 jours
2. **Compléter UI assignations programmes** - 2 jours
3. **Analytics latéralité** - 2 jours
4. **Mettre à jour documentation** (MISE_A_JOUR_DOCS_TODO.md) - 1 jour
5. **Implémenter Helmet.js** - 30 min
6. **Tests routes gamification/** (4 fichiers) - 1 jour

**Effort Total**: ~9 jours

---

### 🟢 BASSE PRIORITÉ (Backlog)
1. Tests routes admin/entrainement/statistiques
2. Tests services restants (6 services mineurs)
3. Refactoring route de test debugging (eleves.js:9)

---

## 📈 MÉTRIQUES DE QUALITÉ

| Métrique | Valeur Actuelle | Cible | Statut |
|----------|-----------------|-------|--------|
| **Couverture Tests Services** | 8% (1/12) | 80% | 🔴 Critique |
| **Couverture Tests Routes** | 12% (3/25) | 70% | 🔴 Critique |
| **Erreurs ESLint Frontend** | 9 | 0 | 🟡 Moyen |
| **Tests Cassés** | 4 | 0 | 🔴 Critique |
| **Fonctionnalités Phase 3** | 25% (1/4) | 100% | 🟠 Haut |
| **Documentation À Jour** | 40% | 100% | 🟡 Moyen |

---

## 🎯 OBJECTIFS SPRINT PROCHAIN

### Sprint Goals (2 semaines)
1. ✅ **Qualité**: Passer de 4 tests cassés à 0
2. ✅ **Sécurité**: Fix route validation + test authorization
3. ✅ **Frontend**: Corriger 9 erreurs ESLint
4. 📈 **Coverage**: Ajouter tests pour 3 services critiques (Suggestion, Gamification, Stats)
5. 🚀 **Features**: Implémenter frontend système suggestions

### Definition of Done
- ✅ Tous les tests passent (0 erreurs)
- ✅ ESLint clean (0 erreurs frontend)
- ✅ Route validation en masse fonctionnelle
- ✅ 3 services ont >80% coverage
- ✅ Frontend suggestions déployé en staging

---

## 📝 NOTES DE SESSION

**Contexte**: Ce backlog a été généré suite à une analyse exhaustive du projet incluant:
- Scan complet des commentaires TODO/FIXME/NOTE
- Analyse détaillée des fichiers de tests (statut, duplications, erreurs)
- Revue de la documentation (PLAN.md, FEATURES.md, INTEGRATION_LOG.md)
- Scan des erreurs ESLint frontend

**Agents Utilisés**: 3 agents d'exploration parallèles (TODO scanner, Test analyzer, Feature checker)

**Session Date**: 2026-01-09

---

**Fichier Généré Par**: Claude Code (AI Assistant)
**Dernière Mise à Jour**: 2026-01-09
