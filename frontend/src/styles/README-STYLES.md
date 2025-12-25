# Guide des Styles CSS - Cirque App

## 📋 Vue d'ensemble

Tous les styles de l'application sont centralisés dans `/frontend/src/styles/components.css`. Ce fichier unique facilite la maintenance et assure la cohérence visuelle.

## 🎨 Structure du fichier CSS

Le fichier est organisé en 11 sections principales :

1. **Variables globales** - Espacements, couleurs, transitions
2. **Navigation Bar** - Barre de navigation
3. **Auth Page** - Connexion/Inscription
4. **Profil Page** - Page profil utilisateur
5. **Liste Disciplines** - Grille des disciplines
6. **Figures Page** - Liste des figures d'une discipline
7. **Mon Programme** - Programme d'entrainement
8. **Figure Detail** - Détails d'une figure + étapes
9. **Admin Page** - Interface d'administration
10. **Composants réutilisables** - Snackbar, loading, etc.
11. **Utilitaires** - Classes helpers

## 🔧 Utilisation

### Option 1: Utiliser les classes CSS (Recommandé pour les styles inline)

```jsx
// Au lieu de sx={{ padding: '20px' }}
<div className="figures-container">
  ...
</div>
```

### Option 2: Combiner sx et className

```jsx
// Pour des styles standards + spécifiques
<Card
  className="figures-card"
  sx={{
    backgroundColor: 'custom.color'  // Style spécifique
  }}
>
```

### Option 3: Variables CSS personnalisées

```jsx
// Utiliser les variables CSS dans sx
<Box sx={{
  padding: 'var(--spacing-lg)',
  borderRadius: 'var(--radius-md)',
  transition: 'var(--transition-normal)'
}}>
```

## 📝 Convention de nommage

Les classes CSS suivent ce pattern :
```
[composant]-[élément]-[modificateur]
```

Exemples :
- `profil-header` - Header de la page profil
- `profil-stat-card` - Carte de statistique
- `figures-card-badge` - Badge sur la carte figure
- `admin-etapes-container` - Conteneur des étapes (admin)

## 🎯 Variables disponibles

### Espacements
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px (défaut)
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px
- `--spacing-xxl`: 48px

### Border Radius
- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-full`: 9999px (cercle parfait)

### Transitions
- `--transition-fast`: 0.2s ease
- `--transition-normal`: 0.3s ease
- `--transition-slow`: 0.4s ease

## 📱 Responsive Design

Les breakpoints sont gérés directement dans le CSS avec `@media` queries:

```css
/* Mobile */
@media (max-width: 600px) {
  .programme-figure-card {
    width: 100%;
  }
}

/* Tablet */
@media (max-width: 900px) {
  .programme-figure-card {
    width: calc(50% - 12px);
  }
}
```

## ✅ Bonnes pratiques

### À FAIRE
✅ Utiliser les classes CSS pour les styles récurrents
✅ Utiliser les variables CSS pour la cohérence
✅ Commenter les sections complexes
✅ Respecter la convention de nommage

### À ÉVITER
❌ Dupliquer les styles dans plusieurs composants
❌ Utiliser des valeurs en dur (20px, #ff0000, etc.)
❌ Créer des classes trop spécifiques
❌ Mélanger styles inline et classes sans raison

## 🔄 Migration des styles existants

Pour migrer un composant utilisant `sx` vers le CSS :

**Avant:**
```jsx
<Box sx={{
  mt: 4,
  mb: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 2
}}>
```

**Après:**
```jsx
<Box className="profil-header">
  {/* Les styles sont dans components.css */}
</Box>
```

Avec dans `components.css`:
```css
.profil-header {
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
```

## 📚 Exemples par composant

### Navigation Bar
```jsx
<AppBar>
  <Toolbar>
    <Typography className="navbar-title">Cirque App</Typography>
    <Box className="navbar-links-container">
      ...
    </Box>
  </Toolbar>
</AppBar>
```

### Profil Page
```jsx
<Container className="profil-container">
  <Paper className="profil-header">
    <Box className="profil-header-content">
      <Box className="profil-header-user">
        <PersonIcon className="profil-icon" />
        ...
      </Box>
    </Box>
  </Paper>
</Container>
```

### Mon Programme
```jsx
<Container className="programme-container">
  <Paper className="programme-global-progress">
    <Box className="programme-global-header">
      ...
    </Box>
  </Paper>

  <Box className="programme-figures-grid">
    <Card className="programme-figure-card">
      ...
    </Card>
  </Box>
</Container>
```

### Figure Detail Page (Layout CSS Grid)
```jsx
<Container className="figure-detail-container">
  <Button className="figure-detail-back-button">Retour</Button>

  {/* Container invisible avec CSS Grid 12 colonnes */}
  <div className="figure-detail-grid-wrapper">

    {/* Card figure - 9 colonnes sur desktop */}
    <div className="figure-detail-main-content">
      <Card className="figure-detail-figure-card">
        <CardMedia className="figure-detail-image" />
        <CardContent>
          <Box className="figure-detail-header">
            <Typography className="figure-detail-title">...</Typography>
          </Box>
        </CardContent>
      </Card>
    </div>

    {/* Panel progression - 3 colonnes sur desktop, sticky */}
    <div className="figure-detail-progress-panel-wrapper">
      <Paper className="figure-detail-progress-panel">
        ...
      </Paper>
    </div>

    {/* Étapes - 12 colonnes (pleine largeur) */}
    <div className="figure-detail-etapes-wrapper">
      <Card>
        <CardContent>
          {etapes.map(etape => (
            <Paper className="figure-detail-etape-card">
              <Box className="figure-detail-etape-header">
                ...
              </Box>
            </Paper>
          ))}
        </CardContent>
      </Card>
    </div>

  </div>
</Container>
```

## 🚀 Ajout de nouveaux styles

1. **Identifier la section appropriée** (ou créer une nouvelle section)
2. **Nommer la classe** selon la convention
3. **Documenter avec un commentaire** si nécessaire
4. **Utiliser les variables CSS** pour les valeurs

Exemple:
```css
/* ═══════════════════════════════════════════════════════════════════
   12. NOUVELLE SECTION
   ═══════════════════════════════════════════════════════════════════ */

/* Description du composant */
.nouveau-composant-container {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.nouveau-composant-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
```

## 🔍 Maintenance

### Trouver un style
1. Ouvrir `/frontend/src/styles/components.css`
2. Chercher par nom de composant (ex: "profil", "figures")
3. Les sections sont clairement délimitées par des commentaires

### Modifier un style
1. Localiser la classe dans `components.css`
2. Modifier la valeur
3. Les changements s'appliquent automatiquement (hot reload)

### Supprimer un style
1. Vérifier qu'aucun composant n'utilise la classe (recherche globale)
2. Supprimer la classe du fichier CSS
3. Tester l'application

## 🎓 Ressources

- [Documentation Material-UI sx prop](https://mui.com/system/getting-started/the-sx-prop/)
- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [BEM Naming Convention](http://getbem.com/naming/)
