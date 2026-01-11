import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, Card, IconButton, CircularProgress, Dialog, DialogContent, Stack, useTheme, useMediaQuery } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);
const DEFAULT_DURATION = 120;

function TimerView({ etape, onResult, disabled, mode = 'timer' }) {
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [initialDuration, setInitialDuration] = useState(DEFAULT_DURATION);
  const [showEval, setShowEval] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(timerRef.current);
      if (mode === 'combined') setShowEval(true);
      else onResult({ reussie: true, typeSaisie: 'duree', score: null, dureeSecondes: initialDuration });
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, mode, initialDuration, onResult]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => { setIsActive(false); setTimeLeft(initialDuration); };
  const adjust = (val) => {
    const newTime = Math.max(10, initialDuration + val);
    setInitialDuration(newTime);
    setTimeLeft(newTime);
  };

  const progress = ((initialDuration - timeLeft) / initialDuration) * 100;
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Card sx={{ width: '100%', maxWidth: 450, height: '100%', maxHeight: 600, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: 'none', bgcolor: 'transparent' }}>
      
      {/* TIMER VISUAL */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 6 }}>
        {/* Background Track */}
        <CircularProgress variant="determinate" value={100} size={isMobile ? 260 : 320} thickness={1} sx={{ color: 'rgba(0,0,0,0.05)', position: 'absolute' }} />
        {/* Active Track */}
        <CircularProgress 
          variant="determinate" value={progress} size={isMobile ? 260 : 320} thickness={2} 
          sx={{ color: isActive ? '#2979FF' : '#B0BEC5', transition: 'all 1s linear', strokeLinecap: 'round' }} 
        />
        
        <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h1" sx={{ fontWeight: 700, fontSize: isMobile ? '4.5rem' : '5.5rem', color: '#1A2027', letterSpacing: -2 }}>
            {formatTime(timeLeft)}
          </Typography>
          <Typography variant="overline" sx={{ fontWeight: 700, color: isActive ? '#2979FF' : 'text.disabled', letterSpacing: 2 }}>
            {isActive ? 'EN COURS' : 'PRÊT'}
          </Typography>
        </Box>
      </Box>

      {/* CONTROLS */}
      <Stack direction="row" alignItems="center" spacing={4}>
        <IconButton onClick={() => adjust(-30)} disabled={isActive} sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <RemoveRoundedIcon />
        </IconButton>

        <Button
          onClick={toggle}
          variant="contained"
          sx={{
            borderRadius: '50%', width: 80, height: 80,
            bgcolor: isActive ? '#FF1744' : '#2979FF',
            boxShadow: isActive ? '0 10px 20px rgba(255, 23, 68, 0.3)' : '0 10px 20px rgba(41, 121, 255, 0.3)',
            '&:hover': { bgcolor: isActive ? '#D50000' : '#1565C0' }
          }}
        >
          {isActive ? <PauseRoundedIcon sx={{ fontSize: 40 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 40 }} />}
        </Button>

        <IconButton onClick={() => adjust(30)} disabled={isActive} sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <AddRoundedIcon />
        </IconButton>
      </Stack>

      {!isActive && timeLeft !== initialDuration && (
        <Button startIcon={<RefreshRoundedIcon />} onClick={reset} sx={{ mt: 4, color: 'text.secondary', fontWeight: 600 }}>
          RÉINITIALISER
        </Button>
      )}

      {/* EVALUATION DIALOG (Integrated look) */}
      <Dialog 
        open={showEval} 
        fullWidth 
        maxWidth="xs" 
        PaperProps={{ sx: { borderRadius: 4, p: 2, textAlign: 'center' } }}
      >
        <DialogContent>
          <Typography variant="h5" fontWeight={800} gutterBottom>Terminé !</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>Comment était votre technique ?</Typography>
          <Stack spacing={2} mt={3}>
            <EvalButton color="success" icon={<CheckCircleRoundedIcon />} label="Maîtrisé" onClick={() => onResult({ reussie: true, typeSaisie: 'evaluation_duree', score: 3, dureeSecondes: initialDuration })} />
            <EvalButton color="warning" icon={<StarRoundedIcon />} label="Moyen" onClick={() => onResult({ reussie: true, typeSaisie: 'evaluation_duree', score: 2, dureeSecondes: initialDuration })} />
            <EvalButton color="error" icon={<CancelRoundedIcon />} label="À revoir" onClick={() => onResult({ reussie: false, typeSaisie: 'evaluation_duree', score: 1, dureeSecondes: initialDuration })} />
          </Stack>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const EvalButton = ({ color, icon, label, onClick }) => (
  <Button variant="outlined" color={color} size="large" startIcon={icon} onClick={onClick} fullWidth sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
    {label}
  </Button>
);

export default TimerView;
