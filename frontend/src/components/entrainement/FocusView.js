import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Stack, 
  Chip,
  useMediaQuery,
  useTheme,
  IconButton
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

function FocusView({ etape, onResult, disabled, duration = null }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRate = (quality) => {
    const scoreMap = { 'fail': 1, 'medium': 2, 'perfect': 3 };
    const score = scoreMap[quality];
    const isSuccess = score >= 2;
    const typeSaisie = duration ? 'evaluation_duree' : 'evaluation';
    
    onResult({
      reussie: isSuccess,
      typeSaisie,
      score,
      dureeSecondes: duration
    });
  };

  return (
    <AnimatePresence mode="wait">
      <MotionBox
        key={etape.id}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1, x: 100 }}
        transition={{ duration: 0.3 }}
        sx={{ width: '100%', maxWidth: 500, height: isMobile ? 'calc(100vh - 180px)' : 700, position: 'relative' }}
      >
        <Card 
          elevation={8} 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 6,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* MEDIA SECTION - Dynamic background */}
          <Box sx={{ position: 'relative', flexGrow: 1, bgcolor: '#000' }}>
            <CardMedia
              component={etape.video_url ? 'video' : 'img'}
              image={etape.video_url || etape.figureImage || etape.image_url || '/placeholder-figure.svg'}
              src={etape.video_url}
              alt={etape.titre}
              autoPlay
              loop
              muted
              playsInline
              sx={{ 
                height: '100%', 
                width: '100%', 
                objectFit: 'contain'
              }}
            />
            
            {/* Top Overlay Info */}
            <Box sx={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, 
              p: 2, 
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
              color: 'white'
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 'bold', opacity: 0.9 }}>
                  {etape.disciplineNom || 'Entraînement'}
                </Typography>
                <Chip 
                  label={`Niveau ${etape.difficulte || 1}`} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }} 
                />
              </Box>
            </Box>
          </Box>

          {/* CONTENT SECTION - Clean & Focused */}
          <CardContent sx={{ pt: 3, pb: 4, px: 3, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="800" gutterBottom>
              {etape.titre || etape.nom}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2, minHeight: 40 }}>
              {etape.description || etape.descriptif}
            </Typography>

            {/* ACTION BUTTONS - Tinder Style */}
            <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
              
              {/* FAIL - Left */}
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  disabled={disabled}
                  onClick={() => handleRate('fail')}
                  sx={{ 
                    width: 64, height: 64, 
                    bgcolor: 'rgba(244, 67, 54, 0.1)', 
                    color: 'error.main',
                    border: '2px solid',
                    borderColor: 'error.main',
                    '&:hover': { bgcolor: 'error.main', color: 'white' },
                    transition: 'all 0.2s'
                  }}
                >
                  <CloseIcon sx={{ fontSize: 32 }} />
                </IconButton>
                <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', color: 'error.main' }}>
                  A REVOIR
                </Typography>
              </Box>

              {/* MEDIUM - Middle */}
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  disabled={disabled}
                  onClick={() => handleRate('medium')}
                  sx={{ 
                    width: 56, height: 56, 
                    bgcolor: 'rgba(255, 152, 0, 0.1)', 
                    color: 'warning.main',
                    border: '2px solid',
                    borderColor: 'warning.main',
                    '&:hover': { bgcolor: 'warning.main', color: 'white' },
                    transition: 'all 0.2s'
                  }}
                >
                  <StarIcon sx={{ fontSize: 28 }} />
                </IconButton>
                <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', color: 'warning.main' }}>
                  MOYEN
                </Typography>
              </Box>

              {/* PERFECT - Right */}
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  disabled={disabled}
                  onClick={() => handleRate('perfect')}
                  sx={{ 
                    width: 64, height: 64, 
                    bgcolor: 'rgba(76, 175, 80, 0.1)', 
                    color: 'success.main',
                    border: '2px solid',
                    borderColor: 'success.main',
                    '&:hover': { bgcolor: 'success.main', color: 'white' },
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <CheckIcon sx={{ fontSize: 32 }} />
                </IconButton>
                <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>
                  PARFAIT
                </Typography>
              </Box>

            </Stack>
          </CardContent>
        </Card>
      </MotionBox>
    </AnimatePresence>
  );
}

export default FocusView;