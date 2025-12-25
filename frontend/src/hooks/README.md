# Hooks personnalisés

Ce dossier contient les hooks React personnalisés pour simplifier la gestion de l'état et de la logique métier.

## 📚 Hooks disponibles

### `useAdminData`

Hook pour gérer les données de la page admin (disciplines et figures).

#### Usage

```javascript
import { useAdminData } from '../hooks/useAdminData';

function AdminPage() {
  const {
    disciplines,      // Liste des disciplines
    figures,          // Liste des figures
    setDisciplines,   // Setter pour disciplines
    setFigures,       // Setter pour figures
    isLoading,        // État de chargement
    error,            // Erreur éventuelle
    reloadDisciplines,// Recharger les disciplines
    reloadFigures,    // Recharger les figures
    user              // Utilisateur courant
  } = useAdminData();

  // Les données sont chargées automatiquement
  // La redirection est gérée automatiquement si non authentifié
}
```

#### Fonctionnalités
- ✅ Chargement automatique des données au montage
- ✅ Redirection automatique si non authentifié
- ✅ Chargement en parallèle (disciplines + figures)
- ✅ Gestion de l'état de chargement
- ✅ Fonctions de rechargement

---

### `useFormData`

Hook générique pour gérer les formulaires.

#### Usage basique

```javascript
import { useFormData } from '../hooks/useFormData';

function MonFormulaire() {
  const {
    formData,           // Données du formulaire
    handleChange,       // Handler générique
    handleInputChange,  // Handler pour événements HTML
    resetForm,          // Réinitialiser le formulaire
    setFormData,        // Setter direct
    setMultipleFields   // Mettre à jour plusieurs champs
  } = useFormData({
    nom: '',
    email: '',
    age: 0
  });

  return (
    <>
      <input
        value={formData.nom}
        onChange={(e) => handleChange('nom', e.target.value)}
      />

      {/* Ou avec handleInputChange */}
      <input
        name="email"
        value={formData.email}
        onChange={handleInputChange}
      />

      <button onClick={resetForm}>Réinitialiser</button>
    </>
  );
}
```

#### Usage avancé

```javascript
// Mettre à jour plusieurs champs en une fois
setMultipleFields({
  nom: 'John',
  email: 'john@example.com'
});

// Réinitialiser puis définir de nouvelles valeurs
resetForm();
setFormData({ nom: 'Nouvelle valeur' });
```

---

### `useEtapes`

Hook pour gérer les étapes d'une figure.

#### Usage

```javascript
import { useEtapes } from '../hooks/useEtapes';

function FormulaireFigure() {
  const {
    etapes,           // Tableau des étapes
    ajouterEtape,     // Ajouter une étape vide
    supprimerEtape,   // Supprimer une étape par index
    modifierEtape,    // Modifier un champ d'une étape
    setEtapes,        // Setter direct
    resetEtapes       // Réinitialiser aux valeurs initiales
  } = useEtapes();

  return (
    <>
      {etapes.map((etape, index) => (
        <div key={index}>
          <input
            value={etape.titre}
            onChange={(e) => modifierEtape(index, 'titre', e.target.value)}
          />
          <input
            value={etape.description}
            onChange={(e) => modifierEtape(index, 'description', e.target.value)}
          />
          <button onClick={() => supprimerEtape(index)}>
            Supprimer
          </button>
        </div>
      ))}

      <button onClick={ajouterEtape}>
        Ajouter une étape
      </button>
    </>
  );
}
```

#### Personnalisation

```javascript
// Définir des valeurs initiales personnalisées
const { etapes, ajouterEtape } = useEtapes([
  { titre: 'Étape 1', description: 'Description 1', xp: 20, video_url: '' },
  { titre: 'Étape 2', description: 'Description 2', xp: 30, video_url: '' }
]);

// Charger des étapes depuis l'API
useEffect(() => {
  fetchEtapes(figureId).then(data => setEtapes(data));
}, [figureId]);
```

---

## 🎯 Bonnes pratiques

### 1. Nommage clair

```javascript
// ✅ Bon
const { formData: nouvelleFigure, handleChange: handleFigureChange } = useFormData(...);

// ❌ Éviter
const { formData, handleChange } = useFormData(...);
```

### 2. Réinitialisation après soumission

```javascript
const handleSubmit = async () => {
  const response = await fetch('/api/figures', {
    method: 'POST',
    body: JSON.stringify(formData)
  });

  if (response.ok) {
    resetForm();      // Réinitialiser le formulaire
    resetEtapes();    // Réinitialiser les étapes
  }
};
```

### 3. Validation

```javascript
const handleSubmit = () => {
  // Valider avant soumission
  if (!formData.nom.trim()) {
    setSnackbar({ message: 'Le nom est requis', severity: 'error' });
    return;
  }

  // Soumettre
  // ...
};
```

### 4. Composition de hooks

```javascript
function MonComposant() {
  const { disciplines } = useAdminData();
  const { formData, handleChange } = useFormData({ nom: '' });
  const { etapes, ajouterEtape } = useEtapes();

  // Utiliser les 3 hooks ensemble
}
```

---

## 📖 Exemples complets

### Formulaire de création de figure

```javascript
function FormulaireNouvelleFigure() {
  const { disciplines } = useAdminData();

  const {
    formData: figure,
    handleChange: handleFigureChange,
    resetForm: resetFigure
  } = useFormData({
    nom: '',
    descriptif: '',
    discipline_id: '',
    image_url: '',
    video_url: ''
  });

  const {
    etapes,
    ajouterEtape,
    supprimerEtape,
    modifierEtape,
    resetEtapes
  } = useEtapes();

  const handleSubmit = async () => {
    const response = await fetch('/admin/figures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...figure, etapes })
    });

    if (response.ok) {
      resetFigure();
      resetEtapes();
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {/* Formulaire de figure */}
      {/* Formulaire des étapes */}
      <button type="submit">Créer</button>
    </form>
  );
}
```

---

## 🔧 Extension

Pour créer votre propre hook :

```javascript
// hooks/useMonHook.js
import { useState } from 'react';

export const useMonHook = (initialValue) => {
  const [state, setState] = useState(initialValue);

  const helper = () => {
    // Logique métier
  };

  return {
    state,
    setState,
    helper
  };
};
```
