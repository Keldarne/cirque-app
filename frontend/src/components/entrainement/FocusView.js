import React from 'react';
import { Box, Typography, Card, CardMedia, Stack, Chip, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star'; // Pour "Moyen"
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

function FocusView({ etape, onResult, disabled, duration = null }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const handleRate = (quality) => {
    const scoreMap = { 'fail': 1, 'medium': 2, 'perfect': 3 };
    const score = scoreMap[quality];
    onResult({ reussie: score >= 2, typeSaisie: duration ? 'evaluation_duree' : 'evaluation', score, dureeSecondes: duration });
  };

  return (
    <AnimatePresence mode="wait">
      <MotionBox
        key={etape.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        sx={{ 
          width: '100%', 
          maxWidth: isDesktop ? 1200 : 450, 
          height: isDesktop ? 'calc(100vh - 250px)' : '100%', 
          maxHeight: isDesktop ? 800 : 700, 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        <Box sx={{ 
          flex: 1, 
          borderRadius: isDesktop ? 0 : 5, 
          overflow: 'hidden', 
          boxShadow: isDesktop ? 'none' : '0 20px 40px rgba(0,0,0,0.08)',
          display: 'flex', 
          flexDirection: isDesktop ? 'row' : 'column',
          position: 'relative',
          bgcolor: isDesktop ? 'transparent' : 'white',
          border: isDesktop ? 'none' : '1px solid',
          borderColor: 'divider'
        }}>
          {/* MEDIA AREA */}
          <Box sx={{ 
            flex: isDesktop ? 1.3 : (isMobile ? 0.6 : 0.55), 
            bgcolor: '#000', 
            position: 'relative', 
            overflow: 'hidden',
            height: '100%',
            borderRadius: isDesktop ? 4 : 0, // Coins arrondis sur le média lui-même en desktop
            boxShadow: isDesktop ? '0 12px 40px rgba(0,0,0,0.3)' : 'none'
          }}>
            <CardMedia
              component={etape.video_url ? 'video' : 'img'}
              image={etape.video_url || etape.image_url || '/placeholder-figure.svg'}
              src={etape.video_url}
              autoPlay loop muted playsInline
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
              <Chip label={etape.disciplineNom} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }} />
            </Box>
          </Box>

          {/* CONTENT AREA */}
          <Box sx={{ 
            flex: 1, 
            minWidth: isDesktop ? 400 : 'auto', // Ensure minimum width for content
            p: isDesktop ? 4 : 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: isDesktop ? 'flex-start' : 'center', 
            textAlign: isDesktop ? 'left' : 'center', 
            bgcolor: isDesktop ? 'transparent' : 'white',
            justifyContent: 'center',
            overflowY: 'auto',
            // Hide scrollbar but keep functionality
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            <Typography variant={isDesktop ? "h3" : "h5"} sx={{ fontWeight: 900, mb: 2, color: '#1A2027', letterSpacing: -1 }}>
              {etape.titre || etape.nom}
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary', 
                mb: isDesktop ? 4 : 'auto', // Reduced from 8 to 4
                lineHeight: 1.8,
                fontSize: isDesktop ? '1.2rem' : '0.875rem',
                maxWidth: isDesktop ? 500 : 'none'
              }}
            >
              {etape.description}
            </Typography>

            {/* ACTION BUTTONS */}
            {/* Flexible Stack for 1, 2, or 3 buttons */}
            <Stack 
              direction="row" 
              spacing={isDesktop ? 3 : 2} 
              useFlexGap
              flexWrap="wrap"
              sx={{ 
                mt: 3, 
                width: '100%', 
                justifyContent: isDesktop ? 'flex-start' : 'center',
                rowGap: 2
              }}
            >
              <ActionButton 
                icon={<CloseIcon fontSize={isDesktop ? "large" : "medium"} />} 
                color="#FF5252" 
                label="À revoir" 
                onClick={() => handleRate('fail')} 
                disabled={disabled}
                large={isDesktop}
              />
              <ActionButton 
                icon={<StarIcon fontSize={isDesktop ? "large" : "medium"} />} 
                color="#FFB74D" 
                label="Moyen" 
                onClick={() => handleRate('medium')} 
                disabled={disabled}
                small={!isDesktop}
                large={isDesktop}
              />
              <ActionButton 
                icon={<CheckIcon fontSize={isDesktop ? "large" : "medium"} />} 
                color="#00E676" 
                label="Parfait" 
                onClick={() => handleRate('perfect')} 
                disabled={disabled}
                large={isDesktop}
              />
            </Stack>
          </Box>
        </Box>
      </MotionBox>
    </AnimatePresence>
  );
}

const ActionButton = ({ icon, color, label, onClick, disabled, small, large }) => {
  const size = large ? 90 : (small ? 60 : 72);
  
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: size,
          height: size,
          bgcolor: 'white',
          border: `2px solid ${color}20`,
          color: color,
          boxShadow: `0 8px 20px ${color}30`,
          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          '&:hover': { transform: 'translateY(-4px) scale(1.05)', bgcolor: color, color: 'white', borderColor: color },
          '&:active': { transform: 'scale(0.95)' }
        }}
      >
        {icon}
      </IconButton>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', fontSize: large ? '0.8rem' : '0.7rem', letterSpacing: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default FocusView;
