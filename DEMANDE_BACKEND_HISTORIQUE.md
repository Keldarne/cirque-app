# Demande d'évolution Backend : Historique Complet des Tentatives

## Contexte
Le frontend dispose désormais de fonctionnalités d'entraînement avancées (Modes Focus et Chrono) qui génèrent des données riches (scores d'évaluation, durées). Ces données sont correctement stockées en base grâce à la précédente migration.

Cependant, le journal de progression de l'élève (`JournalProgression.js`) n'affiche actuellement qu'une donnée "simulée" basée sur la date de dernière validation. Pour visualiser l'effort réel de l'élève (toutes ses sessions, réussies ou non, avec leur qualité et durée), nous avons besoin d'exposer l'historique complet.

## Objectif
Créer un endpoint API permettant de récupérer l'historique paginé des tentatives pour une étape donnée (ou une figure), afin d'afficher un journal d'entraînement détaillé côté frontend.

---

## Spécifications Techniques

### Nouvel Endpoint Requis

**GET** `/api/entrainement/tentatives/:etapeId`

**Accès :**
*   Élève (ses propres tentatives uniquement)
*   Professeur (tentatives de ses élèves)
*   Admin (tout)

**Paramètres (Query) :**
*   `limit` (optionnel, default 20) : Nombre de résultats.
*   `offset` (optionnel, default 0) : Pagination.

**Réponse Attendue (JSON) :**
```json
[
  {
    "id": 456,
    "progression_etape_id": 102,
    "type_saisie": "evaluation_duree",  // 'binaire', 'evaluation', 'duree', 'evaluation_duree'
    "reussie": true,
    "score": 2,          // 1, 2, 3 ou null
    "duree_secondes": 180, // en secondes ou null
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

### Fichiers à modifier

1.  **`routes/entrainement.js`** :
    *   Ajouter la route `router.get('/tentatives/:etapeId', ...)`
    *   Implémenter la logique de sécurité (vérifier que l'utilisateur a le droit de voir ces données).
    *   Faire la requête Sequelize vers `TentativeEtape` avec un `order: [['createdAt', 'DESC']]`.

2.  **`services/EntrainementService.js`** (Optionnel) :
    *   Si la logique est complexe, créer une méthode `recupererHistorique(etapeId, userId)`.

---

## Pour aller plus loin (Optionnel mais recommandé)

Si possible, ajouter un endpoint global pour voir tout l'entraînement récent d'un élève (toutes figures confondues) :

**GET** `/api/entrainement/historique/utilisateur/:utilisateurId`
*   Similaire au précédent, mais filtré par `utilisateur_id` (via la jointure `ProgressionEtape`) au lieu de `etape_id`.
*   Utile pour le Dashboard Professeur ("Dernières activités de Lucas").
