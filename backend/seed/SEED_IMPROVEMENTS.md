# Améliorations du Système de Seed - Journaux de Progression Riches

**Date**: 2025-12-25
**Objectif**: Créer des données de test réalistes pour les journaux de progression

---

## 🎯 Problèmes Résolus

### Avant
- ❌ Seulement 1-5 progressions par élève avaient des tentatives
- ❌ Nombre limité de tentatives (1-12 max)
- ❌ Timestamps tous identiques ou peu variés
- ❌ Pas de progressions "en_cours" avec historique
- ❌ Pas de progression visible dans les scores/durées

### Après
- ✅ 60-80% des progressions ont des tentatives (selon profil)
- ✅ Jusqu'à 20 tentatives par progression pour profil "high grit"
- ✅ Timestamps réalistes groupés en sessions d'entraînement
- ✅ 15% des progressions sont "en_cours" avec tentatives récentes
- ✅ Progression visible: scores augmentent, durées augmentent

---

## 📊 Nouveaux Profils d'Élèves

### 1. High Grit (20% des élèves)
- **Tentatives par étape**: 8-20
- **Taux d'échec**: 60%
- **Couverture**: 80% des progressions ont des tentatives
- **Pattern**: Beaucoup d'échecs avant de réussir, persistant

### 2. Talent Naturel (15% des élèves)
- **Tentatives par étape**: 1-4
- **Taux d'échec**: 15%
- **Couverture**: 60% des progressions ont des tentatives
- **Pattern**: Réussit rapidement, peu d'échecs

### 3. Normal (65% des élèves)
- **Tentatives par étape**: 3-12
- **Taux d'échec**: 40%
- **Couverture**: 70% des progressions ont des tentatives
- **Pattern**: Apprentissage standard avec échecs et succès

---

## 🕐 Timestamps Réalistes

### Fonction: `generateAttemptTimestamps(nbTentatives, daysAgo)`

Simule des sessions d'entraînement réalistes:

```javascript
// Exemple pour 10 tentatives sur 30 jours
generateAttemptTimestamps(10, 30)

// Génère 2-5 sessions d'entraînement
// Chaque session:
//   - À un jour différent (dans les 30 derniers jours)
//   - Entre 8h et 22h
//   - Tentatives espacées de 2-10 minutes
```

**Résultat**:
```
Session 1 (Il y a 28 jours, 10h15):
  - Tentative 1: 10h15
  - Tentative 2: 10h22
  - Tentative 3: 10h29

Session 2 (Il y a 15 jours, 18h30):
  - Tentative 4: 18h30
  - Tentative 5: 18h37
  - Tentative 6: 18h44

Session 3 (Il y a 3 jours, 14h00):
  - Tentative 7: 14h00
  - Tentative 8: 14h08
  - Tentative 9: 14h15
  - Tentative 10: 14h23
```

---

## 📈 Progression Visible dans les Données

### Mode Evaluation
Les scores augmentent avec la pratique:
- **Premières tentatives**: Score 1-2 (Échec/Instable)
- **Tentatives du milieu**: Score 2 (Instable)
- **Dernières tentatives**: Score 2-3 (Instable/Maîtrisé)

```javascript
// Calcul du score avec progression
const progressRatio = tentativeIndex / (nbTentatives - 1);
score = progressRatio > 0.6 ? 3 : 2; // Après 60% du parcours → Maîtrisé
```

### Mode Durée
Les durées augmentent avec la pratique:
- **Premières tentatives**: ~30 secondes
- **Tentatives du milieu**: ~2 minutes
- **Dernières tentatives**: ~5 minutes

```javascript
// Calcul de la durée avec progression
const progressRatio = tentativeIndex / (nbTentatives - 1);
duree = 30 + (300 - 30) * progressRatio + randomInt(-10, 20);
```

---

## 🎨 Distribution des États de Progression

Pour chaque élève, les progressions sont réparties en:
- **Validées**: Nombre défini par le scénario (timestamps fournis)
- **En cours**: 15% des progressions restantes
- **Non commencées**: Le reste

**Exemple** pour un élève avec 30 progressions:
- 15 validées (selon scénario)
- 2-3 en cours (15% de 15 restantes)
- 12-13 non commencées

---

## 🔍 Cas d'Usage pour Tests

### 1. Tester le Journal de Progression
```javascript
// GET /api/entrainement/tentatives/:etapeId
// Retournera maintenant 3-20 tentatives avec:
// - Timestamps variés sur plusieurs jours
// - Mélange de succès et échecs
// - Progression visible dans les scores/durées
```

### 2. Tester les Statistiques de Grit
```javascript
// GET /api/progression/grit-score?utilisateurId=X
// Les élèves "high_grit" auront:
// - Plus de tentatives totales
// - Ratio échec/succès plus élevé
// - Score de persévérance élevé
```

### 3. Tester l'Historique Global
```javascript
// GET /api/entrainement/historique/utilisateur/:id
// Retournera des activités sur plusieurs semaines
// Avec des pics d'activité certains jours (sessions)
```

### 4. Tester les Progressions en Cours
```javascript
// GET /api/progression/utilisateur/:id
// Affichera des étapes avec statut "en_cours"
// Qui ont des tentatives récentes (derniers 7 jours)
```

---

## 📝 Exemples de Données Générées

### Élève "High Grit" - Lucas (Jonglage)

**Progression sur "Cascade 3 balles - Étape 2"**:
- **Statut**: Validé
- **Nombre de tentatives**: 15
- **Sessions**: 4 (réparties sur 25 jours)

```json
[
  { "date": "2025-11-28 10:15", "type": "evaluation", "score": 1, "reussie": false },
  { "date": "2025-11-28 10:22", "type": "evaluation", "score": 1, "reussie": false },
  { "date": "2025-11-28 10:30", "type": "evaluation", "score": 2, "reussie": true },

  { "date": "2025-12-05 18:45", "type": "evaluation", "score": 1, "reussie": false },
  { "date": "2025-12-05 18:52", "type": "evaluation", "score": 2, "reussie": true },
  { "date": "2025-12-05 19:00", "type": "evaluation", "score": 2, "reussie": true },

  { "date": "2025-12-15 14:20", "type": "evaluation", "score": 1, "reussie": false },
  { "date": "2025-12-15 14:28", "type": "evaluation", "score": 2, "reussie": true },
  { "date": "2025-12-15 14:35", "type": "evaluation", "score": 2, "reussie": true },
  { "date": "2025-12-15 14:43", "type": "evaluation", "score": 3, "reussie": true },

  { "date": "2025-12-23 11:10", "type": "evaluation", "score": 2, "reussie": true },
  { "date": "2025-12-23 11:18", "type": "evaluation", "score": 3, "reussie": true },
  { "date": "2025-12-23 11:25", "type": "evaluation", "score": 3, "reussie": true },
  { "date": "2025-12-23 11:32", "type": "evaluation", "score": 3, "reussie": true },
  { "date": "2025-12-23 11:40", "type": "evaluation", "score": 3, "reussie": true }
]
```

**Pattern visible**: Échecs au début → Instable au milieu → Maîtrisé à la fin

---

### Élève "Talent Naturel" - Emma (Aérien)

**Progression sur "Trapèze - Étape 1"**:
- **Statut**: Validé
- **Nombre de tentatives**: 3
- **Sessions**: 2 (réparties sur 10 jours)

```json
[
  { "date": "2025-12-15 16:30", "type": "duree", "duree_secondes": 45, "reussie": true },

  { "date": "2025-12-22 15:20", "type": "duree", "duree_secondes": 120, "reussie": true },
  { "date": "2025-12-22 15:28", "type": "duree", "duree_secondes": 180, "reussie": true }
]
```

**Pattern visible**: Réussite rapide, peu de tentatives

---

## 🚀 Impact sur les Tests

### Avant
```bash
cd backend && npm run reset-and-seed
# Créait ~200-300 tentatives au total
# Journaux pauvres, peu exploitables
```

### Après
```bash
cd backend && npm run reset-and-seed
# Crée ~2000-4000 tentatives au total
# Journaux riches, patterns réalistes
# 15% des progressions en cours
# Timestamps sur 30 jours
```

---

## ✅ Validation

Pour vérifier que le seed fonctionne:

```bash
cd backend
npm run reset-and-seed

# Vérifier les stats dans les logs:
# ✓ Total: ~3000+ tentatives créées
# - High Grit: ~4 élèves (8-20 tentatives/étape, 80% progressions)
# - Talent Naturel: ~3 élèves (1-4 tentatives/étape, 60% progressions)
# - Normal: ~13 élèves (3-12 tentatives/étape, 70% progressions)
```

### Test Manuel API

```bash
# 1. Trouver un élève
curl http://localhost:4000/api/utilisateurs/login -H "Content-Type: application/json" \
  -d '{"email":"lucas.moreau@voltige.fr","mot_de_passe":"Eleve123!"}'

# 2. Récupérer ses progressions
curl http://localhost:4000/api/progression/utilisateur/4 \
  -H "Authorization: Bearer <token>"

# 3. Prendre une étape en cours et voir son historique
curl http://localhost:4000/api/entrainement/tentatives/35 \
  -H "Authorization: Bearer <token>"

# Devrait retourner 3-20 tentatives avec timestamps variés
```

---

## 📚 Fichiers Modifiés

1. **`backend/seed/modules/seedProgressions.js`**
   - Ajout de progressions "en_cours" (15% des progressions non validées)
   - Logs améliorés avec compteurs par statut

2. **`backend/seed/modules/seedTentatives.js`**
   - Nouvelle fonction `generateAttemptTimestamps()` pour timestamps réalistes
   - Augmentation des nombres de tentatives (jusqu'à 20 pour high_grit)
   - Tentatives créées pour progressions validées ET en_cours
   - Progression visible dans scores et durées
   - Bulk insert pour performance
   - Logs améliorés avec détails des patterns

---

**Résultat**: Les journaux de progression sont maintenant exploitables pour des tests réalistes du frontend et des analyses statistiques pertinentes.
