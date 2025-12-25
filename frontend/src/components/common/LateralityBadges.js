import React from 'react';
import { Box, Chip } from '@mui/material';

/**
 * LateralityBadges - Badges de latéralité gauche/droite
 * Suit les specs de figma.md section 1.5
 *
 * @param {boolean} gauche - Côté gauche validé
 * @param {boolean} droite - Côté droit validé
 * @param {string} size - 'small' | 'medium'
 * @param {object} sx - Styles MUI supplémentaires
 */
function LateralityBadges({
  gauche = false,
  droite = false,
  size = 'small',
  sx = {}
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, ...sx }}>
      <Chip
        label="👈 G"
        size={size}
        color={gauche ? 'success' : 'default'}
        variant={gauche ? 'filled' : 'outlined'}
      />
      <Chip
        label="👉 D"
        size={size}
        color={droite ? 'success' : 'default'}
        variant={droite ? 'filled' : 'outlined'}
      />
    </Box>
  );
}

export default LateralityBadges;
