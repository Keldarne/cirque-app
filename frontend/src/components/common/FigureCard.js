import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Button, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ProgressBar from './ProgressBar';
import MemoryDecayIndicator, { getDecayBorderStyles } from './MemoryDecayIndicator';
import StateBadge from './StateBadge';
import LateralityBadges from './LateralityBadges';
import { calculateDecayLevel } from '../../utils/memoryDecay';
import SiteswapVisualizer from '../figures/metadata/SiteswapVisualizer';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  // Dimensions selon variant (réduites d'un tiers)
  const dimensions = {
    minimal: { width: 150, height: 135 },
    compact: { width: 200, height: 200 },
    detailed: { width: 300, height: 270 }
  };

  let { width, height } = dimensions[variant] || dimensions.compact;

  // Ajustements responsifs
  width = '100%'; // Toujours 100% pour remplir la cellule de la Grid
  
  if (isMobile) {
    height = 'auto';
  } else {
    height = 'auto';
  }

  // --- LOGIQUE MEDIA ---
  // Si pas d'image, on vérifie si on peut générer un GIF Siteswap
  const hasSiteswap = figure.metadata?.siteswap && variant !== 'minimal';
  
  // Hauteur de l'image/visuel
  const mediaHeight = isMobile ? 'auto' : (variant === 'compact' ? 100 : 135);
  
  return (
    <Card
      onClick={onClick}
      sx={{
        width: width,
        height: height,
        minHeight: isMobile ? 80 : (dimensions[variant]?.height || 170), // Hauteur min réduite d'un tiers
        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column', // Layout horizontal sur mobile
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': onClick ? {
          transform: isMobile ? 'none' : 'translateY(-4px)',
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
          size={isMobile ? "small" : "medium"}
          sx={isMobile ? { top: 4, left: 4 } : {}}
        />
      )}

      {/* Image, GIF caché, ou Visualisation Siteswap dynamique */}
      {figure.gif_url ? (
        // Priorité 1: GIF caché JugglingLab (généré côté serveur)
        <CardMedia
          component="img"
          image={figure.gif_url}
          alt={`${figure.nom} - Siteswap ${figure.metadata?.siteswap}`}
          sx={{
            objectFit: 'contain',
            width: isMobile ? '100px' : '100%',
            alignSelf: 'stretch',
            height: mediaHeight,
            bgcolor: '#f5f5f5'
          }}
        />
      ) : figure.image_url ? (
        // Priorité 2: Image custom uploadée
        <CardMedia
          component="img"
          image={figure.image_url}
          alt={figure.nom}
          sx={{
            objectFit: 'cover',
            width: isMobile ? '100px' : '100%',
            alignSelf: 'stretch',
            height: mediaHeight
          }}
        />
      ) : hasSiteswap ? (
        // Priorité 3: Génération dynamique (fallback)
        <Box sx={{
          width: isMobile ? '100px' : '100%',
          height: mediaHeight,
          bgcolor: '#f5f5f5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          <SiteswapVisualizer
             siteswap={figure.metadata.siteswap}
             height={typeof mediaHeight === 'number' ? mediaHeight : 100}
             options={{ redirect: 'true' }}
          />
        </Box>
      ) : null}

      {/* Content */}
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: isMobile ? 1.5 : 2,
        justifyContent: isMobile ? 'center' : 'flex-start'
      }}>
        {/* Titre et Badge d'état */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              sx={{ 
                fontSize: isMobile ? '0.95rem' : (variant === 'minimal' ? '0.9rem' : '1.1rem'),
                fontWeight: 'bold',
                lineHeight: 1.2,
                whiteSpace: 'normal',
                wordBreak: 'break-word'
              }}
            >
              {figure.nom}
            </Typography>
            {figure.difficulty_level && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mt: -0.5 }}>
                Niveau {figure.difficulty_level}
              </Typography>
            )}
          </Box>
          {progression && (
            <StateBadge
              etat={progression.etat}
              size="small"
              variant={isMobile ? "dot" : "chip"}
            />
          )}
        </Box>

        {/* Barre de progression */}
        {showProgress && progression && (
          <Box mb={isMobile ? 0.5 : 1} sx={{ width: '100%' }}>
            <ProgressBar
              value={progressPercent}
              size="small"
              showPercentage={!isMobile}
            />
          </Box>
        )}

        {/* Badges latéralité (masqués ou réduits sur mobile) */}
        {showLaterality && figure.lateralite_requise === 'bilateral' && progression && (
          <LateralityBadges
            gauche={progression.lateralite_gauche}
            droite={progression.lateralite_droite}
            sx={{ mb: 0.5, transform: isMobile ? 'scale(0.8)' : 'none', transformOrigin: 'left' }}
          />
        )}

        {/* Spacer pour pousser XP et actions en bas */}
        {!isMobile && <Box sx={{ flexGrow: 1 }} />}

        {/* XP et Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={isMobile ? 0 : 1}>
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
                  startIcon={!isMobile ? action.icon : null}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  sx={{ 
                    minWidth: 'auto', 
                    px: isMobile ? 0.5 : 1,
                    fontSize: isMobile ? '0.7rem' : 'inherit'
                  }}
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
