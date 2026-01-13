# Spécification Metadata JSON - Figure Model

**Date**: 2026-01-12
**Migration**: 003_add_figure_metadata_json.sql
**Objectif**: Supporter des données spécifiques par discipline sans modifier le schéma DB

---

## Vue d'ensemble

Le champ `metadata` (type JSON) du modèle `Figure` permet de stocker des informations spécifiques à chaque discipline de cirque sans créer de colonnes dédiées. Ce système flexible facilite l'évolution et l'ajout de nouvelles disciplines.

### Avantages
- ✅ **Évolutivité**: Ajouter des champs sans migration DB
- ✅ **Flexibilité**: Chaque discipline a ses propres besoins
- ✅ **Compatibilité**: Valeur `null` par défaut pour figures existantes
- ✅ **Performance**: MySQL 8.0 supporte JSON natif avec indexation

### Validation
- **Côté backend**: Validation optionnelle dans `FigureService`
- **Côté frontend**: Formulaires dynamiques selon discipline
- **Pas de contrainte DB**: JSON flexible, validation applicative

---

## Format par Discipline

### 1. JONGLAGE

```json
{
  "siteswap": "531",
  "num_objects": 3,
  "juggling_lab_compatible": true,
  "object_types": ["balls", "clubs", "rings"],
  "pattern_family": "cascade",
  "notes": "Siteswap asymétrique classique"
}
```

**Champs**:

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `siteswap` | `string` | Non | Notation siteswap (ex: "531", "97531") |
| `num_objects` | `integer` | Non | Nombre d'objets (3-9+) |
| `juggling_lab_compatible` | `boolean` | Non | Compatible avec JugglingLab pour animation |
| `object_types` | `string[]` | Non | Types d'objets: "balls", "clubs", "rings", "diabolo", "devil_sticks" |
| `pattern_family` | `string` | Non | Famille de pattern: "cascade", "fountain", "shower", "multiplex" |
| `notes` | `string` | Non | Notes complémentaires |

**Exemples**:
- **3 balles cascade**: `{ "siteswap": "3", "num_objects": 3, "object_types": ["balls"] }`
- **4 massues fontaine**: `{ "siteswap": "4", "num_objects": 4, "object_types": ["clubs"] }`
- **5 balles cascade**: `{ "siteswap": "5", "num_objects": 5, "pattern_family": "cascade" }`
- **Shower 3 balles**: `{ "siteswap": "51", "num_objects": 3, "pattern_family": "shower" }`

---

### 2. AÉRIEN

```json
{
  "apparatus": "tissu",
  "height_meters": 6,
  "rotations": 2,
  "drop_height": 3,
  "wraps_count": 1,
  "difficulty_technical": 4,
  "safety_mat_required": true
}
```

**Champs**:

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `apparatus` | `string` | Recommandé | Agrès: "tissu", "cerceau", "trapèze", "corde_lisse", "sangles" |
| `height_meters` | `number` | Non | Hauteur d'accroche en mètres (3-12m) |
| `rotations` | `integer` | Non | Nombre de rotations (0-3+) |
| `drop_height` | `number` | Non | Hauteur de chute en mètres (0-6m) |
| `wraps_count` | `integer` | Non | Nombre d'enroulés dans la figure |
| `difficulty_technical` | `integer` | Non | Difficulté technique spécifique (1-5) |
| `safety_mat_required` | `boolean` | Non | Tapis de sécurité obligatoire |

**Exemples**:
- **Basique tissu**: `{ "apparatus": "tissu", "height_meters": 4 }`
- **Chute arrière cerceau**: `{ "apparatus": "cerceau", "drop_height": 2, "safety_mat_required": true }`
- **Salto tissu**: `{ "apparatus": "tissu", "rotations": 1, "drop_height": 3 }`

---

### 3. ÉQUILIBRE

```json
{
  "tempo_seconds": 30,
  "support_points": 2,
  "apparatus": "boule",
  "static_hold": true,
  "surface_type": "unstable"
}
```

**Champs**:

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `tempo_seconds` | `integer` | Non | Durée de maintien requise (5-120s) |
| `support_points` | `integer` | Non | Nombre de points d'appui (1-4) |
| `apparatus` | `string` | Non | Agrès: "boule", "rola_bola", "monocycle", "fil", "slackline", "pedal_go" |
| `static_hold` | `boolean` | Non | Maintien statique (vs. dynamique) |
| `surface_type` | `string` | Non | Type de surface: "stable", "unstable", "moving" |

**Exemples**:
- **Équilibre mains**: `{ "tempo_seconds": 10, "support_points": 2, "static_hold": true }`
- **Boule**: `{ "apparatus": "boule", "surface_type": "unstable" }`
- **Monocycle**: `{ "apparatus": "monocycle", "static_hold": false }`

---

### 4. ACROBATIE

```json
{
  "flight_phase": true,
  "rotation_type": "salto_avant",
  "rotation_degrees": 360,
  "twists": 0,
  "landing_type": "feet",
  "requires_spotter": true
}
```

**Champs**:

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `flight_phase` | `boolean` | Non | Phase aérienne présente |
| `rotation_type` | `string` | Non | Type: "salto_avant", "salto_arriere", "salto_lateral", "flip" |
| `rotation_degrees` | `integer` | Non | Degrés de rotation (180, 360, 720, etc.) |
| `twists` | `integer` | Non | Nombre de vrilles (0-3) |
| `landing_type` | `string` | Non | Type d'atterrissage: "feet", "hands", "back", "stomach" |
| `requires_spotter` | `boolean` | Non | Pareur obligatoire |

**Exemples**:
- **ATR**: `{ "flight_phase": false, "landing_type": "hands" }`
- **Salto avant**: `{ "flight_phase": true, "rotation_type": "salto_avant", "rotation_degrees": 360 }`
- **Salto arrière vrillé**: `{ "rotation_type": "salto_arriere", "rotation_degrees": 360, "twists": 1 }`

---

### 5. ROUE CYR

```json
{
  "entry_type": "coin",
  "exit_type": "simple",
  "rotations_count": 3,
  "direction": "forward",
  "complexity_level": 2
}
```

**Champs**:

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `entry_type` | `string` | Non | Entrée: "coin", "simple", "spiral", "saut" |
| `exit_type` | `string` | Non | Sortie: "coin", "simple", "spiral", "saut" |
| `rotations_count` | `integer` | Non | Nombre de rotations (1-10+) |
| `direction` | `string` | Non | Direction: "forward", "backward", "lateral" |
| `complexity_level` | `integer` | Non | Complexité spécifique (1-5) |

---

### 6. AUTRE (discipline générique)

```json
{
  "custom_field_1": "valeur",
  "notes": "Notes spécifiques à cette figure"
}
```

Pour les disciplines non standardisées ou nouvelles, le champ metadata reste flexible et accepte tout objet JSON valide.

---

## Utilisation dans le Code

### Backend - Création Figure avec Metadata

```javascript
// routes/admin.js - POST /admin/figures
const figureData = {
  nom: "Cascade 5 balles",
  discipline_id: 1, // Jonglage
  descriptif: "Pattern cascade à 5 balles",
  metadata: {
    siteswap: "5",
    num_objects: 5,
    object_types: ["balls"],
    pattern_family: "cascade",
    juggling_lab_compatible: true
  }
};

const figure = await FigureService.createFigureWithEtapes(figureData, etapes);
```

### Backend - Requête avec Filtrage Metadata

```javascript
// Exemple: Trouver toutes les figures de jonglage à 5 objets
const figures = await Figure.findAll({
  where: sequelize.literal("JSON_EXTRACT(metadata, '$.num_objects') = 5")
});

// Exemple: Figures aériennes nécessitant tapis de sécurité
const figures = await Figure.findAll({
  where: sequelize.literal("JSON_EXTRACT(metadata, '$.safety_mat_required') = true")
});
```

### Frontend - Formulaire Dynamique

```javascript
// Afficher champs spécifiques selon discipline sélectionnée
if (disciplineId === JONGLAGE_ID) {
  return (
    <>
      <TextField label="Siteswap" name="metadata.siteswap" />
      <TextField label="Nombre d'objets" name="metadata.num_objects" type="number" />
      <Select label="Type d'objets" name="metadata.object_types" multiple>
        <MenuItem value="balls">Balles</MenuItem>
        <MenuItem value="clubs">Massues</MenuItem>
        <MenuItem value="rings">Anneaux</MenuItem>
      </Select>
    </>
  );
}

if (disciplineId === AERIEN_ID) {
  return (
    <>
      <Select label="Agrès" name="metadata.apparatus">
        <MenuItem value="tissu">Tissu</MenuItem>
        <MenuItem value="cerceau">Cerceau</MenuItem>
        <MenuItem value="trapeze">Trapèze</MenuItem>
      </Select>
      <TextField label="Hauteur (m)" name="metadata.height_meters" type="number" />
      <TextField label="Rotations" name="metadata.rotations" type="number" />
    </>
  );
}
```

---

## Validation Backend (Optionnel)

Pour ajouter une validation stricte du metadata selon la discipline:

```javascript
// services/FigureService.js
const METADATA_SCHEMAS = {
  1: { // Jonglage
    type: 'object',
    properties: {
      siteswap: { type: 'string', pattern: '^[0-9]+$' },
      num_objects: { type: 'integer', minimum: 1, maximum: 20 },
      object_types: { type: 'array', items: { enum: ['balls', 'clubs', 'rings'] } }
    }
  },
  2: { // Aérien
    type: 'object',
    properties: {
      apparatus: { enum: ['tissu', 'cerceau', 'trapeze', 'corde_lisse'] },
      height_meters: { type: 'number', minimum: 2, maximum: 15 },
      rotations: { type: 'integer', minimum: 0, maximum: 5 }
    }
  }
};

function validateMetadata(disciplineId, metadata) {
  const schema = METADATA_SCHEMAS[disciplineId];
  if (!schema) return true; // Pas de validation pour disciplines sans schéma

  // Utiliser bibliothèque comme Ajv pour validation JSON Schema
  const ajv = new Ajv();
  const validate = ajv.compile(schema);

  if (!validate(metadata)) {
    throw new Error(`Metadata invalide: ${JSON.stringify(validate.errors)}`);
  }

  return true;
}
```

---

## Migration des Figures Existantes

Les figures existantes auront `metadata: null`. Aucune action requise.

Si besoin de peupler metadata pour figures existantes (optionnel):

```sql
-- Exemple: Ajouter metadata par défaut aux figures de jonglage
UPDATE Figures
SET metadata = JSON_OBJECT('num_objects', 3)
WHERE discipline_id = 1 AND metadata IS NULL;
```

---

## Performance et Indexation

### Requêtes Simples
MySQL 8.0 peut requêter JSON sans index (acceptable pour < 10k figures):

```sql
SELECT * FROM Figures WHERE JSON_EXTRACT(metadata, '$.siteswap') = '531';
```

### Index JSON (si nécessaire)
Pour optimiser les requêtes fréquentes sur un champ metadata:

```sql
-- Index sur siteswap pour jonglage
ALTER TABLE Figures ADD INDEX idx_metadata_siteswap (
  (CAST(metadata->>'$.siteswap' AS CHAR(10)))
);

-- Index sur apparatus pour aérien
ALTER TABLE Figures ADD INDEX idx_metadata_apparatus (
  (CAST(metadata->>'$.apparatus' AS CHAR(20)))
);
```

---

## Évolution Future

### Ajout Nouvelles Disciplines

Pour ajouter une nouvelle discipline (ex: Magie):

1. **Définir le schéma metadata** dans cette doc
2. **Créer formulaire frontend** pour saisie
3. **Optionnel**: Ajouter validation backend

Exemple Magie:
```json
{
  "effect_type": "disappearance",
  "props_required": ["coin", "handkerchief"],
  "sleight_of_hand": true,
  "difficulty_dexterity": 3
}
```

### Rétrocompatibilité

- ✅ Figures sans metadata continuent de fonctionner
- ✅ Ancien code ignore metadata si null
- ✅ Nouveau code vérifie existence avant lecture

---

## Exemples Complets

### Jonglage - 3 Balles Cascade
```json
{
  "nom": "Cascade 3 balles",
  "discipline_id": 1,
  "metadata": {
    "siteswap": "3",
    "num_objects": 3,
    "object_types": ["balls"],
    "pattern_family": "cascade",
    "juggling_lab_compatible": true
  }
}
```

### Aérien - Chute Arrière Tissu
```json
{
  "nom": "Chute arrière tissu",
  "discipline_id": 2,
  "metadata": {
    "apparatus": "tissu",
    "height_meters": 5,
    "drop_height": 3,
    "safety_mat_required": true,
    "wraps_count": 2
  }
}
```

### Équilibre - Boule 30 secondes
```json
{
  "nom": "Équilibre boule 30s",
  "discipline_id": 3,
  "metadata": {
    "apparatus": "boule",
    "tempo_seconds": 30,
    "surface_type": "unstable",
    "static_hold": true
  }
}
```

---

## Ressources

- **MySQL JSON Functions**: https://dev.mysql.com/doc/refman/8.0/en/json-functions.html
- **Sequelize DataTypes.JSON**: https://sequelize.org/docs/v6/core-concepts/model-basics/#json
- **Ajv (JSON Schema Validator)**: https://ajv.js.org/

---

**Note**: Cette spécification est évolutive. Les champs metadata sont **tous optionnels** pour garantir la flexibilité maximale.
