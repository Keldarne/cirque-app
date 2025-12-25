import React from 'react';
import { Box, Typography, LinearProgress, CircularProgress } from '@mui/material';

/**
 * ProgressBar - Barre de progression universelle
 * Suit les specs de figma.md section 1.2
 *
 * @param {number} value - Pourcentage (0-100)
 * @param {string} label - Texte affiché
 * @param {boolean} showPercentage - Afficher le pourcentage
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {string} color - 'primary' | 'success' | 'warning' | 'error' | 'auto'
 * @param {string} variant - 'linear' | 'circular'
 */
function ProgressBar({
  value = 0,
  label = null,
  showPercentage = true,
  size = 'medium',
  color = 'auto',
  variant = 'linear'
}) {
  // Déterminer la couleur automatiquement basée sur la valeur
  const getColor = () => {
    if (color !== 'auto') return color;

    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'error';
  };

  const barColor = getColor();

  // Hauteurs selon la taille (linear)
  const heights = {
    small: 4,
    medium: 8,
    large: 12
  };

  // Diamètres selon la taille (circular)
  const diameters = {
    small: 40,
    medium: 60,
    large: 80
  };

  if (variant === 'circular') {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={value}
          size={diameters[size]}
          color={barColor}
        />
        {showPercentage && (
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
              fontWeight="bold"
            >
              {`${Math.round(value)}%`}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Variant linear
  return (
    <Box sx={{ width: '100%' }}>
      {(label || showPercentage) && (
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          {label && (
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          )}
          {showPercentage && (
            <Typography variant="caption" fontWeight="bold">
              {Math.round(value)}%
            </Typography>
          )}
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: heights[size],
          borderRadius: 4,
          bgcolor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            bgcolor: `${barColor}.main`
          }
        }}
      />
    </Box>
  );
}

export default ProgressBar;
