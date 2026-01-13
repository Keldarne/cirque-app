# 📥 Spécification d'Import des Figures (Excel)

**Source :** `docs/First 100 skills per disciplines.xlsx`
**Objectif :** Peupler la table `Figures` et `Disciplines` en structurant les données spécifiques dans la colonne `metadata` (JSONB).

## 1. Logique Globale
Pour chaque feuille (Onglet) du fichier Excel :
1.  Créer la **Discipline** si elle n'existe pas (Nom de l'onglet).
2.  Parcourir les lignes pour créer les **Figures**.

## 2. Mapping des Colonnes (Excel -> DB)

| Colonne Excel (Supposée) | Champ DB `Figure` | Traitement |
| :--- | :--- | :--- |
| **Name** / Nom | `nom` | Direct |
| **Description** | `descriptif` | Direct |
| **Difficulty** / Niveau | `difficulty_level` | Convertir en 1-5 (ou 1-10) |
| **Video** | `video_url` | Direct |
| **Image** | `image_url` | Direct |

## 3. Logique des Métadonnées (`metadata` JSONB)

Les colonnes supplémentaires spécifiques à chaque onglet doivent être regroupées dans l'objet `metadata`.

### 🤹‍♂️ Onglet : Jonglerie (Juggling)
*   Colonne **Siteswap** -> `metadata.siteswap` (String)
*   Colonne **Objects** -> `metadata.nb_objets` (Number)
*   Colonne **Type** -> `metadata.type_objets` (String: Balles, Massues...)

### 🎪 Onglet : Aérien (Aerial)
*   Colonne **Apparatus** -> `metadata.agres` (Tissu, Cerceau, Trapèze)
*   Colonne **Min Height** -> `metadata.hauteur_min` (Number)
*   Colonne **Anchor** -> `metadata.accroche` (1 point, 2 points)

### 🚲 Onglet : Équilibre (Balance)
*   Colonne **Apparatus** -> `metadata.support` (Fil, Boule, Monocycle)
*   Colonne **Height** -> `metadata.hauteur` (Number)

### 🤸 Onglet : Acrobatie (Acrobatics)
*   Colonne **Type** -> `metadata.sub_type` (Sol, Trampoline, Portés)
*   Colonne **Players** -> `metadata.nb_personnes` (Number)

## 4. Instructions pour le Script de Seed
1.  Utiliser une librairie comme `xlsx` pour lire le fichier.
2.  Utiliser `Figure.findOrCreate` pour éviter les doublons.
3.  Générer un slug ou un code unique si besoin.
4.  **Important :** Assigner `visibilite = 'public'` et `ecole_id = NULL` pour ces figures de base (Catalogue Global).
