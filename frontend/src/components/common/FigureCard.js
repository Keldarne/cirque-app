import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ProgressBar from './ProgressBar';
import MemoryDecayIndicator, { getDecayBorderStyles } from './MemoryDecayIndicator';
import StateBadge from './StateBadge';
import LateralityBadges from './LateralityBadges';
import { calculateDecayLevel } from '../../utils/memoryDecay';

/**
 * FigureCard - Carte figure universelle
 * Suit les specs de figma.md section 1.1
 *
 * @param {object} figure - Données de la figure
 * @param {object} progression - Données de progression (optionnel)
 * @param {function} onClick - Action au clic
 * @param {boolean} showProgress - Afficher barre de progression
 * @param {boolean} showMemoryDecay - Afficher indicateurs de decay
 * @param {boolean} showLaterality - Afficher badges latéralité
 * @param {boolean} showXP - Afficher XP gagné
 * @param {array} actions - Boutons d'action custom [{label, icon, onClick, color}]
 * @param {string} variant - 'compact' | 'detailed' | 'minimal'
 * @param {object} sx - Styles MUI supplémentaires
 */
function FigureCard({
  figure,
  progression = null,
  onClick = null,
  showProgress = true,
  showMemoryDecay = true,
  showLaterality = true,
  showXP = true,
  actions = [],
  variant = 'compact',
  sx = {}
}) {
  const theme = useTheme();

  if (!figure) return null;

  // Calculer progression
  const validatedSteps = progression?.EtapesUtilisateurs?.filter(e => e.valide).length || 0;
  const totalSteps = figure.nb_etapes || 1;
  const progressPercent = Math.round((validatedSteps / totalSteps) * 100);

  // Memory decay
  const decayInfo = progression?.date_derniere_validation
    ? calculateDecayLevel(progression.date_derniere_validation)
    : null;

  const decayStyles = decayInfo ? getDecayBorderStyles(progression.date_derniere_validation, theme) : {};

  // Dimensions selon variant
  const dimensions = {
    minimal: { width: 150, height: 200 },
    compact: { width: 200, height: 300 },
    detailed: { width: 300, height: 400 }
  };

  const { width, height } = dimensions[variant] || dimensions.compact;

  return (
    <Card
      onClick={onClick}
      sx={{
        width: width,
        height: height,
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 6
        } : {},
        ...decayStyles,
        ...sx
      }}
    >
      {/* Memory Decay Indicator */}
      {showMemoryDecay && progression?.date_derniere_validation && (
        <MemoryDecayIndicator
          dateValidation={progression.date_derniere_validation}
          variant="chip"
          position="absolute"
        />
      )}

      {/* Image */}
      {figure.image_url && (
        <CardMedia
          component="img"
          height="200"
          image={figure.image_url}
          alt={figure.nom}
          sx={{ objectFit: 'cover' }}
        />
      )}

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {/* Titre et Badge d'état */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: variant === 'minimal' ? '0.9rem' : '1.25rem' }}>
            {figure.nom}
          </Typography>
          {progression && (
            <StateBadge
              etat={progression.etat}
              size="small"
            />
          )}
        </Box>

        {/* Description */}
        {variant !== 'minimal' && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: variant === 'compact' ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {figure.descriptif}
          </Typography>
        )}

        {/* Barre de progression */}
        {showProgress && progression && (
          <Box mb={1}>
            <ProgressBar
              value={progressPercent}
              size="small"
              showPercentage={true}
            />
          </Box>
        )}

        {/* Badges latéralité */}
        {showLaterality && figure.lateralite_requise === 'bilateral' && progression && (
          <LateralityBadges
            gauche={progression.lateralite_gauche}
            droite={progression.lateralite_droite}
            sx={{ mb: 1 }}
          />
        )}

        {/* Spacer pour pousser XP et actions en bas */}
        <Box sx={{ flexGrow: 1 }} />

        {/* XP et Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          {showXP && progression?.etat === 'valide' && progression?.xp_gagne ? (
            <Typography variant="caption" color="success.main" fontWeight="bold">
              +{progression.xp_gagne} XP
            </Typography>
          ) : (
            <Box />
          )}

          {/* Actions custom */}
          {actions.length > 0 && (
            <Box display="flex" gap={0.5}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="small"
                  variant={action.variant || 'text'}
                  color={action.color || 'primary'}
                  startIcon={action.icon}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default FigureCard;
