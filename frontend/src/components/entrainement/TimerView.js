import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

// Durée par défaut en secondes (ex: 2 minutes)
const DEFAULT_DURATION = 120; 

function TimerView({ etape, onResult, disabled, mode = 'timer' }) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [initialDuration, setInitialDuration] = useState(DEFAULT_DURATION);
  
  // Référence pour l'intervalle
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Fin du timer
      setIsActive(false);
      clearInterval(timerRef.current);
      playAlarm(); // Sonnerie (visuelle ou audio)
      
      // Si mode combiné, on demande l'évaluation
      if (mode === 'combined') {
        setShowEvaluation(true);
      } else {
        // Sinon (mode timer simple), on valide directement sans note
        handleEvaluation(null); 
      }
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialDuration);
  };

  const adjustTime = (seconds) => {
    const newTime = Math.max(10, initialDuration + seconds);
    setInitialDuration(newTime);
    setTimeLeft(newTime);
  };

  const playAlarm = () => {
    // Simple vibration pattern si supporté
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleEvaluation = (success) => {
    // Si success est null (mode timer simple), on considère ça comme une validation de durée uniquement
    // typeSaisie = 'duree'
    if (success === null) {
      setShowEvaluation(false);
      onResult({
        reussie: true, // Toujours réussi si on va au bout du timer en mode simple
        typeSaisie: 'duree',
        score: null,
        dureeSecondes: initialDuration
      });
      return;
    }

    // Sinon c'est le mode combiné ou un score explicite
    const finalScore = (typeof success === 'number') ? success : 3;
    const finalType = 'evaluation_duree'; 
    const isSuccess = finalScore >= 2;

    setShowEvaluation(false);
    onResult({
      reussie: isSuccess,
      typeSaisie: finalType,
      score: finalScore,
      dureeSecondes: initialDuration
    });
  };

  // Format MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((initialDuration - timeLeft) / initialDuration) * 100;

  return (
    <Card 
      elevation={4} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRadius: 4,
        overflow: 'hidden',
        maxWidth: 600,
        mx: 'auto',
        position: 'relative'
      }}
    >
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: mode === 'combined' ? 'warning.main' : 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight="bold">
          {etape.titre || etape.nom || `Étape ${etape.ordre}`}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {mode === 'combined' ? 'Mode Combiné (Timer + Éval)' : 'Mode Chrono - Mains libres'}
        </Typography>
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6 }}>
        
        {/* Cercle Timer */}
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
          <CircularProgress 
            variant="determinate" 
            value={100} 
            size={240} 
            sx={{ color: 'grey.200', position: 'absolute' }} 
            thickness={2}
          />
          <CircularProgress 
            variant="determinate" 
            value={progress} 
            size={240} 
            thickness={2}
            sx={{ 
              color: isActive ? (mode === 'combined' ? 'warning.main' : 'primary.main') : 'text.secondary',
              transition: 'all 0.5s linear' 
            }}
          />
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
              flexDirection: 'column'
            }}
          >
            <Typography variant="h2" component="div" fontWeight="bold" color="text.primary">
              {formatTime(timeLeft)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isActive ? 'EN COURS' : 'PAUSE'}
            </Typography>
          </Box>
        </Box>

        {/* Contrôles */}
        <Stack direction="row" spacing={3} alignItems="center">
          <IconButton onClick={() => adjustTime(-30)} disabled={isActive}>
            <RemoveIcon />
          </IconButton>
          
          <Button
            variant="contained"
            size="large"
            color={isActive ? "warning" : (mode === 'combined' ? "warning" : "primary")}
            onClick={toggleTimer}
            startIcon={isActive ? <PauseIcon /> : <PlayArrowIcon />}
            sx={{ 
              borderRadius: 50, 
              px: 4, 
              py: 2,
              minWidth: 160,
              fontSize: '1.2rem'
            }}
          >
            {isActive ? "PAUSE" : "DÉMARRER"}
          </Button>

          <IconButton onClick={() => adjustTime(30)} disabled={isActive}>
            <AddIcon />
          </IconButton>
        </Stack>
        
        {!isActive && timeLeft !== initialDuration && (
          <Button 
            startIcon={<ReplayIcon />} 
            onClick={resetTimer} 
            sx={{ mt: 2 }} 
            color="secondary"
          >
            Réinitialiser
          </Button>
        )}

      </CardContent>

      {/* Modal d'évaluation fin de timer (Uniquement pour mode Combiné) */}
      <Dialog 
        open={showEvaluation} 
        onClose={() => {}} // Empêcher fermeture au clic extérieur
        PaperProps={{
          sx: { borderRadius: 3, p: 1, textAlign: 'center' }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Session terminée !
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Comment s'est passée cette session de pratique ?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Cela validera l'étape dans votre progression.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 2, flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleEvaluation(3)} // Score 3: Maîtrisé
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            Maîtrisé (Parfait)
          </Button>
          
          <Button
            fullWidth
            variant="contained"
            color="warning"
            size="large"
            startIcon={<RemoveIcon sx={{ transform: 'rotate(90deg)' }} />}
            onClick={() => handleEvaluation(2)} // Score 2: Instable
            sx={{ py: 1.5, borderRadius: 2, color: 'white' }}
          >
            Instable (Moyen)
          </Button>

          <Button
            fullWidth
            variant="outlined"
            color="error"
            size="large"
            startIcon={<CancelIcon />}
            onClick={() => handleEvaluation(1)} // Score 1: À revoir
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            À revoir (Échec)
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default TimerView;
