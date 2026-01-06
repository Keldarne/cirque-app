import React from 'react';
import { Chip, Typography } from '@mui/material';
import { CheckCircle as CheckIcon, HourglassEmpty as HourglassIcon, Circle as CircleIcon } from '@mui/icons-material';

/**
 * StateBadge - Badge d'état d'une figure
 * Suit les specs de figma.md section 1.4
 *
 * @param {string} etat - 'valide' | 'en_cours' | 'non_commence'
 * @param {string} variant - 'chip' | 'text'
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {object} sx - Styles MUI supplémentaires
 */
function StateBadge({
  etat = 'non_commence',
  variant = 'chip',
  size = 'small',
  sx = {}
}) {
  // Configuration des états
  const stateConfig = {
    valide: {
      label: 'Validée',
      color: 'success',
      icon: <CheckIcon fontSize={size} />
    },
    en_cours: {
      label: 'En cours',
      color: 'secondary',
      icon: <HourglassIcon fontSize={size} />
    },
    non_commence: {
      label: 'Non commencée',
      color: 'default',
      icon: <CircleIcon fontSize={size} />
    }
  };

  const config = stateConfig[etat] || stateConfig.non_commence;

  // Variant text
  if (variant === 'text') {
    return (
      <Typography
        variant={size === 'small' ? 'caption' : 'body2'}
        color={`${config.color}.main`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          ...sx
        }}
      >
        {config.icon}
        {config.label}
      </Typography>
    );
  }

  // Variant chip (défaut)
  return (
    <Chip
      label={config.label}
      icon={config.icon}
      color={config.color}
      size={size}
      sx={sx}
    />
  );
}

export default StateBadge;
