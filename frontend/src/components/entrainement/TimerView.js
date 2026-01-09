import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Stack,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

const DEFAULT_DURATION = 120; 

function TimerView({ etape, onResult, disabled, mode = 'timer' }) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [initialDuration, setInitialDuration] = useState(DEFAULT_DURATION);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const timerRef = useRef(null);

  const handleEvaluation = useCallback((success) => {
    if (success === null) {
      setShowEvaluation(false);
      onResult({
        reussie: true,
        typeSaisie: 'duree',
        score: null,
        dureeSecondes: initialDuration
      });
      return;
    }

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
  }, [initialDuration, onResult]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(timerRef.current);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      
      if (mode === 'combined') {
        setShowEvaluation(true);
      } else {
        handleEvaluation(null); 
      }
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, mode, handleEvaluation]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(initialDuration); };
  const adjustTime = (seconds) => {
    const newTime = Math.max(10, initialDuration + seconds);
    setInitialDuration(newTime);
    setTimeLeft(newTime);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((initialDuration - timeLeft) / initialDuration) * 100;
  const circleSize = isMobile ? 200 : 280;

  return (
    <AnimatePresence mode="wait">
      <MotionBox
        key="timer-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ width: '100%', maxWidth: 500, height: isMobile ? 'calc(100vh - 180px)' : 700 }}
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
            position: 'relative'
          }}
        >
          {/* Header Info */}
          <Box sx={{ 
            p: 3, 
            textAlign: 'center', 
            background: mode === 'combined' ? 'linear-gradient(135deg, #ffa726 0%, #f57c00 100%)' : 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)', 
            color: 'white' 
          }}>
            <Typography variant="h6" fontWeight="800">
              {etape.titre || etape.nom}
            </Typography>
            <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 'bold' }}>
              {mode === 'combined' ? 'CHRONO + ÉVALUATION' : 'CHRONO MAIN LIBRE'}
            </Typography>
          </Box>

          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            
            {/* TIMER CIRCLE */}
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 6 }}>
              <CircularProgress 
                variant="determinate" 
                value={100} 
                size={circleSize} 
                sx={{ color: 'grey.100', position: 'absolute' }} 
                thickness={1.5}
              />
              <CircularProgress 
                variant="determinate" 
                value={progress} 
                size={circleSize} 
                thickness={2}
                sx={{ 
                  color: isActive ? 'primary.main' : 'text.disabled',
                  transition: 'all 0.5s linear',
                  filter: 'drop-shadow(0px 0px 8px rgba(25, 118, 210, 0.2))'
                }}
              />
              <Box
                sx={{
                  top: 0, left: 0, bottom: 0, right: 0,
                  position: 'absolute',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                }}
              >
                <Typography variant={isMobile ? "h2" : "h1"} fontWeight="900" color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(timeLeft)}
                </Typography>
                <Chip 
                  label={isActive ? 'ACTION' : 'PAUSE'} 
                  size="small" 
                  color={isActive ? 'success' : 'default'}
                  sx={{ mt: 1, fontWeight: 'bold' }}
                />
              </Box>
            </Box>

            {/* CONTROLS */}
            <Stack direction="row" spacing={4} alignItems="center">
              <IconButton 
                onClick={() => adjustTime(-30)} 
                disabled={isActive}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <RemoveIcon />
              </IconButton>
              
              <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  onClick={toggleTimer}
                  sx={{ 
                    borderRadius: '50%', 
                    width: 80, height: 80,
                    bgcolor: isActive ? 'error.main' : 'primary.main',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: isActive ? 'error.dark' : 'primary.dark' }
                  }}
                >
                  {isActive ? <PauseIcon sx={{ fontSize: 40 }} /> : <PlayArrowIcon sx={{ fontSize: 40 }} />}
                </Button>
              </MotionBox>

              <IconButton 
                onClick={() => adjustTime(30)} 
                disabled={isActive}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <AddIcon />
              </IconButton>
            </Stack>
            
            <AnimatePresence>
              {!isActive && timeLeft !== initialDuration && (
                <MotionBox
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Button 
                    variant="text"
                    startIcon={<ReplayIcon />} 
                    onClick={resetTimer} 
                    sx={{ mt: 4, color: 'text.secondary' }} 
                  >
                    RÉINITIALISER
                  </Button>
                </MotionBox>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>

        {/* Evaluation Dialog - Cleaner version */}
        <Dialog 
          open={showEvaluation} 
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : 6, p: 2 } }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
            <Typography variant="h4" fontWeight="900" gutterBottom>Session terminée !</Typography>
            <Typography variant="body1" color="text.secondary">Bravo, vous avez tenu toute la durée.</Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 4 }}>
                Comment évaluez-vous votre technique ?
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  fullWidth size="large" variant="contained" color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => handleEvaluation(3)}
                  sx={{ py: 2, borderRadius: 3, fontWeight: 'bold' }}
                >
                  MAÎTRISÉ (PARFAIT)
                </Button>
                
                <Button
                  fullWidth size="large" variant="outlined" color="warning"
                  startIcon={<StarIcon />}
                  onClick={() => handleEvaluation(2)}
                  sx={{ py: 2, borderRadius: 3, fontWeight: 'bold', borderWidth: 2 }}
                >
                  INSTABLE (MOYEN)
                </Button>

                <Button
                  fullWidth size="large" variant="text" color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => handleEvaluation(1)}
                  sx={{ py: 2, borderRadius: 3, fontWeight: 'bold' }}
                >
                  À REVOIR (ÉCHEC)
                </Button>
              </Stack>
            </Box>
          </DialogContent>
        </Dialog>
      </MotionBox>
    </AnimatePresence>
  );
}

export default TimerView;