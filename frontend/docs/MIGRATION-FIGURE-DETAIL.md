# Migration FigureDetailPage vers CSS Grid

## 📋 Objectif

Remplacer le système Material-UI Grid actuel par un layout CSS Grid personnalisé pour un meilleur contrôle de la disposition.

## 🎯 Nouvelle Structure

### Layout Desktop
```
┌─────────────────────────────────────────┐
│  Container (12 colonnes)                │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │   Figure Card    │  │ Progression │ │
│  │   (9 colonnes)   │  │ (3 colonnes)│ │
│  │                  │  │   Sticky    │ │
│  └──────────────────┘  └─────────────┘ │
│  ┌──────────────────────────────────┐  │
│  │    Étapes (12 colonnes)          │  │
│  │    Pleine largeur                │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Layout Mobile
```
┌───────────────┐
│ Figure Card   │
│ (12 colonnes) │
└───────────────┘
┌───────────────┐
│ Progression   │
│ (12 colonnes) │
└───────────────┘
┌───────────────┐
│ Étapes        │
│ (12 colonnes) │
└───────────────┘
```

## 🔧 Modifications à Apporter

### Étape 1: Remplacer la structure Grid Material-UI

**AVANT:**
```jsx
<Container sx={{ mt: 4, mb: 4 }}>
  <Button ...>Retour</Button>

  <Grid container spacing={3}>
    <Grid item xs={12} md={9}>
      <Card>{/* Figure */}</Card>
    </Grid>

    <Grid item xs={12} md={3}>
      <Paper>{/* Progression */}</Paper>
    </Grid>

    <Grid item xs={12} md={9}>
      <Card>{/* Étapes */}</Card>
    </Grid>
  </Grid>
</Container>
```

**APRÈS:**
```jsx
<Container className="figure-detail-container">
  <Button className="figure-detail-back-button" ...>
    Retour à Mon Programme
  </Button>

  <div className="figure-detail-grid-wrapper">
    {/* Card Figure - 9 colonnes desktop */}
    <div className="figure-detail-main-content">
      <Card className="figure-detail-figure-card">
        {/* Contenu de la figure */}
      </Card>
    </div>

    {/* Panel Progression - 3 colonnes desktop, sticky */}
    <div className="figure-detail-progress-panel-wrapper">
      <Paper className="figure-detail-progress-panel">
        {/* Contenu progression */}
      </Paper>
    </div>

    {/* Étapes - 12 colonnes (pleine largeur) */}
    <div className="figure-detail-etapes-wrapper">
      {etapes.length > 0 && (
        <Card>
          <CardContent>
            {/* Contenu étapes */}
          </CardContent>
        </Card>
      )}
    </div>
  </div>
</Container>
```

### Étape 2: Supprimer les props sx Material-UI

Remplacer les props `sx` par des classes CSS:

| Avant (sx) | Après (className) |
|------------|-------------------|
| `sx={{ mt: 4, mb: 4 }}` | `className="figure-detail-container"` |
| `sx={{ mb: 2 }}` | `className="figure-detail-back-button"` |
| `sx={{ p: 3, position: 'sticky', top: 20 }}` | `className="figure-detail-progress-panel"` |
| `sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}` | `className="figure-detail-header"` |
| `sx={{ flexGrow: 1 }}` | `className="figure-detail-title"` |
| `sx={{ mt: 3 }}` | `className="figure-detail-video-section"` |

### Étape 3: Classes CSS pour les étapes

```jsx
{etapes.map((etape, index) => (
  <Paper
    key={etape.id}
    className="figure-detail-etape-card"
    sx={{
      bgcolor: estValidee ? 'success.light' : 'grey.50',
      borderColor: estValidee ? 'success.main' : 'primary.main',
      opacity: estValidee ? 0.8 : 1
    }}
  >
    <Box className="figure-detail-etape-header">
      <Chip label={`Étape ${index + 1}`} ... />
      <Typography variant="h6" className="figure-detail-etape-title">
        {etape.titre}
      </Typography>
      <Chip label={`${etape.xp} XP`} ... />
    </Box>

    <Typography className="figure-detail-etape-description">
      {etape.description}
    </Typography>

    {etape.video_url && (
      <div className="figure-detail-etape-video-container">
        <video className="figure-detail-etape-video" ... />
      </div>
    )}

    {!estValidee && (
      <Button className="figure-detail-validate-button" ...>
        Valider cette étape
      </Button>
    )}

    {estValidee && (
      <Box className="figure-detail-validated-message" ...>
        ✓ Étape validée - {etape.xp} XP gagnés
      </Box>
    )}
  </Paper>
))}
```

## ✅ Avantages du nouveau système

1. **Contrôle précis**: Layout CSS Grid plus flexible que Material-UI Grid
2. **Performance**: Moins de composants React, plus de CSS natif
3. **Maintenance**: Styles centralisés dans `components.css`
4. **Responsive**: Media queries contrôlées dans le CSS
5. **Consistance**: Variables CSS pour espacements et transitions

## 📱 Comportement Responsive

Le CSS Grid s'adapte automatiquement:
- **Mobile (< 900px)**: Tout en 12 colonnes (pleine largeur)
- **Desktop (≥ 900px)**:
  - Figure: 9 colonnes
  - Progression: 3 colonnes (sticky)
  - Étapes: 12 colonnes (pleine largeur)

## 🎨 Variables CSS Utilisées

```css
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--radius-sm: 4px
--radius-md: 8px
--transition-fast: 0.2s ease
```

## 🚀 Implémentation

1. Ouvrir `/Users/josephgremaud/cirque-app/frontend/src/pages/FigureDetailPage.js`
2. Remplacer la structure `<Grid container>` par `<div className="figure-detail-grid-wrapper">`
3. Remplacer chaque `<Grid item>` par les divs avec classes appropriées
4. Supprimer les imports `Grid` de Material-UI si plus utilisés
5. Tester en mode développement et responsive

## 🔍 Vérification

Après migration, vérifier:
- ✅ Layout desktop: Figure 9 cols, Progression 3 cols sticky, Étapes 12 cols
- ✅ Layout mobile: Tout en pleine largeur, ordre correct
- ✅ Sticky fonctionne sur le panel progression
- ✅ Espacements corrects entre sections
- ✅ Transitions smooth au resize
