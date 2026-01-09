import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import confetti from 'canvas-confetti';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { motion } from 'framer-motion';

const MotionPaper = motion.create(Paper);

/**
 * Modal récapitulatif de fin de session d'entraînement
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - summary: {
 *     duration: number (ms),
 *     totalTentatives: number,
 *     totalReussites: number,
 *     totalEchecs: number,
 *     maxStreak: number,
 *     xpGagne: number,
 *     figuresUniques: number
 *   }
 * - onRetry: () => void - Callback pour refaire la session
 */
function SessionSummary({ open, onClose, summary, onRetry }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Lancer confetti à l'ouverture si bon score
  useEffect(() => {
    if (open && summary) {
      const successRate = (summary.totalReussites / summary.totalTentatives) * 100;

      if (successRate >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107']
        });
      } else if (successRate >= 50) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 }
        });
      }
    }
  }, [open, summary]);

  if (!summary) return null;

  // Calculer les métriques
  const successRate = Math.round((summary.totalReussites / summary.totalTentatives) * 100);
  const durationMinutes = Math.floor(summary.duration / 60000);
  const durationSeconds = Math.floor((summary.duration % 60000) / 1000);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 6, p: isMobile ? 1 : 2 } }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <EmojiEventsIcon sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
        </motion.div>
        <Typography variant="h4" fontWeight="900">
          Session terminée !
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Excellent travail ! Voici tes performances du jour.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* MAIN SCORE CARD */}
          <MotionPaper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            elevation={0}
            sx={{
              p: 4, mb: 4,
              textAlign: 'center',
              borderRadius: 5,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h2" fontWeight="900" color="primary">
              {successRate}%
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
              TAUX DE RÉUSSITE
            </Typography>
          </MotionPaper>

          {/* STATS GRID */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 4, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ color: 'success.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{summary.totalReussites}</Typography>
                <Typography variant="caption" color="text.secondary">RÉUSSITES</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(244, 67, 54, 0.08)', borderRadius: 4, textAlign: 'center' }}>
                <CancelIcon sx={{ color: 'error.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{summary.totalEchecs}</Typography>
                <Typography variant="caption" color="text.secondary">ÉCHECS</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.08)', borderRadius: 4, textAlign: 'center' }}>
                <LocalFireDepartmentIcon sx={{ color: 'warning.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{summary.maxStreak}</Typography>
                <Typography variant="caption" color="text.secondary">MAX STREAK</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 4, textAlign: 'center' }}>
                <TimerIcon sx={{ color: 'info.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{durationMinutes}:{durationSeconds.toString().padStart(2, '0')}</Typography>
                <Typography variant="caption" color="text.secondary">DURÉE</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* XP INFO */}
          <Box sx={{ px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <FitnessCenterIcon color="primary" />
              <Typography fontWeight="bold">EXPÉRIENCE GAGNÉE</Typography>
            </Box>
            <Chip 
              label={`+${summary.xpGagne} XP`} 
              color="primary" 
              sx={{ fontWeight: '900', fontSize: '1.1rem', py: 2, px: 1 }} 
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0, flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
        <Button 
          onClick={onClose} 
          fullWidth 
          variant="outlined" 
          size="large"
          sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}
        >
          TERMINER
        </Button>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            fullWidth 
            variant="contained" 
            size="large"
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}
          >
            RECOMMENCER
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default SessionSummary;