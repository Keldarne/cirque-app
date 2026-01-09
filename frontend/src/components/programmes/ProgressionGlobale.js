import React from 'react';
import { Paper, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper
      elevation={isMobile ? 1 : 3}
      sx={{
        p: isMobile ? 2 : 3,
        mb: isMobile ? 2 : 4,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        borderRadius: isMobile ? 2 : 3,
        ...sx
      }}
    >
      <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2} mb={isMobile ? 1 : 2}>
        <TrendingUpIcon sx={{ fontSize: isMobile ? 30 : 40 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
            🎯 {isMobile ? "Progression" : "Progression Globale"}
          </Typography>
          {variant === 'detailed' && !isMobile && (
            <Typography variant="body2">
              Moyenne sur {disciplinesCount} discipline{disciplinesCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: isMobile ? '1.75rem' : { xs: '2.5rem', md: '3.75rem' },
            lineHeight: 1
          }}
        >
          {Math.round(progressPercent)}%
        </Typography>
      </Box>

      <ProgressBar
        value={progressPercent}
        size={isMobile ? "medium" : "large"}
        color="success"
        showPercentage={false}
      />

      {variant === 'detailed' && (
        <Typography variant="caption" display="block" mt={1} sx={{ opacity: 0.9 }}>
          {figuresValidees} figure{figuresValidees > 1 ? 's' : ''} validée{figuresValidees > 1 ? 's' : ''} / {figuresTotal} total
          {isMobile && ` • ${disciplinesCount} disc.`}
        </Typography>
      )}
    </Paper>
  );
}

export default ProgressionGlobale;
