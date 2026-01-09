# Integration Log - Backend ↔ Frontend

Ce fichier documente les changements backend qui impactent le frontend et permet de synchroniser les besoins entre les deux parties.

---

## 📝 DEMANDES FRONTEND (Résolu - Validation Figure en Masse)

### 👤 Émetteur
**Développeur**: Gemini Frontend Agent
**Status**: ✅ **RÉSOLU** - Endpoint de validation en masse implémenté

### 📋 Contexte
Dans le tableau de bord professeur (`TeacherDashboardPage` et `StudentAnalyticsModal`), il est possible de valider manuellement une figure entière pour un élève.
Auparavant, le frontend devait itérer sur chaque étape et appeler `POST /api/progression/etape/:etapeId/valider`.
Si l'élève n'avait jamais commencé la figure (aucune entrée dans `ProgressionEtape`), la validation échouait car l'endpoint existant requiert une progression existante.

### ✅ Implémentation (Backend)

#### Route: `backend/src/routes/prof/eleves.js`

**POST `/api/prof/validation/eleves/:eleveId/figures/:figureId`**
- **Permissions**: Professeur (lié à l'élève) ou Admin via middlewares `verifierToken`, `estProfesseurOuAdmin`, `verifierRelationProfEleve`.
- **Description**: Valide instantanément **toutes** les étapes d'une figure pour un élève.
- **Logique**:
    1. ✅ Vérifier relation prof-élève (middleware `verifierRelationProfEleve`).
    2. ✅ Récupérer toutes les `EtapeProgression` de la figure.
    3. ✅ Pour chaque étape :
        - Utiliser `findOrCreate` pour créer `ProgressionEtape` si elle n'existe pas.
        - Mettre à jour `statut` = `'valide'`, `date_validation` = `NOW()`, `valide_par_prof_id` = `req.user.id`, `decay_level` = `'fresh'`.
    4. ✅ Transaction Sequelize pour garantir l'atomicité.
- **Réponse**: `200 OK` avec résumé détaillé.

**Exemple de réponse**:
```json
{
  "message": "Figure \"Poirier\" validée avec succès",
  "figure": {
    "id": 1,
    "nom": "Poirier"
  },
  "summary": {
    "total_etapes": 5,
    "nouvelles_validations": 3,
    "mises_a_jour": 2
  },
  "etapes_validees": [
    { "etape_id": 1, "titre": "Position de base", "ordre": 1 },
    { "etape_id": 2, "titre": "Contre le mur", "ordre": 2 },
    { "etape_id": 3, "titre": "5 secondes autonome", "ordre": 3 },
    { "etape_id": 4, "titre": "10 secondes autonome", "ordre": 4 },
    { "etape_id": 5, "titre": "Marcher en poirier", "ordre": 5 }
  ]
}
```

**Codes d'erreur**:
- `400`: IDs invalides ou figure sans étapes
- `403`: Professeur non lié à l'élève (ou non admin)
- `404`: Figure non trouvée
- `500`: Erreur serveur

### 💡 Avantages pour le Frontend
1. **Validation simplifiée**: Un seul appel API au lieu de N appels (un par étape).
2. **Gestion automatique**: Crée les `ProgressionEtape` manquantes à la volée (via `findOrCreate`).
3. **Cas "Figure non commencée"**: Fonctionne même si l'élève n'a jamais touché la figure.
4. **Atomicité**: Transaction garantit que toutes les étapes sont validées ou aucune (pas d'état partiel).
5. **Résumé détaillé**: Le frontend peut afficher le nombre d'étapes créées vs mises à jour.

### 📝 Notes d'Intégration Frontend
- **Endpoint**: `POST /api/prof/validation/eleves/:eleveId/figures/:figureId`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Aucun (tout est dans les params d'URL)
- **Utilisation**: Dans `TeacherDashboardPage` ou `StudentAnalyticsModal`, lors du clic sur "Valider la figure entière".

**Exemple d'utilisation**:
```javascript
const validateEntireFigure = async (eleveId, figureId) => {
  try {
    const response = await fetch(`/api/prof/validation/eleves/${eleveId}/figures/${figureId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la validation');
    }

    const data = await response.json();
    console.log(data.message); // "Figure "Poirier" validée avec succès"
    console.log(`${data.summary.total_etapes} étapes validées`);

    // Rafraîchir les données de progression de l'élève
    // ...
  } catch (error) {
    console.error('Erreur validation figure:', error);
    alert(error.message);
  }
};
```

---

---

## 🚨 [2026-01-09] CORRECTIONS URGENTES - Erreurs Frontend ESLint

### 👤 Émetteur
**Développeur**: Claude Code - Analyse Backlog
**Status**: ⚠️ **À CORRIGER** - 9 erreurs ESLint bloquantes

### 📋 Problème
Lors de l'analyse du backlog, 4 fichiers frontend ont été identifiés avec des imports Material-UI manquants, causant potentiellement des erreurs en production.

### ✅ Fichiers à Corriger

#### 1. `frontend/src/pages/common/FiguresPage.js:136`
**Erreur**: `Container` utilisé mais non importé.

**Correction**:
```javascript
// AVANT (ligne d'import Material-UI):
import { Box, Typography, Grid, Button } from '@mui/material';

// APRÈS:
import { Box, Typography, Grid, Button, Container } from '@mui/material';
//                                          ↑ Ajouter Container
```

---

#### 2. `frontend/src/pages/common/ListeDisciplinesPage.js:39`
**Erreur**: `Container` utilisé mais non importé.

**Correction**:
```javascript
// AVANT:
import { Box, Typography } from '@mui/material';

// APRÈS:
import { Box, Typography, Container } from '@mui/material';
//                         ↑ Ajouter Container
```

---

#### 3. `frontend/src/pages/eleve/BadgesPage.js:284,300,316`
**Erreur**: `Grid` utilisé aux lignes 284, 300, 316 mais non importé.

**Correction**:
```javascript
// AVANT:
import { Box, Typography, Chip } from '@mui/material';

// APRÈS:
import { Box, Typography, Chip, Grid } from '@mui/material';
//                               ↑ Ajouter Grid
```

---

#### 4. `frontend/src/pages/eleve/TitresPage.js:285,301,319`
**Erreur**: `Grid` utilisé aux lignes 285, 301, 319 mais non importé.

**Correction**:
```javascript
// AVANT:
import { Box, Typography, Chip } from '@mui/material';

// APRÈS:
import { Box, Typography, Chip, Grid } from '@mui/material';
//                               ↑ Ajouter Grid
```

---

### 📝 Notes d'Intégration Frontend

**Action Requise**: Ajouter les imports manquants dans les 4 fichiers listés ci-dessus.

**Validation**:
```bash
cd frontend
npx eslint "src/**/*.js"
# Devrait retourner 0 erreurs après correction
```

**Priorité**: 🔴 **URGENTE** - Ces erreurs peuvent causer des crashes en production si les imports globaux ne sont pas disponibles.

**Temps Estimé**: 5 minutes (1 ligne par fichier).

---

## 🎯 [2026-01-09] NOUVELLE FONCTIONNALITÉ - Système de Suggestions Intelligentes

### 👤 Émetteur
**Développeur**: Backend Team
**Status**: ✅ **BACKEND PRÊT** | ⏳ **FRONTEND À IMPLÉMENTER** (0%)

### 📋 Contexte
Le système de suggestions intelligentes analyse la progression d'un élève et recommande les figures suivantes à travailler en fonction de:
- Prérequis validés/manquants
- Niveau de l'élève (novice/intermédiaire/expert)
- Figures déjà maîtrisées
- Algorithme de pertinence basé sur `ExerciceFigure` (décomposition récursive)

### ✅ Backend Implémenté (100%)

#### Routes Disponibles

**1. GET `/api/prof/suggestions/eleve/:eleveId`**
- **Permissions**: Professeur (lié à l'élève) ou Admin
- **Query Params**:
  - `niveau` (optionnel): `novice` | `intermediaire` | `expert`
  - `limit` (optionnel): Nombre max de suggestions (défaut: 10)
- **Description**: Retourne suggestions personnalisées pour un élève.

**Exemple de réponse**:
```json
{
  "suggestions": [
    {
      "figure": {
        "id": 5,
        "nom": "Roue",
        "discipline_id": 1,
        "difficulty_level": 2
      },
      "score_pertinence": 85,
      "raison": "Prérequis validés récemment",
      "prerequis_manquants": [],
      "prerequis_valides": [
        { "id": 1, "nom": "Poirier" }
      ]
    },
    {
      "figure": {
        "id": 8,
        "nom": "Flip avant",
        "discipline_id": 1,
        "difficulty_level": 3
      },
      "score_pertinence": 65,
      "raison": "Progression naturelle",
      "prerequis_manquants": [
        { "id": 7, "nom": "Roulade avant" }
      ],
      "prerequis_valides": [
        { "id": 1, "nom": "Poirier" },
        { "id": 5, "nom": "Roue" }
      ]
    }
  ],
  "eleve": {
    "id": 4,
    "nom": "Dupont",
    "prenom": "Marie"
  }
}
```

---

**2. GET `/api/prof/suggestions/groupe/:groupeId`**
- **Permissions**: Professeur (créateur du groupe) ou Admin
- **Query Params**: Mêmes que route élève
- **Description**: Suggestions agrégées pour un groupe d'élèves.

**Réponse**: Même structure, avec suggestions communes à plusieurs élèves du groupe.

---

### 📝 Notes d'Intégration Frontend

#### Composants à Créer

**1. Hook `useSuggestions`**

**Fichier**: `frontend/src/hooks/useSuggestions.js` (NOUVEAU)

```javascript
import { useState, useEffect } from 'react';

export function useSuggestions(eleveId, groupeId = null, filters = {}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const endpoint = groupeId
          ? `/api/prof/suggestions/groupe/${groupeId}`
          : `/api/prof/suggestions/eleve/${eleveId}`;

        const params = new URLSearchParams();
        if (filters.niveau) params.append('niveau', filters.niveau);
        if (filters.limit) params.append('limit', filters.limit);

        const res = await fetch(`${endpoint}?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!res.ok) throw new Error('Erreur chargement suggestions');

        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eleveId || groupeId) {
      fetchSuggestions();
    }
  }, [eleveId, groupeId, filters]);

  return { suggestions, loading, error };
}
```

---

**2. Composant `SuggestionPanel`**

**Fichier**: `frontend/src/components/prof/SuggestionPanel.js` (NOUVEAU)

**Features Requises**:
- ✅ Afficher liste suggestions triées par `score_pertinence` (ordre décroissant)
- ✅ Filtres: Niveau (novice/intermédiaire/expert), limite
- ✅ Pour chaque suggestion:
  - Nom figure + discipline
  - Score de pertinence (barre de progression ou badge)
  - Raison de la suggestion
  - Prérequis manquants (chips rouges) vs validés (chips vertes)
  - Bouton "Assigner au programme" (appel `POST /api/prof/eleves/:id/programmes/assigner`)
- ✅ Loading states et error handling
- ✅ Empty state si aucune suggestion

**Design Recommandé**:
```jsx
<Box>
  {/* Filtres */}
  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel>Niveau</InputLabel>
      <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
        <MenuItem value="">Tous</MenuItem>
        <MenuItem value="novice">Novice</MenuItem>
        <MenuItem value="intermediaire">Intermédiaire</MenuItem>
        <MenuItem value="expert">Expert</MenuItem>
      </Select>
    </FormControl>
  </Box>

  {/* Liste Suggestions */}
  {suggestions.length === 0 ? (
    <Alert severity="info">Aucune suggestion disponible pour cet élève.</Alert>
  ) : (
    <List>
      {suggestions.map(suggestion => (
        <Card key={suggestion.figure.id} sx={{ mb: 2 }}>
          <CardContent>
            {/* Nom + Score */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">{suggestion.figure.nom}</Typography>
              <Chip
                label={`${suggestion.score_pertinence}%`}
                color={suggestion.score_pertinence > 70 ? 'success' : 'default'}
              />
            </Box>

            {/* Raison */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {suggestion.raison}
            </Typography>

            {/* Prérequis */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption">Prérequis validés:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                {suggestion.prerequis_valides.map(pre => (
                  <Chip key={pre.id} label={pre.nom} size="small" color="success" />
                ))}
              </Box>
            </Box>

            {suggestion.prerequis_manquants.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption">Prérequis manquants:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                  {suggestion.prerequis_manquants.map(pre => (
                    <Chip key={pre.id} label={pre.nom} size="small" color="error" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Actions */}
            <Button
              variant="contained"
              size="small"
              onClick={() => handleAssigner(suggestion.figure.id)}
            >
              Assigner au programme
            </Button>
          </CardContent>
        </Card>
      ))}
    </List>
  )}
</Box>
```

---

**3. Intégration dans `TeacherDashboardPage`**

**Fichier**: `frontend/src/pages/prof/TeacherDashboardPage.js` (MODIFIER)

**Ajouts**:
1. Nouvel onglet "Suggestions" dans la navigation tabs existante
2. Afficher `<SuggestionPanel eleveId={selectedStudent.id} />` dans l'onglet
3. Optionnel: Afficher top 3 suggestions dans `StudentAnalyticsModal` (section dédiée)

**Exemple**:
```jsx
// Dans TeacherDashboardPage:
const [currentTab, setCurrentTab] = useState(0);

<Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)}>
  <Tab label="Vue d'ensemble" />
  <Tab label="Progression" />
  <Tab label="Suggestions" />  {/* NOUVEAU */}
</Tabs>

{currentTab === 2 && selectedStudent && (
  <SuggestionPanel eleveId={selectedStudent.id} />
)}
```

---

### 💡 Avantages pour le Frontend

1. **Recommandations Intelligentes**: Algorithme backend analyse automatiquement les prérequis.
2. **Gain de Temps Prof**: Pas besoin de chercher manuellement quelles figures suggérer.
3. **Personnalisation**: Filtres par niveau permettent d'adapter aux capacités élève.
4. **Progression Naturelle**: Suggestions suivent l'arbre de dépendances `ExerciceFigure`.
5. **Assignation Rapide**: Bouton direct pour ajouter figure au programme élève.

### 🚀 Priorité et Effort

**Priorité**: 🟡 **HAUTE** (Backend 100% prêt, valeur ajoutée importante pour profs)

**Effort Estimé**:
- Hook `useSuggestions`: 1-2 heures
- Composant `SuggestionPanel`: 3-4 heures
- Intégration dashboard: 1-2 heures
- **Total**: 6-8 heures

**Dépendances**: Aucune (système complètement additionnel).

---

## 🎯 [2026-01-09] BACKEND 100% COMPLET - 9 Nouvelles Routes Testées

### 👤 Émetteur
**Développeur**: Claude Code - Backend Completion Sprint
**Status**: ✅ **BACKEND PRÊT** | ⏳ **FRONTEND À IMPLÉMIER** (0%)

### 📋 Contexte
Sprint de complétion backend : création de **9 nouveaux fichiers de tests routes** (508 lignes) pour atteindre **100% couverture routes** (22/22). Toutes les routes sont maintenant testées, documentées, et prêtes pour intégration frontend.

---

## Route 1: Disciplines (Catalogue Public)

### Endpoints

**GET `/api/disciplines`**
- **Permissions**: Authentifié (élève, prof, admin)
- **Description**: Liste complète des disciplines du catalogue
- **Réponse**:
```json
[
  {
    "id": 1,
    "nom": "Acrobatie",
    "description": "Sol, équilibre, figures acrobatiques",
    "image_url": "https://...",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "nom": "Jonglerie",
    "description": "Balles, massues, anneaux",
    "image_url": "https://..."
  }
]
```

**GET `/api/disciplines/:id`**
- **Permissions**: Authentifié
- **Description**: Détails d'une discipline avec figures associées
- **Réponse**:
```json
{
  "id": 1,
  "nom": "Acrobatie",
  "description": "...",
  "Figures": [
    {
      "id": 1,
      "nom": "Poirier",
      "difficulty_level": 2,
      "image_url": "..."
    },
    {
      "id": 2,
      "nom": "Roue",
      "difficulty_level": 2
    }
  ]
}
```

### Notes d'Intégration Frontend
- **Fichier**: `frontend/src/pages/common/ListeDisciplinesPage.js` (déjà existe)
- **Action**: Utiliser `GET /api/disciplines` pour charger la liste
- **Loading State**: Afficher skeleton pendant chargement
- **Error Handling**: Afficher Alert si erreur réseau

---

## Route 2: Progression Utilisateur

### Endpoint

**GET `/api/progression/utilisateur/:utilisateurId`**
- **Permissions**: Élève (sa propre progression) OU Professeur (élèves de son école) OU Admin
- **Description**: Récupère toutes les progressions d'étapes d'un utilisateur
- **Réponse**:
```json
[
  {
    "id": 1,
    "utilisateur_id": 4,
    "etape_id": 1,
    "statut": "valide",
    "date_debut": "2026-01-01T10:00:00.000Z",
    "date_validation": "2026-01-05T14:30:00.000Z",
    "tentatives": 5,
    "decay_level": "fresh",
    "etape": {
      "id": 1,
      "titre": "Position de base",
      "ordre": 0,
      "xp": 10,
      "figure": {
        "id": 1,
        "nom": "Poirier",
        "Discipline": {
          "id": 1,
          "nom": "Acrobatie"
        }
      }
    }
  }
]
```

### Permissions
- **Élève**: Peut seulement consulter `req.user.id === utilisateurId`
- **Professeur**: Peut consulter élèves de son école (vérification `ecole_id`)
- **Admin**: Accès total

### Notes d'Intégration Frontend
- **Fichier**: Nouveau composant `StudentProgressionPage.js` ou intégrer dans dashboard existant
- **Usage**: Afficher timeline progression avec filtres par discipline/statut
- **Visualisation**: Utiliser composant Timeline Material-UI ou custom progress bar

---

## Route 3: Suggestions Élève (Recommandations)

### Endpoints

**GET `/api/suggestions`**
- **Permissions**: Authentifié (élève uniquement)
- **Description**: Suggestions personnalisées pour l'élève connecté (top 5, score ≥ 60%)
- **Réponse**:
```json
{
  "suggestions": [
    {
      "figure_id": 5,
      "nom": "Roue",
      "descriptif": "...",
      "difficulty_level": 2,
      "score_preparation": 85,
      "exercices_valides": 4,
      "exercices_total": 5,
      "badge": "prêt"
    }
  ],
  "count": 5,
  "message": "5 suggestions disponibles"
}
```

**GET `/api/suggestions/:figureId/details`**
- **Permissions**: Authentifié (élève)
- **Description**: Détails de préparation pour une figure spécifique
- **Réponse**:
```json
{
  "figure_id": 5,
  "score_preparation": 85,
  "exercices_valides": 4,
  "exercices_total": 5,
  "details": [
    {
      "exercice_id": 1,
      "exercice_nom": "Poirier",
      "statut": "valide",
      "progression_pct": 100
    }
  ],
  "message": "Tu es prêt pour cette figure !"
}
```

**POST `/api/suggestions/:figureId/accepter`**
- **Permissions**: Authentifié (élève)
- **Body**: Aucun
- **Description**: Ajoute la figure au programme personnel de l'élève
- **Réponse**:
```json
{
  "message": "Figure ajoutée à ton programme personnel",
  "programme": {
    "id": 1,
    "nom": "Programme Personnel"
  }
}
```

**POST `/api/suggestions/:figureId/dismisser`**
- **Permissions**: Authentifié (élève)
- **Body**: Aucun
- **Description**: Masque une suggestion (ne plus l'afficher)
- **Réponse**:
```json
{
  "message": "Suggestion masquée",
  "updated": true
}
```

### Notes d'Intégration Frontend
- **Fichier**: Nouveau composant `StudentSuggestionsPage.js`
- **Features**:
  - Liste suggestions avec badges (≥80% = "Prêt", 60-79% = "Bientôt prêt")
  - Boutons "Accepter" / "Ignorer"
  - Détails exercices manquants/validés
  - Empty state si aucune suggestion
- **Design**: Cards Material-UI avec progress bars pour score_preparation

---

## Route 4: Prof - Gestion Groupes

### Endpoints

**POST `/api/prof/groupes`**
- **Permissions**: Professeur ou Admin
- **Body**:
```json
{
  "nom": "Groupe Débutants 2026",
  "description": "Élèves débutants année 2026",
  "couleur": "#ff5722"
}
```
- **Réponse**:
```json
{
  "message": "Groupe créé avec succès",
  "groupe": {
    "id": 5,
    "professeur_id": 2,
    "nom": "Groupe Débutants 2026",
    "couleur": "#ff5722",
    "actif": true
  }
}
```

**GET `/api/prof/groupes`**
- **Permissions**: Professeur ou Admin
- **Description**: Liste tous les groupes du professeur
- **Réponse**:
```json
{
  "groupes": [
    {
      "id": 1,
      "nom": "Groupe A",
      "couleur": "#1976d2",
      "nb_eleves": 12,
      "eleves": [...]
    }
  ]
}
```

### Notes d'Intégration Frontend
- **Fichier**: `frontend/src/pages/prof/GroupesPage.js` (NOUVEAU)
- **Features**:
  - Formulaire création groupe (nom, description, couleur picker)
  - Liste groupes avec couleurs (chips Material-UI)
  - Gestion membres groupe (ajouter/retirer élèves)
  - Statistiques par groupe

---

## Route 5: Prof - Programmes Personnalisés

### Endpoints

**POST `/api/prof/programmes`**
- **Permissions**: Professeur ou Admin
- **Body**:
```json
{
  "nom": "Programme Acrobatie Débutants",
  "description": "Programme progressif acrobatie",
  "figureIds": [1, 2, 5],
  "estModele": false
}
```
- **Validation**: `nom` et `figureIds` requis, `figureIds.length > 0`
- **Réponse**:
```json
{
  "programme": {
    "id": 10,
    "professeur_id": 2,
    "nom": "Programme Acrobatie Débutants",
    "figures": [...]
  }
}
```

**GET `/api/prof/programmes`**
- **Permissions**: Professeur ou Admin
- **Description**: Liste programmes du professeur
- **Réponse**:
```json
{
  "programmes": [
    {
      "id": 1,
      "nom": "Programme Acrobatie",
      "nb_figures": 5,
      "nb_assignations": 12
    }
  ]
}
```

### Notes d'Intégration Frontend
- **Fichier**: `frontend/src/pages/prof/ProgrammesPage.js` (NOUVEAU)
- **Features**:
  - Formulaire création programme multi-step
  - Sélection figures (autocomplete Material-UI)
  - Drag-and-drop pour réordonner figures
  - Bouton "Assigner à un élève/groupe"
  - Liste programmes existants avec statistiques

---

## Route 6: Prof - Statistiques Professeur

### Endpoint

**GET `/api/prof/statistiques`**
- **Permissions**: Professeur ou Admin
- **Description**: Statistiques globales du professeur
- **Réponse**:
```json
{
  "totalEleves": 25,
  "totalGroupes": 3,
  "elevesActifs": 18,
  "xpTotal": 12500,
  "figuresValidees": 85,
  "tauxActivite": 72
}
```

### Notes d'Intégration Frontend
- **Fichier**: `frontend/src/pages/prof/TeacherDashboardPage.js` (modifier)
- **Usage**: Afficher KPIs dans header du dashboard
- **Visualisation**: Cards Material-UI avec icônes (👥, 📊, ⚡)
- **Refresh**: Auto-refresh toutes les 5 minutes

---

## Route 7: Gamification - Statistiques Profil

### Endpoint

**GET `/api/gamification/statistiques/utilisateur/profil-gamification`**
- **Permissions**: Authentifié
- **Description**: Profil gamification complet de l'utilisateur connecté
- **Réponse**:
```json
{
  "profil": {
    "utilisateur": {
      "id": 4,
      "pseudo": "lucas_moreau",
      "niveau": 5,
      "xp_total": 1250,
      "xp_prochain_niveau": 1500
    },
    "badges": [
      {
        "id": 1,
        "nom": "Première Figure",
        "description": "Valider ta première figure",
        "image_url": "...",
        "date_obtention": "2026-01-01T10:00:00.000Z"
      }
    ],
    "titres": [
      {
        "id": 1,
        "nom": "Novice",
        "actif": true
      }
    ],
    "streaks": {
      "current": 7,
      "record": 15,
      "derniere_activite": "2026-01-09"
    }
  }
}
```

### Notes d'Intégration Frontend
- **Fichier**: `frontend/src/pages/eleve/ProfilePage.js` (modifier)
- **Usage**: Afficher section "Gamification" dans profil élève
- **Visualisation**: Grille badges, progress bar niveau, flame icon pour streaks
- **Animation**: Confetti lors de déblocage nouveau badge

---

## Route 8: Gamification - Classements

### Endpoints

**GET `/api/gamification/classements/global`**
- **Permissions**: Authentifié
- **Query Params**: `limit` (défaut: 50), `offset` (pagination)
- **Description**: Classement global par XP total
- **Réponse**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "utilisateur_id": 10,
      "pseudo": "alice_pro",
      "xp_total": 3500,
      "niveau": 12,
      "avatar_url": "..."
    }
  ],
  "user_rank": 25
}
```

**GET `/api/gamification/classements/hebdomadaire`**
- **Permissions**: Authentifié
- **Query Params**: `limit` (défaut: 50)
- **Description**: Classement de la semaine (XP gagnés cette semaine)

**GET `/api/gamification/classements/groupe/:id`**
- **Permissions**: Membre du groupe OU Professeur créateur OU Admin
- **Description**: Classement d'un groupe spécifique

### Notes d'Intégration Frontend
- **Fichier**: `frontend/src/pages/common/LeaderboardPage.js` (NOUVEAU)
- **Features**:
  - Tabs: Global | Hebdomadaire | Mon Groupe
  - Affichage podium (top 3) avec médailles 🥇🥈🥉
  - Liste classement avec avatars
  - Highlight user position (background color différent)
  - Pagination infinite scroll

---

## Route 9: Admin - Exercices Décomposés (CRUD)

### Endpoint

**POST `/api/admin/figures/:figureId/exercices`**
- **Permissions**: Admin uniquement
- **Body**:
```json
{
  "exercice_figure_id": 2,
  "ordre": 0,
  "est_requis": true,
  "poids": 2
}
```
- **Description**: Ajoute un exercice décomposé (prérequis) à une figure
- **Validations**:
  - Figure parente existe
  - Figure exercice existe
  - Pas de cycle (A → B → A)
  - Pas de doublon (contrainte unique)
- **Réponse**:
```json
{
  "message": "Exercice ajouté avec succès",
  "relation": {
    "figure_id": 1,
    "exercice_figure_id": 2,
    "ordre": 0,
    "est_requis": true,
    "poids": 2
  }
}
```

**Codes d'erreur**:
- `400`: Paramètres invalides ou cycle détecté
- `404`: Figure non trouvée
- `409`: Relation déjà existe
- `500`: Erreur serveur

### Notes d'Intégration Frontend
- **Fichier**: `frontend/src/pages/admin/CatalogAdminPage.js` (modifier)
- **Usage**: Section "Exercices Décomposés" dans formulaire édition figure
- **Features**:
  - Autocomplete pour sélectionner figure exercice
  - Liste exercices actuels avec drag-and-drop pour ordre
  - Bouton supprimer exercice
  - Badge "Requis" (toggle)
  - Slider poids (1-3)
- **Validation Frontend**: Vérifier cycle avant envoi (graph traversal)

---

## 📊 Résumé des 9 Routes

| Route | Méthode | Endpoint | Permissions | Statut Tests |
|-------|---------|----------|-------------|--------------|
| 1. Disciplines | GET | `/api/disciplines` | Authentifié | ✅ Testée |
| 2. Progression | GET | `/api/progression/utilisateur/:id` | Élève/Prof/Admin | ✅ Testée |
| 3. Suggestions | GET | `/api/suggestions` | Élève | ✅ Testée |
| 4. Groupes | POST/GET | `/api/prof/groupes` | Prof/Admin | ✅ Testée |
| 5. Programmes | POST/GET | `/api/prof/programmes` | Prof/Admin | ✅ Testée |
| 6. Stats Prof | GET | `/api/prof/statistiques` | Prof/Admin | ✅ Testée |
| 7. Profil Gamif | GET | `/api/gamification/statistiques/utilisateur/profil-gamification` | Authentifié | ✅ Testée |
| 8. Classements | GET | `/api/gamification/classements/*` | Authentifié | ✅ Testée |
| 9. Admin Exercices | POST | `/api/admin/figures/:figureId/exercices` | Admin | ✅ Testée |

---

## 🚀 Priorités d'Intégration Frontend

### 🔴 Haute Priorité (Impact utilisateur direct)
1. **Route 3 - Suggestions Élève**: Fonctionnalité clé pour engagement élève
2. **Route 6 - Stats Prof**: KPIs essentiels dashboard professeur
3. **Route 8 - Classements**: Gamification engagement élève

### 🟡 Moyenne Priorité (Features avancées prof)
4. **Route 4 - Groupes**: Gestion organisation prof
5. **Route 5 - Programmes**: Personnalisation entraînement
6. **Route 2 - Progression**: Timeline visualisation

### 🟢 Basse Priorité (Admin/secondaire)
7. **Route 1 - Disciplines**: Liste déjà implémentée (vérifier usage)
8. **Route 7 - Profil Gamif**: Bonus pour profil élève
9. **Route 9 - Admin Exercices**: Admin-only, pas urgent

---

## 💡 Conseils d'Implémentation Frontend

### 1. Composants Réutilisables à Créer

**`SuggestionCard.js`**
- Props: `suggestion`, `onAccept`, `onDismiss`
- Usage: Route 3 (Suggestions)

**`LeaderboardItem.js`**
- Props: `rank`, `user`, `isCurrentUser`
- Usage: Route 8 (Classements)

**`GroupeCard.js`**
- Props: `groupe`, `onEdit`, `onDelete`
- Usage: Route 4 (Groupes)

### 2. Hooks Custom

**`useStatistics(profId)`**
- Fetch `/api/prof/statistiques`
- Auto-refresh toutes les 5 minutes
- Usage: Route 6

**`useLeaderboard(type, groupeId)`**
- Fetch classement selon type (global/hebdo/groupe)
- Pagination infinite scroll
- Usage: Route 8

### 3. Gestion Erreurs

Toutes les routes retournent:
- `401`: Non authentifié → Redirect login
- `403`: Permissions insuffisantes → Afficher Alert "Accès interdit"
- `404`: Ressource non trouvée → Afficher Alert "Non trouvé"
- `500`: Erreur serveur → Afficher Alert "Erreur serveur, réessayez"

**Pattern recommandé**:
```javascript
try {
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erreur réseau');
  }
  const data = await res.json();
  // Success
} catch (error) {
  console.error('Erreur:', error);
  setErrorMessage(error.message);
}
```

---

## 🎯 Effort Estimé Frontend

| Route | Composants Nouveaux | Effort (heures) | Dépendances |
|-------|---------------------|-----------------|-------------|
| Route 3 - Suggestions | `SuggestionsPage`, `SuggestionCard` | 6-8h | Aucune |
| Route 6 - Stats Prof | Intégration dashboard existant | 2-3h | Aucune |
| Route 8 - Classements | `LeaderboardPage`, `LeaderboardItem` | 5-7h | Aucune |
| Route 4 - Groupes | `GroupesPage`, `GroupeForm` | 4-6h | Aucune |
| Route 5 - Programmes | `ProgrammesPage`, multi-step wizard | 6-8h | Route 4 (groupes) |
| Route 2 - Progression | `ProgressionTimeline` | 4-5h | Aucune |
| Route 1 - Disciplines | Vérification code existant | 1h | Aucune |
| Route 7 - Profil Gamif | Section dans profil élève | 3-4h | Route 8 |
| Route 9 - Admin Exercices | Section admin catalogue | 4-5h | Admin page existante |

**Total Effort**: **35-46 heures** (1-1.5 semaines développement frontend intensif)

---

## ✅ Checklist Intégration

Avant de démarrer chaque route frontend :

- [ ] Lire spécifications endpoint dans ce document
- [ ] Consulter [API_DOCUMENTATION.md](API_DOCUMENTATION.md) pour exemples requêtes
- [ ] Vérifier tests backend dans `backend/test/routes/` pour cas d'usage
- [ ] Créer types TypeScript/PropTypes pour réponses API
- [ ] Implémenter loading states et error handling
- [ ] Tester avec données seed (`npm run reset-and-seed`)
- [ ] Valider permissions (tester avec comptes élève/prof/admin)
- [ ] Responsive design (mobile + desktop)

---

## 📝 DEMANDES FRONTEND (Résolu - Prérequis Figures)