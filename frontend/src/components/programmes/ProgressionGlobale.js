import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import ProgressBar from '../common/ProgressBar';

/**
 * ProgressionGlobale - Vue globale de la progression
 * Suit les specs de figma.md section 2.2
 *
 * @param {number} progressPercent - Pourcentage global (0-100)
 * @param {number} figuresValidees - Nombre de figures validées
 * @param {number} figuresTotal - Nombre total de figures
 * @param {number} disciplinesCount - Nombre de disciplines actives
 * @param {string} variant - 'summary' | 'detailed'
 * @param {object} sx - Styles MUI supplémentaires
 */
function ProgressionGlobale({
  progressPercent = 0,
  figuresValidees = 0,
  figuresTotal = 0,
  disciplinesCount = 0,
  variant = 'summary',
  sx = {}
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 4,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        ...sx
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TrendingUpIcon sx={{ fontSize: 40 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" gutterBottom>
            🎯 Progression Globale
          </Typography>
          {variant === 'detailed' && (
            <Typography variant="body2">
              Moyenne de progression sur {disciplinesCount} discipline{disciplinesCount > 1 ? 's' : ''} active{disciplinesCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Typography variant="h2" sx={{ fontWeight: 'bold', fontSize: { xs: '2.5rem', md: '3.75rem' } }}>
          {Math.round(progressPercent)}%
        </Typography>
      </Box>

      <ProgressBar
        value={progressPercent}
        size="large"
        color="success"
        showPercentage={false}
      />

      {variant === 'detailed' && (
        <Typography variant="body2" mt={2}>
          {figuresValidees} figure{figuresValidees > 1 ? 's' : ''} validée{figuresValidees > 1 ? 's' : ''} / {figuresTotal} total
        </Typography>
      )}
    </Paper>
  );
}

export default ProgressionGlobale;
