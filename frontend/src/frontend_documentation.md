# Documentation du Frontend de l'Application Cirque

Ce document décrit l'architecture, les composants principaux, les pages et les flux de navigation pour les différents types d'utilisateurs de l'application.

---

## 1. Composants Réutilisables (`src/components/`)

### 1.1. Composants Communs (`common/`)
- **`FigureCard.js`**: Carte d'affichage pour une figure, utilisée dans les listes.
- **`ProgressBar.js`**: Barre de progression générique.
- **`StateBadge.js`**: Badge pour afficher un statut (ex: 'en cours', 'terminé').
- **`MemoryDecayIndicator.js`**: Indicateur visuel pour le déclin mémoriel d'une compétence.
- **`LateralityBadges.js`**: Badges pour indiquer la latéralité (gauche, droite, bilatéral).

### 1.2. Composants de Figure (`figures/`)
- **`EtapesProgressionList.js`**: Affiche la liste des étapes pour une figure donnée.
- **`JournalProgression.js`**: Affiche l'historique des tentatives pour une étape.

### 1.3. Composants d'Entraînement (`entrainement/`)
- **`SwipeableCard.js`**: Carte "swipable" (type Tinder) pour les sessions d'entraînement.
- **`SessionStats.js`**: Affiche les statistiques d'une session d'entraînement.
- **`SessionSummary.js`**: Résumé de fin de session.

### 1.4. Composants de Programme (`programmes/`)
- **`ProgrammeSelector.js`**: Sélecteur de programme pour l'assignation.
- **`ProgressionGlobale.js`**: Vue d'ensemble de la progression sur un programme.

---

## 2. Modals et Dialogs

- **`FigureDetailDialog.js` (`components/figures/`)**: Affiche les détails complets d'une figure dans une modale.
- **`AssignProgramModal.js` / `AssignerProgrammeDialog.js` (`components/prof/`)**: Modales permettant à un professeur d'assigner un programme à des élèves ou des groupes.
- **`CreateProgrammeDialog.js` (`components/prof/`)**: Modale pour la création d'un nouveau programme par un professeur.
- **`StudentProgressDialog.js` (`components/prof/`)**: Modale affichant les détails de la progression d'un élève.
- **`AddFiguresDialog.js` (`components/programmes/`)**: Modale pour ajouter des figures à un programme existant.
- **`ModifierProgrammeDialog.js` (`components/programmes/`)**: Modale pour modifier les détails d'un programme.

---

## 3. Pages (`src/pages/`)

### 3.1. Pages Communes (`common/`)
- **`AuthPage.js`**: Page de connexion et d'inscription.
- **`ListeDisciplinesPage.js`**: Affiche la liste de toutes les disciplines de cirque.
- **`FiguresPage.js`**: Affiche la liste de toutes les figures, avec des options de filtre.
- **`FigureDetailPage.js`**: Affiche les détails d'une figure spécifique et ses étapes.
- **`ProfilPage.js`**: Page de profil de l'utilisateur (visible par tous les rôles pour leur propre profil).

### 3.2. Pages Élève (`eleve/`)
- **`MonProgrammePage.js`**: Tableau de bord principal de l'élève, affichant ses progressions en cours.
- **`EntrainementPage.js`**: Page pour démarrer une session d'entraînement sur une figure.
- **`EntrainementSession.js`**: Interface de la session d'entraînement active.
- **`BadgesPage.js`**: Galerie des badges obtenus et à obtenir.
- **`TitresPage.js`**: Galerie des titres obtenus et à obtenir.
- **`ClassementsPage.js`**: Affiche les classements (général, hebdomadaire, par groupe).
- **`DefisPage.js`**: Affiche les défis quotidiens et hebdomadaires.

### 3.3. Pages Professeur (`prof/`)
- **`DashboardProfPage.js`**: Tableau de bord principal du professeur avec des statistiques sur ses élèves et groupes.
- **`MesElevesPage.js`**: Liste et gestion des élèves assignés au professeur.
- **`GroupesPage.js`**: Création et gestion des groupes d'élèves.
- **`ProgrammesPage.js`**: Création et gestion des programmes d'entraînement.
- **`ProgrammeDetailPage.js`**: Vue détaillée d'un programme spécifique.

### 3.4. Pages Admin (`admin/`)
- **`AdminPage.js`**: Tableau de bord de l'administration pour la gestion globale du contenu (figures, disciplines, etc.).

---

## 4. Flux Utilisateurs (Navigation Flow)

### 4.1. Flux de l'Élève (Architecture centrée sur les figures)

**Flow d'entraînement principal :**
1.  **Connexion** (`/auth`) -> Redirection vers **`MonProgrammePage.js`** (`/mon-programme`).
2.  Depuis **`MonProgrammePage.js`**, l'élève voit ses figures regroupées par discipline avec leur progression.
3.  **Clic sur une figure** -> Ouvre **`FigureDetailDialog`** (modal) qui affiche:
    - Détails de la figure (description, vidéo)
    - Onglet "Étapes de Progression" avec les étapes et leur statut
    - Onglet "Journal Progression" avec l'historique
    - Bouton **"S'entraîner"** -> Navigue vers `/entrainement/figure/:figureId`
4.  **`EntrainementPage.js`** (`/entrainement/figure/:figureId`):
    - Affiche les informations sur la figure
    - Bouton "Démarrer" -> Lance la session -> Navigue vers `/entrainement/session/:figureId`
5.  **`EntrainementSession.js`** (`/entrainement/session/:figureId`):
    - Session d'entraînement interactive avec cartes swipables
    - L'élève swipe droite (✓) ou gauche (✗) pour chaque étape
    - Enregistrement automatique des tentatives
    - Résumé de fin de session avec statistiques

**Flow de détails complets :**
- Depuis MonProgrammePage, **navigation directe possible** vers **`FigureDetailPage.js`** (`/figure/:figureId`) pour une vue complète avec:
  - Détails de la figure
  - Liste complète des étapes avec progression
  - Bouton "S'entraîner" pour lancer directement une session
  - Boutons pour valider manuellement les étapes

**Navigation alternative :**
- **`ListeDisciplinesPage.js`** (`/`) -> Explorer toutes les disciplines
- **`FiguresPage.js`** (`/discipline/:id`) -> Voir toutes les figures d'une discipline
- **`BadgesPage.js`** (`/badges`), **`TitresPage.js`** (`/titres`), **`ClassementsPage.js`** (`/classements`), **`DefisPage.js`** (`/defis`) -> Gamification
- **`ProfilPage.js`** (`/profil`) -> Profil utilisateur

### 4.2. Flux du Professeur
1.  **Connexion** (`/login`) -> Redirection vers **`DashboardProfPage.js`**.
2.  Le tableau de bord affiche des KPIs sur ses élèves.
3.  Depuis le menu principal, le professeur navigue vers:
    - **`MesElevesPage.js`** pour voir la liste de ses élèves. En cliquant sur un élève, il peut voir ses détails (probablement via `StudentProgressDialog.js`).
    - **`GroupesPage.js`** pour gérer ses classes.
    - **`ProgrammesPage.js`** pour créer ou modifier des programmes.
4.  Il a également accès aux pages communes comme **`FiguresPage.js`** et **`ListeDisciplinesPage.js`** pour explorer le contenu.

### 4.3. Flux de l'Admin
1.  **Connexion** (`/login`) -> Redirection vers **`AdminPage.js`**.
2.  La page d'administration est une interface centralisée pour gérer le contenu de l'application (disciplines, figures publiques, etc.).
3.  Il peut éditer une figure via le `FigureEditor.js`.
4.  L'admin a une vue globale et peut accéder à toutes les données, contournant les restrictions de locataire (`ecole_id`).
