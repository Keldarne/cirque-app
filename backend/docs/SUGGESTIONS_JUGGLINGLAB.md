# 🤹‍♂️ Plan d'Implémentation - Visualisation JugglingLab (Siteswap)

**Objectif** : Intégrer des animations automatiques pour les figures de jonglage en utilisant l'API stateless de JugglingLab.

---

## 🏗️ Architecture des Données (Backend)
*   **Modèle Figure** : Ajout d'une colonne `metadata` (JSONB) pour stocker les paramètres spécifiques à la discipline.
*   **Structure attendue** : 
    ```json
    {
      "siteswap": "531",
      "jugglinglab_params": {
        "bps": 4,
        "colors": "red;blue"
      }
    }
    ```

---

## 🎨 Composants Frontend (Gemini)

### 1. Composant `SiteswapVisualizer`
**Rôle** : Afficher l'animation GIF à partir d'un code siteswap.
*   **Props** : `siteswap` (string), `height` (number), `width` (number).
*   **Logique** : 
    *   Génère l'URL : `https://jugglinglab.org/anim?pattern={siteswap}&redirect=gif`.
    *   Affiche un `<img />` avec un fallback (placeholder) si le chargement échoue.
    *   Optionnel : Lien vers le simulateur interactif complet.

### 2. Intégration dans `FigureForm` (Edition/Création)
*   Détection de la discipline "Jonglerie".
*   Affichage d'un champ "Siteswap" si discipline correspondante.
*   **Live Preview** : Affichage immédiat du `SiteswapVisualizer` dès que l'utilisateur tape un code.

### 3. Intégration dans `FigureDetail` (Consultation)
*   Si `metadata.siteswap` est présent, l'animation est affichée en tête de fiche ou à la place de l'image par défaut.

---

## 🛠️ Étapes d'Implémentation

1.  **Migration DB** : Ajouter `metadata` à la table `Figures`.
2.  **Modèle Backend** : Mettre à jour `backend/src/models/Figure.js`.
3.  **Composant React** : Créer `frontend/src/components/figures/visualizers/SiteswapVisualizer.js`.
4.  **Logique Formulaire** : Modifier `FigureForm.js` pour gérer les métadonnées dynamiques.

---

## ❓ Questions & Points de Vigilance
1.  **Validation** : Faut-il valider la syntaxe siteswap côté frontend (Regex) ou laisser JugglingLab renvoyer une erreur ?
2.  **Stockage** : Préfère-t-on rester sur l'URL externe (rapide) ou télécharger le GIF via le backend pour assurer la pérennité (plus lent à implémenter) ?
3.  **Généralisation** : Cette approche `metadata` pourrait-elle servir à d'autres disciplines ? (ex: tempo BPM pour l'équilibre).
