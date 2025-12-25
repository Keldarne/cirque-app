import React from 'react';
import { Chip, Box } from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { calculateDecayLevel } from '../../utils/memoryDecay';

/**
 * MemoryDecayIndicator - Indicateur de dégradation mémoire
 * Suit les specs de figma.md section 1.3
 *
 * @param {Date|string} dateValidation - Date de dernière validation
 * @param {string} variant - 'chip' | 'badge' | 'border'
 * @param {string} position - 'absolute' | 'relative'
 * @param {object} sx - Styles MUI supplémentaires
 */
function MemoryDecayIndicator({
  dateValidation,
  variant = 'chip',
  position = 'relative',
  sx = {}
}) {
  if (!dateValidation) return null;

  const decayInfo = calculateDecayLevel(dateValidation);

  // Ne rien afficher si not_validated ou fresh sans message
  if (decayInfo.level === 'not_validated' || !decayInfo.message) {
    return null;
  }

  // Variant chip (défaut)
  if (variant === 'chip') {
    return (
      <Chip
        label={decayInfo.message}
        icon={<AccessTimeIcon />}
        color={decayInfo.color}
        size="small"
        sx={{
          position: position === 'absolute' ? 'absolute' : 'relative',
          ...(position === 'absolute' && {
            top: 8,
            right: 8,
            zIndex: 1
          }),
          ...sx
        }}
      />
    );
  }

  // Variant badge (pastille simple)
  if (variant === 'badge') {
    return (
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: `${decayInfo.color}.main`,
          position: position === 'absolute' ? 'absolute' : 'relative',
          ...(position === 'absolute' && {
            top: 8,
            right: 8,
            zIndex: 1
          }),
          ...sx
        }}
      />
    );
  }

  // Variant border (retourne uniquement les styles de bordure)
  // Ce variant est géré par le parent
  return null;
}

/**
 * Fonction utilitaire pour obtenir les styles de bordure basés sur le decay
 * Utilisé pour variant='border'
 */
export function getDecayBorderStyles(dateValidation, theme) {
  if (!dateValidation) return {};

  const decayInfo = calculateDecayLevel(dateValidation);

  if (decayInfo.level === 'not_validated') return {};

  const colorPalette = theme.palette[decayInfo.color] || theme.palette.grey;

  return {
    border: `2px ${decayInfo.borderStyle} ${colorPalette.main}`,
    bgcolor:
      decayInfo.level === 'fresh'
        ? 'rgba(76, 175, 80, 0.05)'
        : decayInfo.level === 'warning'
        ? 'rgba(255, 152, 0, 0.05)'
        : decayInfo.level === 'critical'
        ? 'rgba(244, 67, 54, 0.05)'
        : 'transparent',
    opacity: decayInfo.opacity,
    transition: 'all 0.3s ease'
  };
}

export default MemoryDecayIndicator;
