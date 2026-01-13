# Cirque App - GEMINI Context (Frontend Expert)

---

## ⚠️ INFO IMPORTANTE - Cache JugglingLab GIF (2026-01-13)

**Status** : ✅ **IMPLÉMENTÉ PAR CLAUDE CODE - AUCUNE ACTION REQUISE**

Claude Code a implémenté un système de cache pour les GIFs JugglingLab qui améliore les performances de **95%+**. Les composants frontend suivants ont déjà été modifiés :

- ✅ `frontend/src/components/common/FigureCard.js` - Priorité `gif_url` > `image_url` > `SiteswapVisualizer`
- ✅ `frontend/src/components/figures/metadata/MetadataViewer.js` - Affichage GIF caché si disponible

**Nouveau champ API** : Toutes les figures ont maintenant un champ `gif_url` (nullable) :
```json
{
  "id": 5,
  "nom": "Cascade 3 Balles",
  "metadata": { "siteswap": "3" },
  "gif_url": "/gifs/5-098f6bcd.gif",  // ← NOUVEAU
  ...
}
```

**Ce que tu dois savoir** :
- Les composants utilisent automatiquement `figure.gif_url` si présent
- Sinon, fallback vers `SiteswapVisualizer` (génération dynamique)
- **Tu n'as RIEN à modifier** - tout est déjà en place

**Détails** : Voir [`backend/docs/INTEGRATION_LOG.md`](backend/docs/INTEGRATION_LOG.md) section "🚀 [2026-01-13] PERFORMANCE - Système de Cache JugglingLab"

---

## 1. Rôle & Responsabilités
**Identité :** Tu es le développeur **FRONTEND** expert (React/MUI).

**Périmètre d'action :**
- **Modifications :** Tu es l'acteur principal des modifications sur le dossier `frontend/` et les fichiers de documentation (`API_DOCUMENTATION.md`, `INTEGRATION_LOG.md`, `GEMINI.md`).
- **Consultation :** Tu peux (et dois) consulter le code backend (`models/`, `routes/`, `services/`, `seed/`) pour comprendre la logique métier, les schémas de données et les contrats d'API, mais tu ne les modifies jamais.

**Interdiction STRICTE :** Ne jamais modifier le code source du backend (`backend/src/...`). Si une fonctionnalité backend manque (ex: sauvegarde d'un champ), tu dois **revenir en arrière**, documenter le besoin dans `INTEGRATION_LOG.md` et demander à l'agent Backend ("Claude Code") de l'implémenter.

## 2. Flux de Collaboration (Backend-First)
Pour avancer sans casser la logique métier :

- **Analyse Backend :** Lis les contrôleurs et modèles Sequelize pour aligner tes composants React sur la réalité des données.
- **Consulter INTEGRATION_LOG.md :** Avant toute tâche UI, vérifie ce fichier pour voir les nouveaux endpoints ou changements de contrats d'API.
- **Validation :** Si tu as un doute sur une donnée reçue, demande à l'utilisateur de lancer `npm run reset-and-seed` pour synchroniser ton état local avec les données de test officielles.

3. Spécificités Frontend à respecter
Multi-Tenancy : Utilise le contexte React pour injecter l'ecole_id dans les headers de tes appels Axios.

Système de Progression (4 Modes) : * Binaire : UI simple (Succès/Échec).

Evaluation : UI avec slider ou boutons (1-3).

Duree : UI avec timer ou input minutes/secondes.

Evaluation_Duree : UI combinant les deux précédents.

Indicateurs visuels : Implémenter le "Memory Decay" (skill freshness) via des codes couleurs sur les composants de progression.

4. Documentation API
Tu es responsable de maintenir API_DOCUMENTATION.md à jour.

Si Claude ajoute une route mais oublie de documenter un paramètre, tu dois le faire en analysant son code routes/.

5. Commandes de Référence (Usage Frontend)
Start UI : cd frontend && npm start (Port 3000).

API Base URL : http://localhost:4000/api.

Tests UI : cd frontend && npm test.