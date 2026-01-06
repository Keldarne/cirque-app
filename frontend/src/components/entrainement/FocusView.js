import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  Stack, 
  Chip,
  Fade
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'; // Pour "Moyen"
import { motion } from 'framer-motion';

const MotionButton = motion.create(Button);

function FocusView({ etape, onResult, disabled, duration = null }) {
  // Gestion des clics
  const handleRate = (quality) => {
    // quality: 'fail' | 'medium' | 'perfect'
    
    // Mapping pour l'API
    const scoreMap = {
      'fail': 1,
      'medium': 2,
      'perfect': 3
    };
    
    const score = scoreMap[quality];
    const isSuccess = score >= 2;
    
    // Si une durée est fournie, on est en mode combiné "evaluation_duree"
    // Sinon on est en mode simple "evaluation"
    const typeSaisie = duration ? 'evaluation_duree' : 'evaluation';
    
    // On passe un objet résultat complet
    onResult({
      reussie: isSuccess,
      typeSaisie,
      score,
      dureeSecondes: duration
    });
  };

  return (
    <Fade in={true} timeout={500}>
      <Card 
        elevation={4} 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          maxWidth: 600,
          mx: 'auto'
        }}
      >
        <Box sx={{ position: 'relative', flexGrow: 1, bgcolor: 'grey.100', minHeight: 250 }}>
          <CardMedia
            component={etape.video_url ? 'video' : 'img'}
            image={etape.video_url || etape.figureImage || etape.image_url || '/placeholder-figure.svg'}
            src={etape.video_url} // Pour élément video
            alt={etape.titre}
            autoPlay
            loop
            muted
            playsInline
            sx={{ 
              height: '100%', 
              width: '100%', 
              objectFit: 'contain', // Affiche tout le contenu média sans couper
              bgcolor: 'black'
            }}
          />
          
          {etape.disciplineNom && (
            <Chip 
              label={etape.disciplineNom} 
              color="primary" 
              size="small" 
              sx={{ position: 'absolute', top: 16, right: 16 }} 
            />
          )}
        </Box>

        <CardContent sx={{ pb: 3, px: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
            {etape.titre || etape.nom || `Étape ${etape.ordre}`}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center" paragraph sx={{ minHeight: '3em' }}>
            {etape.description || etape.descriptif || "Pratiquez ce mouvement en vous concentrant sur la forme."}
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            {/* Bouton Échec */}
            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variant="outlined"
              color="error"
              size="large"
              disabled={disabled}
              onClick={() => handleRate('fail')}
              startIcon={<CancelIcon />}
              sx={{ 
                flex: 1, 
                py: 2, 
                borderRadius: 3, 
                borderWidth: 2,
                '&:hover': { borderWidth: 2 } 
              }}
            >
              À revoir
            </MotionButton>

            {/* Bouton Moyen (Considéré comme réussite mais 'juste') */}
            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variant="contained"
              color="warning"
              size="large"
              disabled={disabled}
              onClick={() => handleRate('medium')}
              startIcon={<RemoveCircleIcon sx={{ transform: 'rotate(90deg)' }} />} // Icone "stable"
              sx={{ 
                flex: 1, 
                py: 2, 
                borderRadius: 3,
                color: 'white'
              }}
            >
              Instable
            </MotionButton>

            {/* Bouton Parfait */}
            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variant="contained"
              color="success"
              size="large"
              disabled={disabled}
              onClick={() => handleRate('perfect')}
              startIcon={<CheckCircleIcon />}
              sx={{ 
                flex: 1, 
                py: 2, 
                borderRadius: 3,
                boxShadow: '0 4px 14px 0 rgba(76, 175, 80, 0.39)'
              }}
            >
              Maîtrisé
            </MotionButton>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );
}

export default FocusView;
