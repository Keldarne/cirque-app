import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Card, CardMedia, CardContent, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Create a motion-wrapped version of the MUI Box component
const MotionBox = motion(Box);

function SwipeableCard({ etape, onSwipe, disabled = false }) {
  const [exitDirection, setExitDirection] = useState(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const leftIndicatorOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 100], [0, 1]);

  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * Math.abs(velocity);
  };

  const handleDragEnd = (event, info) => {
    if (disabled) return;

    const threshold = 10000;
    const power = swipePower(info.offset.x, info.velocity.x);

    if (power > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      setExitDirection(direction);

      if ('vibrate' in navigator) {
        navigator.vibrate(direction === 'right' ? [50, 100, 50] : [50]);
      }

      setTimeout(() => {
        onSwipe(direction === 'right');
      }, 200);
    }
  };

  const cardVariants = {
    enter: { x: 1000, opacity: 0, rotate: 30 },
    center: { x: 0, opacity: 1, rotate: 0 },
    exitLeft: { x: -1000, opacity: 0, rotate: -30 },
    exitRight: { x: 1000, opacity: 0, rotate: 30 }
  };

  const transition = { type: 'spring', stiffness: 300, damping: 30 };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      <MotionBox
        sx={{
          width: '100%',
          maxWidth: '400px',
          cursor: disabled ? 'default' : 'grab'
        }}
        style={{ x, rotate, opacity }} // Motion values stay in 'style'
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        variants={cardVariants}
        initial="enter"
        animate={exitDirection ? `exit${exitDirection === 'right' ? 'Right' : 'Left'}` : 'center'}
        transition={transition}
        whileTap={{ cursor: 'grabbing' }}
      >
        <Card
          elevation={8}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 3,
            height: '100%'
          }}
        >
          {/* ... (le reste du contenu de la carte reste inchangé) ... */}
                     <CardMedia
                       component="img"
                       height="300"
                       image={etape.figureImage || etape.image_url || '/placeholder-figure.svg'}
                       alt={etape.titre || etape.figureNom}
                       sx={{ objectFit: 'cover', backgroundColor: 'grey.200' }}
                     />
          {etape.disciplineNom && (
            <Chip
              label={etape.disciplineNom}
              size="small"
              color="primary"
              sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 600 }}
            />
          )}
          <motion.div
            style={{
              opacity: leftIndicatorOpacity,
              position: 'absolute',
              top: '50%',
              left: 32,
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'error.main', color: 'white', px: 2, py: 1, borderRadius: 2, fontWeight: 700, fontSize: '1.2rem' }}>
              <CancelIcon fontSize="large" />
              <span>ÉCHOUÉ</span>
            </Box>
          </motion.div>
          <motion.div
            style={{
              opacity: rightIndicatorOpacity,
              position: 'absolute',
              top: '50%',
              right: 32,
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'success.main', color: 'white', px: 2, py: 1, borderRadius: 2, fontWeight: 700, fontSize: '1.2rem' }}>
              <CheckCircleIcon fontSize="large" />
              <span>RÉUSSI</span>
            </Box>
          </motion.div>
          <CardContent sx={{ pb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom fontWeight={700}>
              {etape.figureNom}
            </Typography>
            <Typography variant="subtitle1" color="primary" gutterBottom fontWeight={600}>
              {etape.titre || etape.nom || `Étape ${etape.ordre || ''}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {etape.description || etape.descriptif || "Pas de description pour cette étape."}
            </Typography>
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span style={{ fontSize: '1.2rem' }}>👈</span> Échoué
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Swipe pour valider
              </Typography>
              <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Réussi <span style={{ fontSize: '1.2rem' }}>👉</span>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </MotionBox>
    </Box>
  );
}

export default SwipeableCard;
