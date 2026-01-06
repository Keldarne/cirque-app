# 🚀 Plan d'Implémentation Frontend - Système de Suggestions

**Date**: 2025-12-29
**Développeur Backend**: Claude
**Développeur Frontend**: Gemini (À FAIRE)
**Status**: ✅ BACKEND COMPLÉTÉ → 🎯 FRONTEND À IMPLÉMENTER

---

## 🎯 OBJECTIF GLOBAL

Créer un **parcours d'apprentissage auto-évolutif** où:
- ✅ Les figures complexes sont décomposées en exercices progressifs
- ✅ Les élèves voient automatiquement ce qu'ils sont prêts à apprendre
- ✅ Les profs identifient facilement les prochaines étapes pour leur groupe

---

## ✅ CE QUI A ÉTÉ FAIT (BACKEND)

### 1. Nouvelles Tables

**ExercicesFigure** (relation récursive):
```sql
figure_id          -- Figure composite
exercice_figure_id -- Figure qui sert d'exercice
ordre              -- Ordre dans la séquence
est_requis         -- true=obligatoire, false=optionnel
poids              -- 1-3 (importance pour le calcul du score)
```

**SuggestionsFigure** (cache de performance):
```sql
utilisateur_id / groupe_id  -- Polymorphique
figure_id                   -- Figure suggérée
score_preparation           -- 0-100% (score de préparation)
nb_exercices_valides        -- Combien d'exercices complétés
nb_exercices_total          -- Total d'exercices requis
statut                      -- pending / accepted / dismissed
date_expiration             -- Rafraîchi toutes les 24h par cron
```

### 2. Nouveaux Endpoints Backend

#### 🎓 **Routes Élève** (`/api/suggestions`)

**GET /api/suggestions**
- Calcule les suggestions personnalisées
- Top 5 figures (score ≥ 60%)
- Exclusions: figures assignées, programme personnel, figures validées

Réponse:
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
          "exercice_nom": "Roulade Arrière",
          "ordre": 1,
          "poids": 3,
          "est_valide": true,
          "progression": "3/3 étapes"
        },
        {
          "exercice_nom": "Saut en Hauteur",
          "ordre": 2,
          "poids": 2,
          "est_valide": true,
          "progression": "2/2 étapes"
        },
        {
          "exercice_nom": "Trampoline",
          "ordre": 3,
          "poids": 3,
          "est_valide": false,
          "progression": "1/4 étapes"
        }
      ]
    }
  ],
  "count": 5,
  "message": "5 suggestions disponibles"
}
```

**GET /api/suggestions/:figureId/details**
- Détails de préparation pour une figure spécifique
- Liste exacte des exercices validés/manquants

**POST /api/suggestions/:figureId/accepter**
- Ajoute la figure au programme personnel de l'élève
- Marque suggestion comme 'accepted'
- Status: `201 Created`
- Retourne: `{ message, programme: { id, nom } }`

**POST /api/suggestions/:figureId/dismisser**
- Masque la suggestion (statut = 'dismissed')
- Sera recalculée au prochain cron (3h du matin)
- Status: `200 OK`

#### 👨‍🏫 **Routes Prof** (`/api/prof/suggestions`)

**GET /api/prof/suggestions/groupe/:groupeId**
- Suggestions pour un groupe entier
- Filtre: ≥50% des élèves prêts (score ≥80%)
- Top 5 figures triées par % du groupe prêt

Réponse:
```json
{
  "groupe": { "id": 1, "nom": "Débutants" },
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

**POST /api/prof/suggestions/groupe/:groupeId/assigner/:figureId**
- Ajoute la figure au programme du groupe
- Tous les élèves la reçoivent automatiquement
- Status: `201 Created`

**GET /api/prof/suggestions/eleve/:eleveId**
- Vue prof des suggestions d'un élève individuel
- Même format que GET /api/suggestions

### 3. Algorithme de Scoring

**Formule du Score de Préparation**:
```javascript
score = (Σ (exercices validés × poids) / Σ (total exercices requis × poids)) × 100

Exemple:
- Ex1: Roulade (poids=3) ✅ validé
- Ex2: Saut (poids=2) ✅ validé
- Ex3: Trampoline (poids=3) ❌ non validé

Score = ((3 + 2) / (3 + 2 + 3)) × 100 = 62.5%
```

**Seuils Décidés**:
- **≥80%**: Badge vert "Tu es prêt !" 🟢
- **60-79%**: Badge jaune "Bientôt prêt" 🟡
- **<60%**: Pas affiché

### 4. Cron Job (Automatique)

**Cron nocturne à 3h** (après déclin mémoriel à 2h):
- Rafraîchit le cache `SuggestionsFigure` pour tous les élèves et groupes
- Évite calculs lourds pendant la journée
- Cache valide 24h

---

## 🎨 CE QU'IL FAUT FAIRE (FRONTEND - GEMINI)

### Tâche 1: Hook `useSuggestions` (Élève)

**Fichier à créer**: `frontend/src/hooks/useSuggestions.js`

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/suggestions');
      setSuggestions(response.data.suggestions);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch suggestions:', err);
      setError(err.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const accepterSuggestion = async (figureId) => {
    try {
      await axios.post(`/api/suggestions/${figureId}/accepter`);
      fetchSuggestions(); // Rafraîchir
      return { success: true };
    } catch (err) {
      console.error('Erreur accepter suggestion:', err);
      return {
        success: false,
        error: err.response?.data?.error || 'Erreur inconnue'
      };
    }
  };

  const dismisserSuggestion = async (figureId) => {
    try {
      await axios.post(`/api/suggestions/${figureId}/dismisser`);
      // Retirer immédiatement de l'affichage
      setSuggestions(prev => prev.filter(s => s.figure_id !== figureId));
      return { success: true };
    } catch (err) {
      console.error('Erreur dismisser suggestion:', err);
      return { success: false };
    }
  };

  const obtenirDetails = async (figureId) => {
    try {
      const response = await axios.get(`/api/suggestions/${figureId}/details`);
      return response.data;
    } catch (err) {
      console.error('Erreur détails suggestion:', err);
      return null;
    }
  };

  return {
    suggestions,
    loading,
    error,
    accepterSuggestion,
    dismisserSuggestion,
    obtenirDetails,
    refresh: fetchSuggestions
  };
}
```

---

### Tâche 2: Section Suggestions dans Mon Programme (Élève)

**Fichier à modifier**: `frontend/src/pages/eleve/MonProgrammePage.js`

**Imports nécessaires**:
```javascript
import { useSuggestions } from '../../hooks/useSuggestions';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Tooltip,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
```

**Code à ajouter**:
```jsx
function MonProgrammePage() {
  const { suggestions, loading, error, accepterSuggestion, dismisserSuggestion } = useSuggestions();

  const getBadgeColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'default';
  };

  const getBadgeText = (score) => {
    if (score >= 80) return 'Tu es prêt !';
    if (score >= 60) return 'Bientôt prêt';
    return `${Math.round(score)}%`;
  };

  const handleAccepter = async (figureId, figureName) => {
    const result = await accepterSuggestion(figureId);
    if (result.success) {
      // Afficher notification succès (snackbar/toast)
      console.log(`${figureName} ajoutée à ton programme personnel`);
    } else {
      // Afficher erreur
      console.error(result.error);
    }
  };

  return (
    <Container>
      {/* Sections existantes: programmes assignés, programme perso */}

      {/* NOUVEAU: Section suggestions */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom display="flex" alignItems="center" gap={1}>
          💡 Suggestions pour toi
          <Tooltip title="Ces figures te sont recommandées car tu as validé la plupart de leurs exercices prérequis">
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        </Typography>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Ces figures sont recommandées en fonction de ta progression
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box mt={2}>
            <LinearProgress />
          </Box>
        ) : suggestions.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Aucune suggestion pour le moment. Continue à progresser sur tes exercices !
          </Alert>
        ) : (
          <Grid container spacing={2} mt={1}>
            {suggestions.map(suggestion => (
              <Grid item xs={12} sm={6} md={4} key={suggestion.figure_id}>
                <Card elevation={2}>
                  <CardContent>
                    {/* Header avec bouton masquer */}
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="h6" component="div">
                        {suggestion.nom}
                      </Typography>
                      <Tooltip title="Masquer cette suggestion">
                        <IconButton
                          size="small"
                          onClick={() => dismisserSuggestion(suggestion.figure_id)}
                          aria-label="Masquer"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {suggestion.descriptif}
                    </Typography>

                    {/* Badge de préparation */}
                    <Chip
                      label={getBadgeText(suggestion.score_preparation)}
                      color={getBadgeColor(suggestion.score_preparation)}
                      size="small"
                      sx={{ mb: 1 }}
                    />

                    {/* Barre de progression */}
                    <Box sx={{ width: '100%', mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={suggestion.score_preparation}
                        color={getBadgeColor(suggestion.score_preparation)}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>

                    {/* Détails exercices */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {suggestion.nb_exercices_valides} / {suggestion.nb_exercices_total} exercices validés
                    </Typography>

                    {/* Difficulté (barres) */}
                    <Box display="flex" gap={0.5} alignItems="center" mt={1} mb={2}>
                      <Typography variant="caption" color="textSecondary" mr={1}>
                        Difficulté:
                      </Typography>
                      {[...Array(5)].map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 20,
                            backgroundColor: i < suggestion.difficulty_level ? 'primary.main' : 'grey.300',
                            borderRadius: 1
                          }}
                        />
                      ))}
                    </Box>

                    {/* Bouton action */}
                    <Button
                      variant="contained"
                      size="medium"
                      fullWidth
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleAccepter(suggestion.figure_id, suggestion.nom)}
                    >
                      Ajouter à mon programme
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
```

---

### Tâche 3: Hook `useSuggestionsGroupe` (Prof)

**Fichier à créer**: `frontend/src/hooks/useSuggestionsGroupe.js`

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useSuggestionsGroupe(groupeId) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (groupeId) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  }, [groupeId]);

  const fetchSuggestions = async () => {
    if (!groupeId) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/prof/suggestions/groupe/${groupeId}`);
      setSuggestions(response.data.suggestions);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch suggestions groupe:', err);
      setError(err.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const assignerFigure = async (figureId) => {
    try {
      await axios.post(`/api/prof/suggestions/groupe/${groupeId}/assigner/${figureId}`);
      fetchSuggestions(); // Rafraîchir
      return { success: true };
    } catch (err) {
      console.error('Erreur assigner figure:', err);
      return {
        success: false,
        error: err.response?.data?.error || 'Erreur inconnue'
      };
    }
  };

  return {
    suggestions,
    loading,
    error,
    assignerFigure,
    refresh: fetchSuggestions
  };
}
```

---

### Tâche 4: Widget Suggestions dans Dashboard Prof

**Fichier à modifier**: `frontend/src/pages/prof/DashboardProfPage.js`

**Imports nécessaires**:
```javascript
import { useSuggestionsGroupe } from '../../hooks/useSuggestionsGroupe';
import {
  Paper,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LinearProgress,
  Button,
  Box,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
```

**Code à ajouter**:
```jsx
function DashboardProfPage() {
  const { groupeActif } = useContext(GroupeContext); // Supposé existant
  const { suggestions, loading, error, assignerFigure } = useSuggestionsGroupe(groupeActif?.id);

  const handleAssigner = async (figureId, figureName) => {
    const result = await assignerFigure(figureId);
    if (result.success) {
      console.log(`${figureName} assignée au groupe`);
      // Afficher notification succès
    } else {
      console.error(result.error);
      // Afficher erreur
    }
  };

  return (
    <Container>
      {/* Widgets existants (progression matrix, charts, etc.) */}

      {/* NOUVEAU: Widget suggestions */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6">
            💡 Suggestions pour le groupe
          </Typography>
          <Chip
            icon={<PeopleIcon />}
            label={groupeActif?.nom || 'Aucun groupe'}
            size="small"
            color="primary"
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Figures recommandées basées sur la progression du groupe
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {!groupeActif ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Sélectionnez un groupe pour voir les suggestions
          </Alert>
        ) : loading ? (
          <Box mt={2}>
            <LinearProgress />
          </Box>
        ) : suggestions.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Aucune suggestion pour ce groupe pour le moment
          </Alert>
        ) : (
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Figure</TableCell>
                  <TableCell>Difficulté</TableCell>
                  <TableCell>% du groupe prêt</TableCell>
                  <TableCell>Élèves prêts</TableCell>
                  <TableCell>Exercices validés</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suggestions.map(suggestion => (
                  <TableRow key={suggestion.figure_id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {suggestion.nom}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {suggestion.descriptif}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box display="flex" gap={0.3}>
                        {[...Array(5)].map((_, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 6,
                              height: 16,
                              backgroundColor: i < suggestion.difficulty_level ? 'primary.main' : 'grey.300',
                              borderRadius: 0.5
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <LinearProgress
                            variant="determinate"
                            value={suggestion.pourcentage_groupe_pret}
                            sx={{ width: 100, height: 8, borderRadius: 1 }}
                            color={suggestion.pourcentage_groupe_pret >= 75 ? 'success' : 'primary'}
                          />
                          <Typography variant="body2" fontWeight="medium">
                            {suggestion.pourcentage_groupe_pret}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Tooltip title={suggestion.eleves_prets.join(', ')}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {suggestion.nb_eleves_prets} / {suggestion.nb_eleves_total}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 150, display: 'block' }}>
                            {suggestion.eleves_prets.slice(0, 2).join(', ')}
                            {suggestion.eleves_prets.length > 2 && ` +${suggestion.eleves_prets.length - 2}`}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {suggestion.nb_exercices_valides} / {suggestion.nb_exercices_total}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAssigner(suggestion.figure_id, suggestion.nom)}
                      >
                        Assigner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}
```

---

## 🎯 CHECKLIST D'IMPLÉMENTATION

### Hooks
- [ ] Créer `useSuggestions.js` (élève)
  - [ ] Fetch suggestions
  - [ ] Accepter suggestion
  - [ ] Dismisser suggestion
  - [ ] Obtenir détails
- [ ] Créer `useSuggestionsGroupe.js` (prof)
  - [ ] Fetch suggestions groupe
  - [ ] Assigner figure au groupe

### Pages
- [ ] **MonProgrammePage.js** (élève)
  - [ ] Section "Suggestions pour toi"
  - [ ] Cartes avec badge coloré
  - [ ] Barre de progression
  - [ ] Bouton "Ajouter"
  - [ ] Bouton "Masquer"
  - [ ] Gestion états (loading, error, empty)

- [ ] **DashboardProfPage.js** (prof)
  - [ ] Widget "Suggestions pour le groupe"
  - [ ] Tableau avec % du groupe prêt
  - [ ] Liste élèves prêts
  - [ ] Bouton "Assigner"
  - [ ] Gestion états (loading, error, no group, empty)

### Tests
- [ ] Tester avec compte élève (lucas.moreau@voltige.fr / Password123!)
- [ ] Tester accepter une suggestion
- [ ] Tester masquer une suggestion
- [ ] Tester avec compte prof (prof1@example.com / prof123)
- [ ] Tester voir suggestions groupe
- [ ] Tester assigner suggestion au groupe

---

## 📋 NOTES IMPORTANTES

1. **Pas besoin de gérer le calcul du score** - fait automatiquement par le backend
2. **Cache rafraîchi automatiquement** chaque nuit à 3h par cron
3. **Exclusions automatiques** (figures déjà assignées/validées)
4. **Top 5 seulement** - pas de pagination (focus qualité)
5. **Badges colorés**:
   - ≥80% = vert (success) = "Tu es prêt !"
   - 60-79% = jaune (warning) = "Bientôt prêt"
6. **Axios déjà configuré** avec proxy backend

---

## 🔗 ENDPOINTS COMPLETS

```
ÉLÈVE:
GET    /api/suggestions
GET    /api/suggestions/:figureId/details
POST   /api/suggestions/:figureId/accepter
POST   /api/suggestions/:figureId/dismisser

PROF:
GET    /api/prof/suggestions/groupe/:groupeId
POST   /api/prof/suggestions/groupe/:groupeId/assigner/:figureId
GET    /api/prof/suggestions/eleve/:eleveId
```

---

## ✅ RÉSUMÉ TECHNIQUE

**Backend (TERMINÉ)**:
- 2 nouveaux modèles (ExerciceFigure, SuggestionFigure)
- 3 fichiers de routes (suggestions.js, prof/suggestions.js, admin/exercices.js)
- 1 service complet (SuggestionService avec 8 méthodes)
- 1 cron job nocturne (3h)
- 12 endpoints API fonctionnels

**Frontend (À FAIRE)**:
- 2 hooks custom
- 1 section dans MonProgrammePage
- 1 widget dans DashboardProfPage
- Tests avec comptes de test

**Impact Utilisateur**:
- 🎓 Élèves: Parcours auto-évolutif
- 👨‍🏫 Profs: Vision claire progression groupe
- 🎯 Tous: Apprentissage guidé et progressif
