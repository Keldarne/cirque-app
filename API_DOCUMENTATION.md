# API REST - Documentation par Type d'Utilisateur

**Base URL**: `http://localhost:4000/api`

**Note**: Tous les endpoints (sauf `/utilisateurs/register` et `/utilisateurs/login`) nécessitent un token JWT dans le header:
```
Authorization: Bearer <token>
```

---

## Table des Matières

1. [Authentification (Public)](#authentification-public)
2. [Endpoints ÉLÈVE](#endpoints-élève)
3. [Endpoints PROFESSEUR](#endpoints-professeur)
4. [Endpoints ADMIN](#endpoints-admin)
5. [Endpoints PARTAGÉS](#endpoints-partagés)

---

## Authentification (Public)

### POST `/api/utilisateurs/register`
**Accès**: Public
**Description**: Créer un nouveau compte élève

**Body**:
```json
{
  "pseudo": "string (3-50 chars)",
  "email": "string (valid email)",
  "mot_de_passe": "string (min 8 chars)"
}
```

**Réponse 201**:
```json
{
  "message": "Utilisateur créé",
  "user": {
    "id": 1,
    "pseudo": "johndoe",
    "email": "john@example.com",
    "role": "eleve"
  }
}
```

---

### POST `/api/utilisateurs/login`
**Accès**: Public
**Description**: Se connecter avec email ou pseudo

**Body**:
```json
{
  "email": "string",  // OU "pseudo": "string"
  "mot_de_passe": "string"
}
```

**Réponse 200**:
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "eleve",
  "user": {
    "id": 4,
    "pseudo": "lucas_moreau",
    "email": "lucas.moreau@voltige.fr",
    "niveau": 3,
    "xp": 1250,
    "role": "eleve"
  }
}
```

---

## Endpoints ÉLÈVE

### Profil Utilisateur

#### GET `/api/utilisateurs/me`
**Accès**: Élève, Professeur, Admin
**Description**: Récupérer les informations de l'utilisateur connecté

**Réponse 200**:
```json
{
  "id": 4,
  "pseudo": "lucas_moreau",
  "nom": "Moreau",
  "prenom": "Lucas",
  "email": "lucas.moreau@voltige.fr",
  "role": "eleve",
  "niveau": 3,
  "xp": 1250,
  "ecole_id": 1
}
```

---

### Progressions

#### GET `/api/progression/utilisateur/:utilisateurId`
**Accès**: Élève (ses propres progressions), Prof (ses élèves), Admin
**Description**: Récupérer toutes les progressions d'un utilisateur groupées par figure

**Réponse 200**:
```json
[
  {
    "figure_id": 12,
    "figure_nom": "Cascade 3 balles",
    "figure_description": "Pattern de base du jonglage à 3 balles...",
    "discipline": {
      "id": 1,
      "nom": "Jonglage"
    },
    "etapes": [
      {
        "id": 101,
        "utilisateur_id": 4,
        "etape_id": 34,
        "statut": "valide",
        "date_validation": "2025-12-15T10:30:00.000Z",
        "valide_par_prof_id": 2,
        "lateralite": null,
        "etape": {
          "id": 34,
          "figure_id": 12,
          "ordre": 1,
          "titre": "Découverte",
          "description": "Comprendre la technique de base",
          "xp": 5
        }
      },
      {
        "id": 102,
        "etape_id": 35,
        "statut": "en_cours",
        "date_validation": null,
        "etape": {
          "id": 35,
          "ordre": 2,
          "titre": "Pratique",
          "xp": 10
        }
      },
      {
        "id": 103,
        "etape_id": 36,
        "statut": "non_commence",
        "etape": {
          "id": 36,
          "ordre": 3,
          "titre": "Maîtrise",
          "xp": 20
        }
      }
    ]
  }
]
```

---

#### GET `/api/progression/figure/:figureId/etapes`
**Accès**: Élève (ses étapes), Prof, Admin
**Description**: Récupérer les étapes d'une figure avec leur état de progression pour l'utilisateur connecté

**Réponse 200**:
```json
[
  {
    "id": 101,
    "utilisateur_id": 4,
    "etape_id": 34,
    "statut": "valide",
    "date_validation": "2025-12-15T10:30:00.000Z",
    "etape": {
      "id": 34,
      "figure_id": 12,
      "ordre": 1,
      "titre": "Découverte",
      "description": "Comprendre la technique de base",
      "xp": 5
    }
  }
]
```

---

#### POST `/api/progression`
**Accès**: Élève
**Description**: Démarrer une nouvelle progression sur une figure

**Body**:
```json
{
  "figure_id": 12
}
```

**Réponse 201**:
```json
{
  "message": "Progression démarrée pour la figure 12. 3 étapes créées.",
  "progressions": [...]
}
```

---

#### DELETE `/api/progression/figure/:figureId`
**Accès**: Élève (sa propre progression)
**Description**: Supprimer toute la progression sur une figure

**Réponse 200**:
```json
{
  "message": "Progression sur la figure supprimée avec succès",
  "etapesSupprimees": 3
}
```

---

#### GET `/api/progression/grit-score`
**Accès**: Élève (son score), Prof (ses élèves), Admin
**Description**: Calculer le score de persévérance basé sur les tentatives

**Query params**: `?utilisateurId=4` (optionnel, par défaut = utilisateur connecté)

**Réponse 200**:
```json
{
  "grit_score": 45,
  "interpretation": "Persévérant - Apprend de ses erreurs",
  "total_echecs": 18,
  "total_reussites": 22,
  "total_tentatives": 40,
  "ratio": 0.45
}
```

---

### Programmes

#### GET `/api/progression/programmes/:programmeId`
**Accès**: Élève (si programme assigné ou personnel), Prof, Admin
**Description**: Récupérer les détails d'un programme avec ses figures

**Réponse 200**:
```json
{
  "programme": {
    "id": 29,
    "nom": "Jonglage Débutant",
    "description": "Programme d'initiation au jonglage pour débutants",
    "professeur_id": 2,
    "est_modele": false,
    "actif": true,
    "ProgrammesFigures": [
      {
        "id": 145,
        "programme_id": 29,
        "figure_id": 12,
        "ordre": 1,
        "Figure": {
          "id": 12,
          "nom": "Cascade 3 balles",
          "descriptif": "Pattern de base du jonglage...",
          "difficulty_level": 2,
          "Discipline": {
            "id": 1,
            "nom": "Jonglage"
          }
        }
      }
    ]
  }
}
```

---

### Figures

#### GET `/api/figures`
**Accès**: Élève, Prof, Admin
**Description**: Liste toutes les figures accessibles (publiques + celles de son école)

**Query params**:
- `?discipline_id=1` - Filtrer par discipline
- `?createur_id=me` - Filtrer par créateur (figures personnelles)

**Réponse 200**:
```json
[
  {
    "id": 12,
    "nom": "Cascade 3 balles",
    "descriptif": "Pattern de base du jonglage à 3 balles. Motif asymétrique fondamental qui développe la coordination bilatérale, le timing et la trajectoire parabolique des objets.",
    "image_url": null,
    "video_url": null,
    "discipline_id": 1,
    "createur_id": null,
    "ecole_id": null,
    "Discipline": {
      "id": 1,
      "nom": "Jonglage"
    }
  }
]
```

---

#### GET `/api/figures/:id`
**Accès**: Élève, Prof, Admin
**Description**: Détails d'une figure spécifique

**Réponse 200**:
```json
{
  "figure": {
    "id": 12,
    "nom": "Cascade 3 balles",
    "descriptif": "Pattern de base du jonglage...",
    "difficulty_level": 2,
    "type": "artistique",
    "Discipline": {
      "id": 1,
      "nom": "Jonglage"
    }
  }
}
```

---

#### GET `/api/figures/:id/etapes`
**Accès**: Élève, Prof, Admin
**Description**: Liste des étapes définies pour une figure

**Réponse 200**:
```json
[
  {
    "id": 34,
    "figure_id": 12,
    "ordre": 1,
    "titre": "Découverte",
    "description": "Comprendre la technique de base",
    "xp": 5
  },
  {
    "id": 35,
    "ordre": 2,
    "titre": "Pratique",
    "description": "Entraînement avec assistance",
    "xp": 10
  },
  {
    "id": 36,
    "ordre": 3,
    "titre": "Maîtrise",
    "description": "Réalisation autonome - 3 fois consécutives",
    "xp": 20
  }
]
```

---

### Entraînement

#### POST `/api/entrainement/tentatives`
**Accès**: Élève
**Description**: Enregistrer une tentative sur une étape avec 4 modes supportés

**Note**: Le champ `typeSaisie` est **requis**

**Body - Mode Binaire**:
```json
{
  "etapeId": 34,
  "typeSaisie": "binaire",
  "reussite": true
}
```

**Body - Mode Evaluation** (auto-évaluation qualitative):
```json
{
  "etapeId": 34,
  "typeSaisie": "evaluation",
  "score": 2
}
```
*Score: 1=Échec, 2=Instable, 3=Maîtrisé*

**Body - Mode Duree** (chronométrage):
```json
{
  "etapeId": 34,
  "typeSaisie": "duree",
  "dureeSecondes": 120
}
```
*Durée en secondes (120 = 2 minutes de pratique)*

**Body - Mode Evaluation + Duree** (combiné):
```json
{
  "etapeId": 34,
  "typeSaisie": "evaluation_duree",
  "score": 2,
  "dureeSecondes": 180
}
```
*Exemple: 3 minutes de pratique instable*

**Réponse 201**:
```json
{
  "message": "Tentative enregistrée avec succès",
  "progressionEtape": {
    "id": 102,
    "utilisateur_id": 4,
    "etape_id": 34,
    "statut": "valide"
  },
  "tentative": {
    "id": 456,
    "progression_etape_id": 102,
    "type_saisie": "evaluation_duree",
    "reussie": true,
    "score": 2,
    "duree_secondes": 180,
    "createdAt": "2025-12-25T15:30:00.000Z"
  }
}
```

**Mapping automatique du champ `reussie`**:
- Mode `binaire`: Utilise la valeur `reussite` fournie
- Mode `evaluation`: Score 2-3 → `true`, Score 1 → `false`
- Mode `duree`: Toujours `true` (toute session compte)
- Mode `evaluation_duree`: Score 2-3 → `true`, Score 1 → `false`

---

#### GET `/api/entrainement/tentatives/:etapeId`
**Accès**: Élève (ses tentatives), Prof (tentatives de ses élèves), Admin
**Description**: Récupérer l'historique paginé des tentatives pour une étape

**Paramètres URL**:
- `etapeId`: ID de l'étape (number)

**Query params**:
- `limit` (optionnel, default 20): Nombre de résultats (max 100)
- `offset` (optionnel, default 0): Décalage pour pagination
- `mode` (optionnel): Filtrer par type de saisie (`binaire`, `evaluation`, `duree`, `evaluation_duree`)

**Exemples d'utilisation**:
- `/api/entrainement/tentatives/34` - Les 20 dernières tentatives
- `/api/entrainement/tentatives/34?limit=10&offset=20` - Page 3 (10 par page)
- `/api/entrainement/tentatives/34?mode=evaluation&limit=50` - 50 tentatives en mode Evaluation

**Réponse 200**:
```json
[
  {
    "id": 456,
    "progression_etape_id": 102,
    "type_saisie": "evaluation_duree",
    "reussie": true,
    "score": 2,
    "duree_secondes": 180,
    "createdAt": "2025-12-25T15:30:00.000Z"
  },
  {
    "id": 455,
    "progression_etape_id": 102,
    "type_saisie": "binaire",
    "reussie": false,
    "score": null,
    "duree_secondes": null,
    "createdAt": "2025-12-25T14:00:00.000Z"
  }
]
```

**Réponse 400** (validation):
```json
{
  "error": "Le paramètre limit doit être entre 1 et 100"
}
```

**Réponse 404** (pas de progression):
```json
{
  "error": "Aucune progression trouvée pour cette étape"
}
```

---

#### GET `/api/entrainement/historique/utilisateur/:utilisateurId`
**Accès**: Élève (ses données), Professeur/Admin (tout)
**Description**: Récupérer l'historique global des tentatives d'un utilisateur (toutes figures confondues)

**Paramètres URL**:
- `utilisateurId`: ID de l'utilisateur (number)

**Query params**:
- `limit` (optionnel, default 20): Nombre de résultats (max 100)
- `offset` (optionnel, default 0): Décalage pour pagination
- `mode` (optionnel): Filtrer par type de saisie (`binaire`, `evaluation`, `duree`, `evaluation_duree`)

**Cas d'usage**: Dashboard Professeur - "Voir les 50 dernières activités de Lucas"

**Réponse 200** (enrichie avec contexte):
```json
[
  {
    "id": 789,
    "progression_etape_id": 205,
    "type_saisie": "evaluation_duree",
    "reussie": true,
    "score": 3,
    "duree_secondes": 120,
    "createdAt": "2025-12-25T16:00:00.000Z",
    "etape": {
      "id": 45,
      "nom": "Tenue 10 secondes",
      "ordre": 3
    },
    "figure": {
      "id": 12,
      "nom": "Poirier",
      "image_url": "https://..."
    }
  }
]
```

**Réponse 403** (accès refusé):
```json
{
  "error": "Vous n'avez pas l'autorisation de voir cet historique"
}
```

---

### Disciplines

#### GET `/api/disciplines`
**Accès**: Élève, Prof, Admin
**Description**: Liste toutes les disciplines

**Réponse 200**:
```json
[
  {
    "id": 1,
    "nom": "Jonglage"
  },
  {
    "id": 2,
    "nom": "Acrobatie"
  },
  {
    "id": 3,
    "nom": "Aérien"
  }
]
```

---

### Gamification

#### GET `/api/gamification/badges`
**Accès**: Élève, Prof, Admin
**Description**: Liste tous les badges disponibles

**Réponse 200**:
```json
[
  {
    "id": 1,
    "nom": "Premier Pas",
    "description": "Première figure validée",
    "icone": "trophy",
    "couleur": "#FFC107",
    "categorie": "progression",
    "rarete": "commun",
    "xp_bonus": 10
  }
]
```

---

#### GET `/api/gamification/badges/utilisateur/:utilisateurId`
**Accès**: Élève (ses badges), Prof (badges de ses élèves), Admin
**Description**: Badges obtenus par un utilisateur

**Réponse 200**:
```json
[
  {
    "id": 23,
    "utilisateur_id": 4,
    "badge_id": 1,
    "date_obtention": "2025-12-01T14:30:00.000Z",
    "Badge": {
      "nom": "Premier Pas",
      "icone": "trophy"
    }
  }
]
```

---

#### GET `/api/gamification/titres`
**Accès**: Élève, Prof, Admin
**Description**: Liste tous les titres disponibles

---

#### GET `/api/gamification/defis`
**Accès**: Élève, Prof, Admin
**Description**: Liste tous les défis actifs

---

#### GET `/api/gamification/streaks/:utilisateurId`
**Accès**: Élève (son streak), Prof (streaks de ses élèves), Admin
**Description**: Série de jours consécutifs de pratique

---

#### GET `/api/gamification/classements`
**Accès**: Élève, Prof, Admin
**Description**: Classement global par XP

**Query params**:
- `?limit=10` - Nombre de résultats (défaut: 10)
- `?ecole_id=1` - Filtrer par école

---

#### GET `/api/gamification/statistiques/profil-gamification/:utilisateurId`
**Accès**: Élève (son profil), Prof (profils de ses élèves), Admin
**Description**: Profil gamification complet d'un utilisateur

**Réponse 200**:
```json
{
  "utilisateur": {
    "id": 4,
    "pseudo": "lucas_moreau",
    "niveau": 3,
    "xp": 1250,
    "xp_prochain_niveau": 1500
  },
  "badges": [...],
  "titres": [...],
  "streak": {
    "jours_consecutifs": 7,
    "derniere_activite": "2025-12-25"
  },
  "statistiques": {
    "figures_validees": 12,
    "etapes_validees": 35,
    "disciplines_pratiquees": 5
  }
}
```

---

### Statistiques

#### GET `/api/statistiques/progression-globale`
**Accès**: Élève (ses stats), Prof, Admin
**Description**: Statistiques de progression globales de l'utilisateur

**Query params**: `?utilisateurId=4`

---

## Endpoints PROFESSEUR

### Élèves

#### GET `/api/prof/eleves`
**Accès**: Professeur, Admin
**Description**: Liste de tous les élèves du professeur

**Réponse 200**:
```json
{
  "eleves": [
    {
      "id": 4,
      "nom": "Moreau",
      "prenom": "Lucas",
      "email": "lucas.moreau@voltige.fr",
      "niveau": 3,
      "xp": 1250,
      "ecole_id": 1,
      "relation": {
        "notes_prof": "Élève très motivé",
        "date_acceptation": "2025-09-01T00:00:00.000Z"
      }
    }
  ]
}
```

---

#### GET `/api/prof/eleves/:id`
**Accès**: Professeur (ses élèves), Admin
**Description**: Détails complets d'un élève avec progressions

**Réponse 200**:
```json
{
  "id": 4,
  "nom": "Moreau",
  "prenom": "Lucas",
  "progressions": [...],
  "programmes_assignes": [...],
  "relation": {
    "notes_prof": "Élève très motivé",
    "date_acceptation": "2025-09-01"
  }
}
```

---

#### PUT `/api/prof/eleves/:id/notes`
**Accès**: Professeur (ses élèves), Admin
**Description**: Mettre à jour les notes du prof sur un élève

**Body**:
```json
{
  "notes": "Bon progrès ce mois-ci, continue comme ça!"
}
```

**Réponse 200**:
```json
{
  "message": "Notes mises à jour avec succès",
  "notes": "Bon progrès ce mois-ci, continue comme ça!"
}
```

---

#### DELETE `/api/prof/eleves/:id`
**Accès**: Professeur (ses élèves), Admin
**Description**: Retirer un élève de la liste du professeur

---

#### POST `/api/prof/eleves/:id/programmes/assigner`
**Accès**: Professeur (ses élèves), Admin
**Description**: Assigner un programme à un élève

**Body**:
```json
{
  "programmeId": 29
}
```

---

### Programmes

#### GET `/api/prof/programmes`
**Accès**: Professeur, Admin
**Description**: Liste des programmes créés par le professeur

**Réponse 200**:
```json
{
  "programmes": [
    {
      "id": 29,
      "nom": "Jonglage Débutant",
      "description": "Programme d'initiation au jonglage",
      "est_modele": false,
      "actif": true,
      "professeur_id": 2,
      "nb_figures": 5,
      "nb_eleves_assignes": 2
    }
  ]
}
```

---

#### POST `/api/prof/programmes`
**Accès**: Professeur, Admin
**Description**: Créer un nouveau programme

**Body**:
```json
{
  "nom": "Programme Jonglage Avancé",
  "description": "Pour les élèves expérimentés",
  "figureIds": [12, 13, 14, 15, 16],
  "estModele": false
}
```

**Réponse 201**:
```json
{
  "programme": {
    "id": 30,
    "nom": "Programme Jonglage Avancé",
    "description": "Pour les élèves expérimentés",
    "professeur_id": 2
  }
}
```

---

#### GET `/api/prof/programmes/:id`
**Accès**: Professeur (ses programmes), Admin
**Description**: Détails complets d'un programme avec figures et assignations

**Réponse 200**:
```json
{
  "programme": {
    "id": 29,
    "nom": "Jonglage Débutant",
    "ProgrammesFigures": [...],
    "Assignations": [
      {
        "id": 12,
        "programme_id": 29,
        "eleve_id": 4,
        "date_assignation": "2025-12-16",
        "Eleve": {
          "id": 4,
          "nom": "Moreau",
          "prenom": "Lucas"
        }
      }
    ]
  }
}
```

---

#### PUT `/api/prof/programmes/:id`
**Accès**: Professeur (ses programmes), Admin
**Description**: Modifier nom/description d'un programme

**Body**:
```json
{
  "nom": "Nouveau nom",
  "description": "Nouvelle description"
}
```

---

#### POST `/api/prof/programmes/:id/figures`
**Accès**: Professeur (ses programmes), Admin
**Description**: Ajouter des figures à un programme

**Body**:
```json
{
  "figureIds": [17, 18, 19]
}
```

---

#### DELETE `/api/prof/programmes/:id/figures/:figureId`
**Accès**: Professeur (ses programmes), Admin
**Description**: Retirer une figure d'un programme

---

#### PUT `/api/prof/programmes/:id/reorder`
**Accès**: Professeur (ses programmes), Admin
**Description**: Réordonner les figures dans un programme

**Body**:
```json
{
  "figureOrders": [
    { "figureId": 12, "ordre": 1 },
    { "figureId": 13, "ordre": 2 },
    { "figureId": 14, "ordre": 3 }
  ]
}
```

---

### Groupes

#### GET `/api/prof/groupes`
**Accès**: Professeur, Admin
**Description**: Liste des groupes du professeur

---

#### POST `/api/prof/groupes`
**Accès**: Professeur, Admin
**Description**: Créer un nouveau groupe

**Body**:
```json
{
  "nom": "Groupe Jonglage Avancé",
  "description": "Élèves niveau 3+"
}
```

---

#### POST `/api/prof/groupes/:id/eleves`
**Accès**: Professeur, Admin
**Description**: Ajouter des élèves à un groupe

**Body**:
```json
{
  "eleveIds": [4, 5, 6]
}
```

---

#### POST `/api/prof/groupes/:id/programmes/assigner`
**Accès**: Professeur, Admin
**Description**: Assigner un programme à tous les élèves d'un groupe

---

### Validation

#### POST `/api/progression/etape/:etapeId/valider`
**Accès**: Professeur (ses élèves), Admin
**Description**: Valider manuellement une étape pour un élève

**Body**:
```json
{
  "eleveId": 4,
  "lateralite": "droite"  // optionnel
}
```

**Réponse 200**:
```json
{
  "message": "Étape validée avec succès par le professeur",
  "progression": {
    "id": 102,
    "statut": "valide",
    "date_validation": "2025-12-25T15:30:00.000Z",
    "valide_par_prof_id": 2
  }
}
```

---

### Statistiques

#### GET `/api/prof/statistiques/dashboard`
**Accès**: Professeur, Admin
**Description**: Statistiques globales pour le dashboard prof

---

#### GET `/api/prof/statistiques/eleve/:id`
**Accès**: Professeur (ses élèves), Admin
**Description**: Statistiques détaillées d'un élève

---

## Endpoints ADMIN

### Utilisateurs

#### GET `/api/admin/utilisateurs`
**Accès**: Admin uniquement
**Description**: Liste de tous les utilisateurs

---

#### PUT `/api/admin/utilisateurs/:id/role`
**Accès**: Admin uniquement
**Description**: Modifier le rôle d'un utilisateur

**Body**:
```json
{
  "role": "professeur"  // ou "eleve", "admin"
}
```

---

### Figures

#### POST `/api/admin/figures`
**Accès**: Admin uniquement
**Description**: Créer une nouvelle figure

**Body**:
```json
{
  "nom": "Figure Test",
  "descriptif": "Description détaillée...",
  "discipline_id": 1,
  "difficulty_level": 3,
  "type": "artistique",
  "visibilite": "public",
  "ecole_id": null
}
```

---

## Endpoints PARTAGÉS

### Tous les utilisateurs authentifiés

- GET `/api/utilisateurs/me` - Profil de l'utilisateur connecté
- GET `/api/figures` - Liste des figures accessibles
- GET `/api/figures/:id` - Détails d'une figure
- GET `/api/figures/:id/etapes` - Étapes d'une figure
- GET `/api/disciplines` - Liste des disciplines
- GET `/api/gamification/*` - Tous les endpoints gamification

---

## Codes de Statut HTTP

- `200` - Succès
- `201` - Ressource créée
- `400` - Requête invalide (validation échouée)
- `401` - Non authentifié (token manquant/invalide)
- `403` - Non autorisé (permissions insuffisantes)
- `404` - Ressource non trouvée
- `409` - Conflit (ex: progression déjà existante)
- `500` - Erreur serveur

---

## Exemples de Requêtes

### Login et Récupération des Progressions
```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:4000/api/utilisateurs/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'lucas.moreau@voltige.fr',
    mot_de_passe: 'Eleve123!'
  })
});
const { token, user } = await loginResponse.json();

// 2. Récupérer les progressions
const progressionsResponse = await fetch(
  `http://localhost:4000/api/progression/utilisateur/${user.id}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const progressions = await progressionsResponse.json();
```

### Professeur Valide une Étape
```javascript
const response = await fetch(
  'http://localhost:4000/api/progression/etape/34/valider',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${profToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eleveId: 4,
      lateralite: 'droite'
    })
  }
);
```

---

## Notes Importantes

### Multi-Tenant
- Les figures sont filtrées automatiquement selon l'école de l'utilisateur
- Un utilisateur voit: figures publiques (ecole_id: null) + figures de son école

### Architecture Refactorisée
- Nouvelle structure: `ProgressionEtape` au lieu de `EtapeUtilisateur`
- Gestion des tentatives via `TentativeEtape`
- Progression par étapes individuelles, pas par figure globale

### Modes d'Entraînement

Le système supporte 4 modes d'entraînement pour les tentatives:

1. **Binaire**: Simple succès/échec
   - Utilisé pour enregistrer une tentative réussie ou échouée

2. **Evaluation**: Auto-évaluation qualitative (score 1-3)
   - 1 = Échec / À revoir
   - 2 = Instable / Moyen
   - 3 = Maîtrisé / Parfait

3. **Duree**: Chronométrage de la pratique (en secondes)
   - Permet de suivre l'intensité de l'entraînement
   - Toute session chrono compte comme un succès

4. **Evaluation_Duree**: Combinaison score + durée
   - Capture "3 minutes de pratique instable"
   - Utile pour suivre qualité ET quantité simultanément

Le champ `reussie` (boolean) est automatiquement calculé pour maintenir la compatibilité avec le système de Grit Score.

### Gamification
- XP accordés par étape validée (5-20 XP selon difficulté)
- Badges automatiques basés sur critères (figures validées, streak, etc.)
- Streak calculé automatiquement par activité quotidienne

### Sécurité
- JWT valide 24h
- Vérification des relations prof-élève pour accès données sensibles
- Middleware multi-tenant pour isolation des données par école
