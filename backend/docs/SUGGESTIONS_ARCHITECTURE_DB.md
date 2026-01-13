# Propositions d'Optimisation de l'Architecture de la Base de Données

Ce document contient des suggestions d'amélioration de la structure de la base de données (PostgreSQL/Sequelize) pour simplifier la codebase backend et améliorer les performances.

## 1. Unification de la gestion des Programmes
**Observation :** Dispersion entre `ProgrammeProf`, `ProgrammePartage`, `AssignationProgramme` (élève) et `AssignationGroupeProgramme` (groupe).
**Suggestion :** 
- **Assignations Polymorphiques :** Créer une table unique d'assignation (ex: `ProgrammeAssignations`) avec des champs `assignee_id` et `assignee_type` ('USER' vs 'GROUP'). Cela évite de multiplier les requêtes et les jointures pour savoir quels programmes un élève peut voir.
- **Simplification des Modèles :** Fusionner les types de programmes si leurs structures sont identiques, en utilisant un champ `type` pour les distinguer.

## 2. Rationalisation des Relations Enseignement
**Observation :** Superposition de `Groupe`, `GroupeEleve`, `RelationProfEleve` et `InteractionProfEleve`.
**Suggestion :** 
- **Chemin Unique :** Éviter les doubles chemins (direct vs via groupe). Si un élève est dans un groupe géré par un prof, la `RelationProfEleve` explicite est souvent redondante.
- Privilégier la gestion par Groupes pour simplifier les contrôles d'accès et les requêtes de filtrage.

## 3. Clarification du Modèle de Dépendances (Figures)
**Observation :** Le nommage `ExerciceFigure` est ambigu par rapport à `Figure`.
**Suggestion :** 
- **Renommage Sémantique :** Renommer `ExerciceFigure` en `FigurePrerequis` ou `FigureDependencies`.
- Cela clarifie immédiatement le rôle de la table (définir les figures nécessaires pour en débloquer une autre) et rend les `include` Sequelize plus lisibles.

## 4. Optimisation et Dénormalisation de la Progression
**Observation :** L'état d'avancement sur une figure est actuellement calculé à la volée via les étapes (`ProgressionEtape`).
**Suggestion :** 
- **Table de Synthèse :** Introduire une table `ProgressionFigure` (Utilisateur + Figure + Statut global).
- **Mise à jour par Hooks :** Utiliser les Hooks Sequelize (`afterUpdate` sur les étapes) pour mettre à jour automatiquement le statut de la figure.
- **Bénéfice :** Permet d'afficher les tableaux de bord et les statistiques sans effectuer de calculs complexes ou de jointures massives à chaque requête.

## 5. Flexibilité et Polymorphisme des Figures
**Observation :** Les besoins en données spécifiques varient selon les disciplines (ex: Siteswap pour le jonglage, hauteur pour l'aérien, tempo pour l'équilibre). Multiplier les tables pour chaque spécialité alourdirait l'architecture.
**Suggestion :**
- **Colonne Metadata (JSONB) :** Ajouter un champ `metadata` de type JSONB à la table `Figures`.
- **Usage JugglingLab :** Pour le jonglage, stocker `{"siteswap": "531", "num_objects": 3}`. Le frontend pourra alors générer automatiquement des animations via l'API de JugglingLab.
- **Évolutivité :** Permet d'ajouter des spécificités métier (vidéos de référence, paramètres techniques) sans modifier le schéma de la base à chaque nouvelle discipline.

---
