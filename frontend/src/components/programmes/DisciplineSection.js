import React from 'react';
import { Paper, Box, Typography, Button, Divider, Grid, Chip, useMediaQuery, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import FigureCard from '../common/FigureCard';
import ProgressBar from '../common/ProgressBar';

/**
 * DisciplineSection - Section regroupant figures par discipline
 * Suit les specs de figma.md section 2.1
 *
 * @param {string} disciplineNom - Nom de la discipline
 * @param {array} figures - Array de figures avec progressions
 * @param {object} progressions - Map figureId -> progression
 * @param {function} onFigureClick - Callback clic sur figure
 * @param {boolean} showActions - Afficher boutons d'action
 * @param {boolean} editMode - Mode édition activé
 * @param {function} onAddFigures - Callback ajouter figures
 * @param {function} onRemoveFigure - Callback retirer figure
 * @param {function} onReorder - Callback réordonner
 * @param {boolean} showProgress - Afficher progression de la discipline
 * @param {object} sx - Styles MUI supplémentaires
 */
function DisciplineSection({
  disciplineNom,
  figures = [],
  progressions = {},
  onFigureClick,
  showActions = false,
  editMode = false,
  onAddFigures,
  onRemoveFigure,
  onReorder,
  showProgress = true,
  sx = {}
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculer progression de la discipline
  const calculateDisciplineProgress = () => {
    if (figures.length === 0) return 0;

    const validatedCount = figures.filter(f => {
      // Check if all etapes are validated
      return f.etapes && f.etapes.every(e => e.statut === 'valide');
    }).length;

    return Math.round((validatedCount / figures.length) * 100);
  };

  const disciplineProgress = calculateDisciplineProgress();
  const validatedCount = figures.filter(f => {
    return f.etapes && f.etapes.every(e => e.statut === 'valide');
  }).length;

  return (
    <Paper elevation={isMobile ? 1 : 3} sx={{ p: isMobile ? 1.5 : 3, mb: 3, ...sx }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
            📚 {disciplineNom}
          </Typography>
          <Chip
            label={`${figures.length} fig.`}
            color="primary"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
          {showProgress && (
            <Chip
              label={`${disciplineProgress}%`}
              color={disciplineProgress === 100 ? 'success' : disciplineProgress >= 50 ? 'primary' : 'default'}
              size="small"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box>

        {/* Bouton Ajouter (si actions activées) */}
        {showActions && editMode && onAddFigures && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddFigures}
            variant="outlined"
          >
            {isMobile ? "Ajouter" : "Ajouter des figures"}
          </Button>
        )}
      </Box>

      {/* Barre de progression de la discipline */}
      {showProgress && (
        <Box mb={isMobile ? 2 : 3}>
          <ProgressBar
            value={disciplineProgress}
            label={isMobile ? `${validatedCount}/${figures.length}` : `${validatedCount}/${figures.length} validées`}
            size={isMobile ? "small" : "medium"}
          />
        </Box>
      )}

      <Divider sx={{ mb: isMobile ? 2 : 3 }} />

      {/* Grid de FigureCards */}
      {figures.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          Aucune figure dans cette discipline
        </Typography>
      ) : (
        <Grid container spacing={isMobile ? 1 : 2}>
          {figures.map((figureData, index) => {
            // Transform API data structure to match FigureCard expectations
            const figureId = figureData.figure_id || figureData.id;

            // Build figure object from API data
            const figure = {
              id: figureId,
              nom: figureData.figure_nom || figureData.nom,
              descriptif: figureData.figure_description || figureData.descriptif || figureData.description,
              nb_etapes: figureData.etapes ? figureData.etapes.length : 0,
              image_url: figureData.image_url,
              discipline: figureData.discipline
            };

            // Build progression object from etapes data
            const progression = figureData.etapes ? {
              EtapesUtilisateurs: figureData.etapes.map(etape => ({
                valide: etape.statut === 'valide',
                date_validation: etape.date_validation
              })),
              date_derniere_validation: figureData.etapes
                .filter(e => e.statut === 'valide' && e.date_validation)
                .sort((a, b) => new Date(b.date_validation) - new Date(a.date_validation))[0]?.date_validation,
              etat: figureData.etapes.every(e => e.statut === 'valide')
                ? 'valide'
                : figureData.etapes.some(e => e.statut === 'en_cours' || e.statut === 'valide')
                  ? 'en_cours'
                  : 'non_commence'
            } : null;

            // Actions de la carte
            const actions = [];

            if (editMode && showActions) {
              // Boutons réordonnancement
              if (index > 0 && onReorder) {
                actions.push({
                  label: '↑',
                  onClick: () => onReorder(figureId, 'up'),
                  variant: 'outlined',
                  color: 'primary'
                });
              }
              if (index < figures.length - 1 && onReorder) {
                actions.push({
                  label: '↓',
                  onClick: () => onReorder(figureId, 'down'),
                  variant: 'outlined',
                  color: 'primary'
                });
              }
              // Bouton retirer
              if (onRemoveFigure) {
                actions.push({
                  label: isMobile ? 'Suppr.' : '❌',
                  onClick: () => onRemoveFigure(figureId),
                  variant: 'text',
                  color: 'error'
                });
              }
            }

            return (
              <Grid item xs={12} sm="auto" md="auto" key={figureId}>
                <FigureCard
                  figure={figure}
                  progression={progression}
                  onClick={() => onFigureClick && onFigureClick(figureId, progression)}
                  showProgress={true}
                  showMemoryDecay={true}
                  showLaterality={true}
                  showXP={true}
                  actions={actions}
                  variant="compact"
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Paper>
  );
}

export default DisciplineSection;
