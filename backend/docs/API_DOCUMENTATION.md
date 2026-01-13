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
   - Profil Utilisateur
   - Progressions
   - Programmes Personnels
   - Partages Programmes (Élève → Prof/Pairs)
   - Figures
   - Entraînement
   - Disciplines
   - Gamification (Streaks uniquement)
   - Statistiques
3. [Endpoints PROFESSEUR](#endpoints-professeur)
   - Élèves
   - Programmes (complets avec duplication, assignation, partages)
   - Groupes (complets avec gestion membres)
   - Dashboard (Matrix + Stats Globales)
   - Statistiques (Vue d'ensemble, Élèves négligés, Engagement, Interactions)
   - Validation
4. [Endpoints ADMIN](#endpoints-admin)
   - Écoles
   - Utilisateurs
   - Figures (CRUD complet)
   - Disciplines (CRUD complet)
   - Discipline Availability (Per-School Configuration)
   - Exercices Décomposés (Système de Suggestions)
   - Système (Monitoring, Logs, Backups, Analytics)
5. [School Management (Admin/School Admin)](#school-management-adminschool-admin)
6. [Suggestions Intelligentes (ÉLÈVE)](#suggestions-intelligentes-élève)
7. [Endpoints PARTAGÉS](#endpoints-partagés)
8. [Annexes](#annexes)
   - Tableau Récapitulatif des Permissions
   - Codes de Statut HTTP
   - Exemples de Requêtes

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

**🆕 Auto-création de Progression**: Si l'utilisateur n'a pas encore commencé la progression sur cette étape, le système crée automatiquement un enregistrement `ProgressionEtape` avec statut `non_commence`. Cela permet l'exploration libre du catalogue sans nécessiter `POST /api/progression`.

**🆕 Protection Idempotence**: Le système vérifie si une tentative identique (même étape, type et résultat) a été enregistrée dans les **3 dernières secondes**. Si oui, la tentative existante est retournée avec status **200 OK** au lieu de créer un doublon.

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

**Réponse 201 Created** (nouvelle tentative):
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
  },
  "idempotent": false
}
```

**Réponse 200 OK** (tentative existante retournée - idempotence):
```json
{
  "message": "Tentative identique déjà enregistrée (idempotence)",
  "progressionEtape": { ... },
  "tentative": { ... },
  "idempotent": true
}
```

**🆕 Erreurs Possibles**:
| Code | Type | Description |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Données invalides selon mode (ex: score manquant en mode evaluation) |
| 400 | `MODEL_VALIDATION_ERROR` | Validation Sequelize échouée (détails inclus) |
| 404 | `ETAPE_NOT_FOUND` | L'etapeId n'existe pas dans EtapeProgressions |
| 409 | `DUPLICATE_ATTEMPT` | Contrainte d'unicité violée |
| 500 | `DATABASE_ERROR` | Erreur de connexion/requête DB |
| 500 | `DATABASE_CONSTRAINT_ERROR` | Violation de contrainte FK |
| 500 | `UNKNOWN_ERROR` | Erreur inattendue |

**Exemple d'erreur 404**:
```json
{
  "error": "Étape non trouvée (ID: 999)",
  "type": "ETAPE_NOT_FOUND"
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

### Gamification (Streaks uniquement)

**Note importante**: Le système gamification a été simplifié. Les badges, titres, défis et classements ont été supprimés. Seuls les streaks (jours consécutifs de pratique) sont conservés.

---

#### GET `/api/gamification/streaks/utilisateur`
**Accès**: Élève, Prof, Admin (via `verifierToken`)
**Description**: Récupère le statut de streak de l'utilisateur connecté

**Réponse 200** (avec streak):
```json
{
  "streak": {
    "id": 12,
    "utilisateur_id": 4,
    "jours_consecutifs": 7,
    "record_personnel": 14,
    "derniere_activite": "2026-01-12",
    "streak_freeze_disponible": true,
    "createdAt": "2025-12-01T00:00:00.000Z",
    "updatedAt": "2026-01-12T18:30:00.000Z"
  }
}
```

**Réponse 200** (aucun streak):
```json
{
  "streak": null
}
```

**Réponse 500**:
```json
{
  "error": "Erreur serveur",
  "details": "message d'erreur"
}
```

---

#### GET `/api/gamification/statistiques/utilisateur/profil-gamification`
**Accès**: Élève, Prof, Admin (via `verifierToken`)
**Description**: Profil gamification simplifié de l'utilisateur connecté (niveau, XP total, streak)

**Réponse 200**:
```json
{
  "profil": {
    "niveau": 3,
    "xp_total": 1250,
    "streak": {
      "jours_consecutifs": 7,
      "record_personnel": 14
    }
  }
}
```

**Réponse 500**:
```json
{
  "error": "Erreur serveur",
  "details": "message d'erreur"
}
```

**Note**: Si l'utilisateur n'a pas de streak, les valeurs seront à 0.

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

#### POST `/api/prof/eleves/import` 🆕
**Accès**: Professeur, School Admin (avec école)
**Description**: Import en masse d'élèves via fichier CSV

**Format**: `multipart/form-data`

**Paramètres**:
- `file` (required): Fichier CSV avec colonnes `Prénom,Nom[,Email]`

**Format CSV**:
```csv
Prénom,Nom
Lucas,Moreau
Emma,Bernard
Louis,Thomas
```

**Avec email optionnel**:
```csv
Prénom,Nom,Email
Lucas,Moreau,
Emma,Bernard,emma.b@parent.fr
Louis,Thomas,
```

**Génération automatique**:
- **Pseudo**: `{prefix}-prenom.nom` (ex: `vol-lucas.moreau`)
  - Préfixe = 3 premières lettres du mot significatif du nom d'école
  - Exemple: "École de Cirque Voltige" → préfixe `vol`
- **Email**: `prenom.nom@{domaine}.fr` (si non fourni dans CSV)
  - Domaine extrait du nom d'école
  - Exemple: "École de Cirque Voltige" → `lucas.moreau@voltige.fr`
- **Mot de passe**: `{NomÉcole}{Année}!` (ex: `Voltige2026!`)
  - Même mot de passe pour tous les élèves importés
  - À distribuer aux élèves (ils pourront le changer après)

**Limites**:
- Max 100 élèves par import
- Ne doit pas dépasser `max_eleves` de l'école
- Pseudos et emails doivent être uniques
- Fichier CSV max 1MB

**Réponse 201 Created**:
```json
{
  "success": true,
  "created": 3,
  "failed": 0,
  "errors": [],
  "students": [
    {
      "id": 123,
      "pseudo": "vol-lucas.moreau",
      "nom": "Moreau",
      "prenom": "Lucas",
      "email": "lucas.moreau@voltige.fr"
    },
    {
      "id": 124,
      "pseudo": "vol-emma.bernard",
      "nom": "Bernard",
      "prenom": "Emma",
      "email": "emma.bernard@voltige.fr"
    },
    {
      "id": 125,
      "pseudo": "vol-louis.thomas",
      "nom": "Thomas",
      "prenom": "Louis",
      "email": "louis.thomas@voltige.fr"
    }
  ],
  "defaultPassword": "Voltige2026!",
  "prefixePseudo": "vol"
}
```

**Réponse 400 Bad Request** (erreurs de validation):
```json
{
  "error": "Erreurs lors de l'import",
  "details": [
    {
      "row": 3,
      "prenom": "Marie",
      "nom": "D",
      "error": "Nom doit contenir au moins 2 caractères"
    }
  ],
  "created": [],
  "failed": [...]
}
```

**Réponse 403 Forbidden** (limite dépassée):
```json
{
  "error": "Import dépasserait la limite d'élèves (48 + 5 > 50)"
}
```

**Réponse 409 Conflict** (doublons):
```json
{
  "error": "Utilisateurs déjà existants: vol-lucas.moreau, vol-emma.bernard"
}
```

**Exemple d'utilisation (curl)**:
```bash
curl -X POST http://localhost:4000/api/prof/eleves/import \
  -H "Authorization: Bearer <token>" \
  -F "file=@eleves.csv"
```

**Notes importantes**:
- ✅ Les élèves peuvent se connecter immédiatement avec leur pseudo généré
- ✅ Login accepte PSEUDO ou EMAIL (détection automatique via '@')
- ✅ Transaction atomique: tout ou rien (si une erreur, aucun élève n'est créé)
- ✅ Les élèves sont automatiquement visibles par tous les profs de l'école
- ⚠️ Le mot de passe par défaut doit être distribué aux élèves de manière sécurisée
- ⚠️ Encourager les élèves à changer leur mot de passe après première connexion

**Cas d'usage**:
- Import de liste de classe en début d'année
- Ajout rapide d'élèves pour ateliers/stages
- Migration depuis autre système
- Élèves jeunes sans adresse email

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
  "ecole_id": null,
  "metadata": {
    "siteswap": "531",
    "num_objects": 3,
    "object_types": ["balls"]
  }
}
```

**Champ `metadata` (optionnel, JSON)**:
- Données spécifiques par discipline (jonglage, aérien, équilibre, etc.)
- Format flexible: voir [FIGURE_METADATA_SPECIFICATION.md](FIGURE_METADATA_SPECIFICATION.md)
- Exemples:
  - **Jonglage**: `{ "siteswap": "531", "num_objects": 3 }`
  - **Aérien**: `{ "apparatus": "tissu", "height_meters": 6, "rotations": 2 }`
  - **Équilibre**: `{ "tempo_seconds": 30, "apparatus": "boule" }`

---

### Discipline Availability (Per-School Configuration)

#### GET `/api/admin/ecoles/:ecoleId/disciplines`
**Accès**: Master admin ou school admin de l'école concernée
**Description**: Liste les disciplines configurées pour une école (opt-in system)

**Query Parameters**:
- `includeInactive` (boolean, optional): Inclure les disciplines désactivées. Défaut: false

**Réponse 200**:
```json
[
  {
    "id": 1,
    "ecole_id": 1,
    "discipline_id": 1,
    "actif": true,
    "ordre": 0,
    "config": null,
    "createdAt": "2026-01-08T23:14:24.000Z",
    "updatedAt": "2026-01-08T23:14:24.000Z",
    "discipline": {
      "id": 1,
      "nom": "Jonglage",
      "description": "Art de manipuler des objets...",
      "image_url": "https://..."
    }
  }
]
```

**Notes**:
- **Système opt-in**: Par défaut, toutes les disciplines sont désactivées pour une école
- Les écoles activent uniquement les disciplines pour lesquelles elles disposent du matériel
- `ordre`: Ordre d'affichage personnalisé pour cette école

---

#### POST `/api/admin/ecoles/:ecoleId/disciplines`
**Accès**: Master admin ou school admin de l'école concernée
**Description**: Activer ou désactiver une discipline pour une école

**Body**:
```json
{
  "discipline_id": 1,
  "actif": true
}
```

**Réponse 200**:
```json
{
  "id": 1,
  "ecole_id": 1,
  "discipline_id": 1,
  "actif": true,
  "ordre": 0,
  "config": null,
  "createdAt": "2026-01-08T23:14:24.000Z",
  "updatedAt": "2026-01-08T23:14:24.000Z"
}
```

**Notes**:
- Crée automatiquement un enregistrement si inexistant (`findOrCreate`)
- Met à jour le statut `actif` si l'enregistrement existe déjà

---

#### PUT `/api/admin/ecoles/:ecoleId/disciplines/bulk`
**Accès**: Master admin ou school admin de l'école concernée
**Description**: Mise à jour en masse des disciplines d'une école

**Body**:
```json
{
  "disciplines": [
    { "discipline_id": 1, "actif": true, "ordre": 0 },
    { "discipline_id": 2, "actif": true, "ordre": 1 },
    { "discipline_id": 3, "actif": false, "ordre": 2 }
  ]
}
```

**Réponse 200**:
```json
{
  "message": "Disciplines mises à jour"
}
```

**Notes**:
- Utilise `upsert` pour créer ou mettre à jour chaque discipline
- Permet de configurer l'ordre d'affichage en une seule requête
- Utile pour synchroniser la configuration complète d'une école

---

### Système (Monitoring, Logs, Backups, Analytics)

**Permissions**: Admin uniquement (tous les endpoints nécessitent `verifierToken` + `estAdmin`)

#### GET `/api/admin/system/health`
**Description**: Santé globale du système (serveur, base de données, ressources)

**Réponse 200**:
```json
{
  "server": {
    "status": "healthy",
    "uptime": 86400
  },
  "database": {
    "status": "healthy",
    "connection": "active"
  },
  "system": {
    "memory": { "used": 512, "total": 2048 },
    "cpu": { "usage": 35.5 }
  }
}
```

---

#### GET `/api/admin/system/metrics`
**Description**: Métriques temps réel (cache 1 minute)

**Réponse 200**:
```json
{
  "users": { "total": 150, "active_today": 42 },
  "requests_per_minute": 120,
  "average_response_time": 85
}
```

---

#### GET `/api/admin/system/database/stats`
**Description**: Statistiques des tables MySQL

**Réponse 200**:
```json
{
  "tables": [
    { "name": "Utilisateurs", "rows": 150, "size_mb": 2.5 },
    { "name": "Figures", "rows": 450, "size_mb": 8.2 }
  ]
}
```

---

#### GET `/api/admin/system/crons/status`
**Description**: Statut des cron jobs

**Réponse 200**:
```json
{
  "crons": [
    {
      "name": "memory_decay",
      "schedule": "0 2 * * *",
      "last_run": "2026-01-12T02:00:00.000Z",
      "status": "success"
    }
  ]
}
```

---

#### GET `/api/admin/system/logs`
**Description**: Liste paginée des logs système avec filtres

**Query params**:
- `niveau` (optionnel): Niveau de log (info, warn, error)
- `categorie` (optionnel): Catégorie (API, AUTH, CRON, etc.)
- `dateDebut` (optionnel): Date début (YYYY-MM-DD)
- `dateFin` (optionnel): Date fin (YYYY-MM-DD)
- `search` (optionnel): Recherche textuelle
- `limit` (défaut: 50, max: 100): Nombre de résultats
- `offset` (défaut: 0): Décalage pagination

**Réponse 200**:
```json
{
  "logs": [
    {
      "id": 1234,
      "niveau": "error",
      "categorie": "API",
      "message": "Erreur connexion DB",
      "metadata": { "endpoint": "/api/figures", "duration_ms": 1250 },
      "createdAt": "2026-01-12T14:30:00.000Z"
    }
  ],
  "total": 450,
  "limit": 50,
  "offset": 0
}
```

---

#### GET `/api/admin/system/logs/stats`
**Description**: Statistiques agrégées des logs

**Query params**:
- `hours` (défaut: 24): Période en heures

**Réponse 200**:
```json
{
  "total": 1542,
  "by_niveau": { "info": 1200, "warn": 300, "error": 42 },
  "by_categorie": { "API": 1000, "AUTH": 300, "CRON": 242 }
}
```

---

#### GET `/api/admin/system/logs/export`
**Description**: Export CSV des logs avec filtres

**Query params**: Mêmes que `/logs` (niveau, categorie, dateDebut, dateFin, search)

**Réponse 200**: Fichier CSV téléchargé
```
Content-Type: text/csv
Content-Disposition: attachment; filename="logs_2026-01-12.csv"
```

---

#### DELETE `/api/admin/system/logs/cleanup`
**Description**: Supprime les logs avant une date spécifique

**Query params**:
- `before` (requis): Date limite (YYYY-MM-DD)

**Réponse 200**:
```json
{
  "message": "Logs nettoyés",
  "deletedCount": 1542,
  "before": "2025-12-01"
}
```

---

#### GET `/api/admin/system/backups`
**Description**: Liste des backups disponibles

**Réponse 200**:
```json
{
  "backups": [
    {
      "id": 42,
      "filename": "backup_2026-01-12_manual.sql",
      "type": "manual",
      "status": "completed",
      "size_mb": 125.4,
      "created_by_id": 1,
      "createdAt": "2026-01-12T10:00:00.000Z"
    }
  ]
}
```

---

#### POST `/api/admin/system/backups`
**Description**: Créer un backup manuel de la base de données

**Réponse 201**:
```json
{
  "message": "Backup créé avec succès",
  "backup": {
    "id": 43,
    "filename": "backup_2026-01-12_manual.sql",
    "status": "completed"
  }
}
```

---

#### GET `/api/admin/system/backups/:id/download`
**Description**: Télécharger un fichier de backup

**Réponse 200**: Fichier SQL téléchargé

**Réponse 404**: Backup non trouvé

**Réponse 400**: Backup non disponible (status ≠ completed)

---

#### DELETE `/api/admin/system/backups/:id`
**Description**: Supprimer un backup

**Réponse 200**:
```json
{
  "message": "Backup supprimé avec succès"
}
```

---

#### GET `/api/admin/system/analytics/users`
**Description**: Croissance utilisateurs et répartition par rôle (6 derniers mois)

**Réponse 200**:
```json
{
  "monthlyGrowth": {
    "2025-08": { "admin": 0, "professeur": 2, "eleve": 15 },
    "2025-09": { "admin": 0, "professeur": 1, "eleve": 22 }
  },
  "roleDistribution": {
    "admin": 1,
    "professeur": 10,
    "eleve": 120
  },
  "total": 131
}
```

---

#### GET `/api/admin/system/analytics/schools`
**Description**: Statistiques écoles (total, actives, répartition par plan)

**Réponse 200**:
```json
{
  "total": 12,
  "active": 10,
  "byPlan": { "basic": 5, "premium": 3, "trial": 2 },
  "byStatus": { "active": 10, "suspended": 2 }
}
```

---

#### GET `/api/admin/system/analytics/activity`
**Description**: Activité globale (tentatives par jour, 7 derniers jours)

**Réponse 200**:
```json
{
  "dailyActivity": {
    "2026-01-06": 45,
    "2026-01-07": 52,
    "2026-01-12": 67
  },
  "total": 380
}
```

---

#### GET `/api/admin/system/analytics/content`
**Description**: Stats contenu (figures, disciplines, progressions, tentatives)

**Réponse 200**:
```json
{
  "figures": { "total": 450, "public": 200, "schools": 250 },
  "disciplines": 12,
  "progressions": 3542,
  "tentatives": 15420
}
```

---

#### GET `/api/admin/system/analytics/performance`
**Description**: Top 10 requêtes lentes et erreurs récentes (24h)

**Réponse 200**:
```json
{
  "slowRequests": [
    {
      "endpoint": "/api/prof/dashboard/matrix",
      "method": "GET",
      "duration_ms": 2540,
      "timestamp": "2026-01-12T14:00:00.000Z"
    }
  ],
  "recentErrors": [
    {
      "endpoint": "/api/figures/999",
      "method": "GET",
      "statusCode": 500,
      "message": "Figure not found",
      "timestamp": "2026-01-12T15:30:00.000Z"
    }
  ]
}
```

---

### Exercices Décomposés (Système de Suggestions)

**Permissions**: Admin uniquement

#### POST `/api/admin/figures/:figureId/exercices`
**Description**: Ajouter un exercice décomposé (prérequis) à une figure

**Body**:
```json
{
  "exercice_figure_id": 42,
  "ordre": 1,
  "est_requis": true,
  "poids": 2
}
```

**Réponse 201**:
```json
{
  "message": "Exercice \"Lancer 3 balles\" ajouté à la figure \"Cascade 5 balles\"",
  "exercice": {
    "id": 123,
    "figure_parente": "Cascade 5 balles",
    "exercice": "Lancer 3 balles",
    "ordre": 1,
    "est_requis": true,
    "poids": 2
  }
}
```

**Réponse 400**: Cycle détecté (A → B → A)
**Réponse 404**: Figure parente ou exercice non trouvé
**Réponse 409**: Exercice déjà lié à cette figure

---

#### GET `/api/admin/figures/:figureId/exercices`
**Description**: Liste les exercices d'une figure (triés par ordre)

**Réponse 200**:
```json
{
  "figure": { "id": 50, "nom": "Cascade 5 balles" },
  "exercices": [
    {
      "id": 123,
      "ordre": 1,
      "est_requis": true,
      "poids": 2,
      "exercice": {
        "id": 42,
        "nom": "Lancer 3 balles",
        "descriptif": "Maîtriser le lancer à 3 balles",
        "difficulty_level": 2,
        "type": "preparation"
      }
    }
  ],
  "count": 1
}
```

---

#### PUT `/api/admin/exercices/:exerciceId`
**Description**: Modifier un exercice décomposé (ordre, poids, est_requis)

**Body** (tous optionnels):
```json
{
  "ordre": 2,
  "poids": 3,
  "est_requis": false
}
```

**Réponse 200**:
```json
{
  "message": "Exercice mis à jour",
  "exercice": {
    "id": 123,
    "ordre": 2,
    "poids": 3,
    "est_requis": false
  }
}
```

---

#### DELETE `/api/admin/exercices/:exerciceId`
**Description**: Supprimer un exercice décomposé

**Réponse 200**:
```json
{
  "message": "Exercice \"Lancer 3 balles\" retiré de la figure \"Cascade 5 balles\"",
  "deleted_id": 123
}
```

---

### CRUD Figures et Disciplines (Admin)

#### GET `/api/admin/figures`
**Permissions**: Admin uniquement
**Description**: Récupérer toutes les figures (ou par école)

**Query params**:
- `ecole_id` (optionnel): Filtrer par école ou "null" pour catalogue public

**Réponse 200**: Tableau de figures avec disciplines

---

#### PUT `/api/admin/figures/:id`
**Permissions**: Admin ou créateur figure
**Description**: Modifier une figure (nom, descriptif, étapes, prérequis, metadata)

**Body** (même format que POST `/api/admin/figures`):
- Tous les champs sont optionnels
- `metadata` peut être mis à jour ou laissé null
- Voir [FIGURE_METADATA_SPECIFICATION.md](FIGURE_METADATA_SPECIFICATION.md) pour format metadata

**Note**: Personnel école ne peut modifier que les figures de son école (pas le catalogue public)

---

#### DELETE `/api/admin/figures/:id`
**Permissions**: Admin ou créateur figure
**Description**: Supprimer une figure et toutes ses données associées

**Note**: Supprime aussi les étapes, progressions et tentatives associées

---

#### POST `/api/admin/disciplines`
**Permissions**: Admin uniquement
**Description**: Créer une nouvelle discipline

**Body**:
```json
{
  "nom": "Monocycle",
  "description": "Arts du monocycle",
  "icone": "bicycle"
}
```

---

#### PUT `/api/admin/disciplines/:id`
**Permissions**: Admin uniquement
**Description**: Modifier une discipline

---

#### DELETE `/api/admin/disciplines/:id`
**Permissions**: Admin uniquement
**Description**: Supprimer une discipline

**Note**: Échoue si des figures sont liées à cette discipline

---

#### GET `/api/admin/ecoles`
**Permissions**: Admin uniquement
**Description**: Liste toutes les écoles

**Réponse 200**: Tableau d'écoles triées par nom

---

## School Management (Admin/School Admin)

**Base**: `/api/school/users`

**Permissions**: Admin global OU Prof/School Admin de l'école

---

#### GET `/api/school/users`
**Description**: Liste tous les utilisateurs de l'école

**Query params** (admin uniquement):
- `ecole_id` (optionnel): Filtrer par école spécifique

**Réponse 200**:
```json
[
  {
    "id": 42,
    "pseudo": "emma.martin",
    "prenom": "Emma",
    "nom": "Martin",
    "email": "emma.martin@voltige.fr",
    "role": "eleve",
    "ecole_id": 1,
    "niveau": 3,
    "xp_total": 1250,
    "actif": true,
    "createdAt": "2025-09-01T00:00:00.000Z",
    "Ecole": { "id": 1, "nom": "École Voltige" }
  }
]
```

---

#### POST `/api/school/users`
**Description**: Créer un nouvel utilisateur dans l'école

**Body**:
```json
{
  "prenom": "Emma",
  "nom": "Martin",
  "email": "emma.martin@voltige.fr",
  "role": "eleve",
  "password": "optionnel",
  "pseudo": "optionnel"
}
```

**Réponse 201**:
```json
{
  "message": "Utilisateur créé avec succès",
  "utilisateur": {
    "id": 42,
    "pseudo": "emma.martin",
    "prenom": "Emma",
    "nom": "Martin",
    "email": "emma.martin@voltige.fr",
    "role": "eleve",
    "ecole_id": 1
  },
  "defaultPassword": "Voltige2026!"
}
```

**Notes**:
- Email optionnel (peut être null)
- Pseudo auto-généré si non fourni: `[ecole]-[prenom].[nom]`
- Mot de passe par défaut: `[NomÉcole][Année]!`
- Admin peut spécifier `ecole_id`, sinon forcé à celle du créateur

---

#### PUT `/api/school/users/:id`
**Description**: Modifier un utilisateur

**Body** (tous optionnels):
```json
{
  "prenom": "Emma",
  "nom": "Martin",
  "email": "emma.new@voltige.fr",
  "role": "professeur"
}
```

**Restrictions**:
- Ne peut modifier que les utilisateurs de sa propre école
- Professeur ne peut pas modifier admin/school_admin
- Seul admin peut créer des admins/school_admins

---

#### DELETE `/api/school/users/:id`
**Description**: Supprimer un utilisateur

**Restrictions**:
- Ne peut pas se supprimer soi-même
- Mêmes restrictions que PUT

---

#### POST `/api/school/users/:id/archive`
**Description**: Archiver un utilisateur (désactivation soft delete)

**Réponse 200**:
```json
{
  "message": "Utilisateur archivé avec succès",
  "utilisateur": {
    "id": 42,
    "pseudo": "emma.martin",
    "actif": false
  }
}
```

---

## Suggestions Intelligentes (ÉLÈVE)

**Base**: `/api/suggestions`

**Permissions**: Élève, Prof, Admin (via `verifierToken`)

**Fonctionnalité**: Recommandations personnalisées basées sur les exercices validés

---

#### GET `/api/suggestions`
**Description**: Récupère les top 5 suggestions personnalisées pour l'élève connecté

**Réponse 200**:
```json
{
  "suggestions": [
    {
      "figure_id": 50,
      "nom": "Cascade 5 balles",
      "score_preparation": 85,
      "exercices_valides": 8,
      "exercices_total": 10,
      "badge": "prêt",
      "discipline": "Jonglage"
    }
  ],
  "count": 5,
  "message": "5 suggestions disponibles"
}
```

**Notes**:
- Exclut les figures déjà assignées, dans programme personnel, ou validées
- Score ≥ 80% = badge "prêt"
- Score 60-79% = badge "bientôt prêt"
- Basé sur le pourcentage d'exercices prérequis validés

---

#### GET `/api/suggestions/:figureId/details`
**Description**: Détails de préparation pour une figure spécifique

**Réponse 200**:
```json
{
  "figure_id": 50,
  "score_preparation": 85,
  "exercices_valides": 8,
  "exercices_total": 10,
  "details": [
    {
      "exercice_id": 42,
      "nom": "Lancer 3 balles",
      "valide": true
    },
    {
      "exercice_id": 43,
      "nom": "Échange 4 balles",
      "valide": false
    }
  ],
  "message": "Tu es prêt pour cette figure !"
}
```

---

#### POST `/api/suggestions/:figureId/accepter`
**Description**: Accepter une suggestion = ajouter la figure au programme personnel

**Réponse 201**:
```json
{
  "message": "Figure ajoutée à ton programme personnel",
  "programme": {
    "id": 12,
    "nom": "Programme Personnel"
  }
}
```

**Note**: Crée automatiquement un programme "Programme Personnel" si inexistant

---

#### POST `/api/suggestions/:figureId/dismisser`
**Description**: Rejeter une suggestion (masquer)

**Réponse 200**:
```json
{
  "message": "Suggestion masquée",
  "updated": true
}
```

**Note**: Sera recalculée lors du prochain rafraîchissement nocturne

---

## Endpoints PROFESSEUR (Compléments)

### Programmes (Compléments)

#### POST `/api/prof/programmes/:id/dupliquer`
**Description**: Dupliquer un programme (utile pour créer des variantes)

**Body**:
```json
{
  "nouveau_nom": "Programme Aérien - Niveau 2"
}
```

**Réponse 201**:
```json
{
  "message": "Programme dupliqué avec succès",
  "programme": {
    "id": 45,
    "nom": "Programme Aérien - Niveau 2",
    "figures": [...]
  }
}
```

---

#### POST `/api/prof/programmes/:id/assigner`
**Description**: Assigner un programme à des élèves ET/OU groupes (endpoint unifié)

**Body**:
```json
{
  "eleve_ids": [4, 5, 6],
  "groupe_ids": [1, 2],
  "source_partage_id": 42
}
```

**Réponse 200**:
```json
{
  "success": true,
  "results": {
    "assignations_creees": 5,
    "deja_assignes": 1
  }
}
```

**Notes**:
- Au moins `eleve_ids` OU `groupe_ids` requis
- `source_partage_id` optionnel (si programme reçu d'un élève)
- Les élèves des groupes reçoivent aussi des assignations individuelles

---

#### GET `/api/prof/programmes/:id/assignations`
**Description**: Résumé des assignations d'un programme

**Réponse 200**:
```json
{
  "programme_id": 10,
  "groupes": [
    { "id": 1, "nom": "Débutants", "membres_count": 12 }
  ],
  "eleves_individuels": [
    { "id": 4, "nom": "Martin", "prenom": "Emma" }
  ],
  "total_eleves": 13
}
```

---

#### DELETE `/api/prof/programmes/:id/groupes/:groupeId`
**Description**: Retirer l'assignation de groupe

**Réponse 200**:
```json
{
  "message": "Assignation de groupe retirée avec succès",
  "note": "Les élèves gardent leurs assignations individuelles"
}
```

---

#### DELETE `/api/prof/programmes/:id/eleves/:eleveId`
**Description**: Retirer l'assignation individuelle d'un élève

**Réponse 200**:
```json
{
  "message": "Assignation retirée avec succès"
}
```

---

#### DELETE `/api/prof/programmes/:id`
**Description**: Supprimer un programme

**Note**: Supprime le programme ET toutes ses assignations

---

#### GET `/api/prof/programmes/partages`
**Description**: Liste des programmes partagés avec le prof (par des élèves)

**Réponse 200**:
```json
{
  "programmes": [
    {
      "id": 12,
      "nom": "Mon Programme Perso",
      "professeur_id": 4,
      "partage_id": 42,
      "date_partage": "2026-01-10T10:00:00.000Z",
      "note": "Besoin de feedback sur ce programme",
      "partage_par": {
        "id": 4,
        "pseudo": "emma.martin",
        "email": "emma.martin@voltige.fr",
        "nom": "Martin",
        "prenom": "Emma"
      },
      "ProgrammesFigures": [...]
    }
  ],
  "total": 1
}
```

**Note**: Utilise le nouveau modèle polymorphique `ProgrammePartage`

---

### Groupes (Compléments)

#### GET `/api/prof/groupes/:id`
**Description**: Détails d'un groupe avec membres et leurs streaks

**Réponse 200**:
```json
{
  "groupe": {
    "id": 1,
    "nom": "Débutants",
    "description": "Groupe niveau 1-2",
    "couleur": "#1976d2",
    "membres": [
      {
        "eleve": {
          "id": 4,
          "nom": "Martin",
          "prenom": "Emma",
          "niveau": 2,
          "xp_total": 450,
          "streak": {
            "jours_consecutifs": 5,
            "record_personnel": 12
          }
        }
      }
    ]
  }
}
```

---

#### PUT `/api/prof/groupes/:id`
**Description**: Modifier un groupe (nom, description, couleur)

**Body**:
```json
{
  "nom": "Débutants Niveau 1",
  "description": "Groupe mis à jour",
  "couleur": "#FF5722"
}
```

---

#### DELETE `/api/prof/groupes/:id`
**Description**: Supprimer un groupe (soft delete: actif = false)

**Note**: Supprime aussi tous les membres du groupe

---

#### POST `/api/prof/groupes/:id/membres`
**Description**: Ajouter un élève à un groupe + propagation automatique des programmes

**Body**:
```json
{
  "eleve_id": 42
}
```

**Réponse 201**:
```json
{
  "message": "Élève ajouté au groupe avec succès",
  "propagation": {
    "programmes_assignes": 3,
    "programmes_deja_assignes": 1
  }
}
```

**Note**: Les programmes du groupe sont automatiquement assignés au nouvel élève

---

#### DELETE `/api/prof/groupes/:id/membres/:eleveId`
**Description**: Retirer un élève d'un groupe

**Note**: Ne supprime PAS les assignations de programmes

---

### Statistiques (Compléments)

#### GET `/api/prof/statistiques`
**Description**: Vue d'ensemble des statistiques prof

**Réponse 200**:
```json
{
  "statistiques": {
    "total_eleves": 45,
    "total_groupes": 5,
    "eleves_actifs_semaine": 32,
    "xp_total_eleves": 56250,
    "moyenne_xp_par_eleve": 1250
  }
}
```

---

#### GET `/api/prof/statistiques/eleves-negliges`
**Description**: Élèves sans interaction depuis X jours

**Query params**:
- `seuil_jours` (défaut: 30): Nombre de jours sans interaction
- `limit` (défaut: 10): Nombre max de résultats

**Réponse 200**:
```json
{
  "total_eleves": 45,
  "negliges_count": 8,
  "taux_neglige": 17.8,
  "seuil_jours": 30,
  "eleves": [
    {
      "id": 42,
      "nom": "Martin",
      "prenom": "Emma",
      "jours_sans_interaction": 45,
      "derniere_interaction": "2025-11-28T10:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/prof/statistiques/engagement`
**Description**: Statistiques d'engagement du professeur

**Réponse 200**:
```json
{
  "statistiques_engagement": {
    "interactions_totales": 450,
    "interactions_semaine": 42,
    "moyenne_par_eleve": 10,
    "taux_reponse_24h": 85.5
  }
}
```

---

#### GET `/api/prof/statistiques/interactions/:eleveId`
**Description**: Historique des interactions avec un élève

**Query params**:
- `limit` (défaut: 20): Nombre max de résultats

**Réponse 200**:
```json
{
  "eleve_id": 42,
  "total_interactions": 15,
  "interactions": [
    {
      "id": 123,
      "type": "validation",
      "description": "Étape validée: Roue libre",
      "date": "2026-01-10T14:30:00.000Z"
    }
  ]
}
```

---

### Dashboard (NOUVEAU)

**Base**: `/api/prof/dashboard`

---

#### GET `/api/prof/dashboard/matrix`
**Description**: Matrice de progression bulk (tous les élèves du prof)

**Query params**:
- `groupe_id` (optionnel): Filtrer par groupe spécifique

**Réponse 200**:
```json
{
  "matrix": {
    "eleves": [
      {
        "id": 4,
        "nom": "Martin",
        "prenom": "Emma",
        "progressions": [
          { "figure_id": 10, "statut": "valide", "pourcentage": 100 },
          { "figure_id": 12, "statut": "en_cours", "pourcentage": 60 }
        ]
      }
    ],
    "figures": [
      { "id": 10, "nom": "Roue", "discipline": "Monocycle" },
      { "id": 12, "nom": "Cascade 3 balles", "discipline": "Jonglage" }
    ]
  }
}
```

**Note**: Optimisé pour performances (1 seule requête SQL bulk au lieu de N requêtes)

---

#### GET `/api/prof/dashboard/stats-globales`
**Description**: Statistiques globales pour graphiques dashboard

**Réponse 200**:
```json
{
  "moyennes_par_discipline": {
    "Jonglage": 75.5,
    "Aérien": 62.3,
    "Monocycle": 80.0
  },
  "activite_hebdomadaire": {
    "2026-01-06": 45,
    "2026-01-07": 52,
    "2026-01-12": 67
  }
}
```

**Note**: Si admin, retourne stats de TOUS les élèves (pas filtré par prof)

---

## Endpoints ÉLÈVE (Compléments)

### Programmes Personnels

**Base**: `/api/progression/programmes`

---

#### GET `/api/progression/programmes`
**Description**: Liste des programmes assignés ET programmes personnels créés

**Réponse 200**:
```json
{
  "programmes_assignes": [
    {
      "id": 10,
      "nom": "Programme Débutants",
      "professeur_id": 1,
      "assignation_id": 42,
      "date_assignation": "2026-01-01T00:00:00.000Z",
      "figures": [...]
    }
  ],
  "programmes_personnels": [
    {
      "id": 12,
      "nom": "Mon Programme Perso",
      "professeur_id": 4,
      "figures": [...]
    }
  ]
}
```

---

#### POST `/api/progression/programmes`
**Description**: Créer un nouveau programme personnel

**Body**:
```json
{
  "nom": "Mon Programme Aérien",
  "description": "Progression tissu aérien",
  "figureIds": [10, 12, 15]
}
```

**Réponse 201**:
```json
{
  "programme": {
    "id": 13,
    "nom": "Mon Programme Aérien",
    "professeur_id": 4,
    "est_modele": false,
    "figures": [...]
  }
}
```

**Note**: `est_modele` toujours false pour les élèves

---

#### PUT `/api/progression/programmes/:id`
**Description**: Modifier un programme personnel (nom, description)

**Restrictions**: Seulement ses propres programmes

---

#### DELETE `/api/progression/programmes/:id`
**Description**: Supprimer un programme personnel

**Restrictions**:
- Bloque si partages actifs existent
- Bloque si assignations actives existent
- L'utilisateur doit d'abord annuler tous les partages

**Réponse 409** (si dépendances):
```json
{
  "error": "Impossible de supprimer ce programme",
  "raison": "Il est actuellement partagé ou assigné à des élèves",
  "partages_actifs": 2,
  "assignations_actives": 0,
  "suggestion": "Annulez d'abord tous les partages (DELETE /programmes/:id/partages)"
}
```

---

#### POST `/api/progression/programmes/:id/figures`
**Description**: Ajouter des figures au programme

**Body**:
```json
{
  "figureIds": [20, 21, 22]
}
```

**Réponse 201**:
```json
{
  "ajouts": [
    { "id": 45, "programme_id": 12, "figure_id": 20, "ordre": 4 },
    { "id": 46, "programme_id": 12, "figure_id": 21, "ordre": 5 }
  ]
}
```

**Note**: Ordre auto-calculé (max existant + 1)

---

#### DELETE `/api/progression/programmes/:id/figures/:figureId`
**Description**: Retirer une figure du programme

---

#### PUT `/api/progression/programmes/:id/reorder`
**Description**: Réordonner les figures du programme

**Body**:
```json
{
  "figureOrders": [
    { "figureId": 20, "ordre": 1 },
    { "figureId": 21, "ordre": 2 },
    { "figureId": 22, "ordre": 3 }
  ]
}
```

---

### Partages Programmes (Élève → Prof/Pairs)

#### POST `/api/progression/programmes/:id/partager/profs`
**Description**: Partager un programme personnel avec un ou plusieurs professeurs

**Body**:
```json
{
  "professeurIds": [1, 2],
  "note": "Besoin de feedback sur ce programme"
}
```

**Réponse 200**:
```json
{
  "message": "Programme partagé avec 2 professeur(s)",
  "partagesCreated": [
    { "professeurId": 1, "pseudo": "prof.martin" },
    { "professeurId": 2, "pseudo": "prof.durand" }
  ],
  "partagesSkipped": []
}
```

**Validations**:
- Vérifie que l'utilisateur a une `RelationProfEleve` acceptée avec chaque prof
- Ignorer les partages déjà existants

---

#### POST `/api/progression/programmes/:id/partager/peers`
**Description**: Partager un programme personnel avec des élèves (peer-to-peer)

**Body**:
```json
{
  "eleveIds": [5, 6],
  "note": "Programme sympa pour débutants"
}
```

**Validations**:
- Impossible de partager avec soi-même
- Vérifie que les élèves sont dans la même école
- Utilise type = 'peer' dans `ProgrammePartage`

---

#### DELETE `/api/progression/programmes/:id/partages/:partageId`
**Description**: Annuler UN partage spécifique (soft delete + détachement assignations)

**Réponse 200**:
```json
{
  "message": "Partage annulé avec succès",
  "partage_avec": "prof.martin",
  "assignations_detachees": 5,
  "details": "5 assignation(s) détachée(s) mais restent actives"
}
```

**Comportement**:
- Soft delete du partage (`actif = false`)
- Détache les assignations dépendantes (`source_detachee = true`)
- Les assignations RESTENT actives pour ne pas perturber les élèves

---

#### DELETE `/api/progression/programmes/:id/partages`
**Description**: Annuler TOUS les partages d'un programme (bulk)

**Query params**:
- `type` (optionnel): 'prof' ou 'peer' pour filtrer

**Réponse 200**:
```json
{
  "message": "3 partage(s) annulé(s)",
  "count": 3,
  "type_filtre": "tous",
  "assignations_detachees": 12
}
```

---

#### GET `/api/progression/programmes/:id/partages`
**Description**: Lister tous les utilisateurs avec qui un programme est partagé

**Query params**:
- `type` (optionnel): 'prof' ou 'peer' pour filtrer

**Réponse 200**:
```json
[
  {
    "id": 42,
    "shared_with_id": 1,
    "pseudo": "prof.martin",
    "email": "prof.martin@voltige.fr",
    "role": "professeur",
    "type": "prof",
    "note": "Besoin de feedback",
    "date_partage": "2026-01-10T10:00:00.000Z"
  },
  {
    "id": 43,
    "shared_with_id": 5,
    "pseudo": "emma.durand",
    "email": null,
    "role": "eleve",
    "type": "peer",
    "note": null,
    "date_partage": "2026-01-11T14:00:00.000Z"
  }
]
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

## Annexes

### Tableau Récapitulatif des Permissions

Ce tableau liste tous les middlewares de sécurité utilisés dans l'API et leurs fonctions.

| Middleware | Rôles Autorisés | Fonction | Fichier |
|------------|-----------------|----------|---------|
| `verifierToken` | Tous utilisateurs authentifiés | Valide le JWT et attache `req.user` | `backend/src/middleware/auth.js` |
| `estAdmin` | Admin uniquement | Vérifie `role === 'admin'` | `backend/src/middleware/auth.js` |
| `estAdminOuSchoolAdmin` | Admin ou school_admin | Vérifie `role in ['admin', 'school_admin']` | `backend/src/middleware/auth.js` |
| `estProfesseurOuAdmin` | Professeur ou admin | Vérifie `role in ['professeur', 'admin']` | `backend/src/middleware/auth.js` |
| `estPersonnelAutorise` | Admin, school_admin, ou professeur | Personnel école uniquement | `backend/src/middleware/auth.js` |
| `peutModifierFigure` | Créateur de figure ou admin | Vérifie ownership via `createur_id` | `backend/src/middleware/permissions.js` |
| `verifierRelationProfEleve` | Prof avec relation élève | Vérifie `RelationProfEleve` active | `backend/src/middleware/permissions.js` |
| `authorize(Model, field)` | Propriétaire ressource ou admin | Generic ownership check (ex: ProgrammeProf) | `backend/src/middleware/permissions.js` |
| `contexteEcole` | Tous (automatique) | Filtre multi-tenant par `ecole_id` | `backend/src/middleware/contexteEcole.js` |

**Règles de Sécurité Clés**:
- ✅ **Double Protection**: Frontend filtre UI + Backend valide permissions
- ✅ **Multi-tenant**: `contexteEcole` filtre automatiquement par école (utilisateurs voient public + leur école)
- ✅ **Ownership**: Teachers/admins peuvent seulement modifier leur contenu (sauf admin master)
- ✅ **Relations**: Profs accèdent seulement aux données de leurs élèves (via `RelationProfEleve` ou même école)
- ✅ **Isolation École**: Personnel école (school_admin/professeur) ne peut PAS modifier le catalogue public

**Exemples d'Usage**:
```javascript
// Middleware simple
router.get('/admin/figures', verifierToken, estAdmin, async (req, res) => { ... });

// Middleware avec ownership
router.put('/admin/figures/:id', verifierToken, estPersonnelAutorise, peutModifierFigure, async (req, res) => { ... });

// Middleware générique authorize
router.put('/prof/programmes/:id', verifierToken, estProfesseurOuAdmin,
  authorize(ProgrammeProf, 'professeur_id', { actif: true }),
  async (req, res) => { ... }
);
```

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

### Metadata JSON (Évolutivité Discipline-Spécifique)

**Migration 003** - 2026-01-12

Les figures supportent désormais un champ `metadata` (type JSON) pour stocker des données spécifiques par discipline sans modifier le schéma DB.

**Avantages**:
- ✅ **Flexibilité**: Chaque discipline a ses propres besoins
- ✅ **Évolutivité**: Ajouter champs sans migration DB
- ✅ **Rétrocompatibilité**: `null` pour figures existantes

**Exemples par discipline**:

**Jonglage**:
```json
{
  "siteswap": "531",
  "num_objects": 3,
  "object_types": ["balls", "clubs"],
  "juggling_lab_compatible": true
}
```

**Aérien**:
```json
{
  "apparatus": "tissu",
  "height_meters": 6,
  "rotations": 2,
  "safety_mat_required": true
}
```

**Équilibre**:
```json
{
  "tempo_seconds": 30,
  "apparatus": "boule",
  "surface_type": "unstable"
}
```

**Documentation complète**: [FIGURE_METADATA_SPECIFICATION.md](FIGURE_METADATA_SPECIFICATION.md)

---

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
