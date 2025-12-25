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
  Divider
} from '@mui/material';
import confetti from 'canvas-confetti';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

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
  // Lancer confetti à l'ouverture si bon score
  useEffect(() => {
    if (open && summary) {
      const successRate = (summary.totalReussites / summary.totalTentatives) * 100;

      if (successRate >= 80) {
        // Excellent score: confetti complet
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107']
        });
      } else if (successRate >= 50) {
        // Bon score: mini confetti
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <EmojiEventsIcon sx={{ fontSize: 60, color: 'gold', mb: 1 }} />
        <Typography variant="h4" component="div" gutterBottom fontWeight="bold">
          Session terminée !
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bravo pour vos efforts. Voici le résumé de votre séance.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Taux de réussite principal */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              textAlign: 'center',
              bgcolor: successRate >= 75 ? 'success.light' : 'grey.100',
              color: successRate >= 75 ? 'success.contrastText' : 'text.primary'
            }}
          >
            <Typography variant="h2" fontWeight={700}>
              {successRate}%
            </Typography>
            <Typography variant="subtitle1">
              Taux de réussite
            </Typography>
          </Paper>

          {/* Grille statistiques */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Réussites */}
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CheckCircleIcon />
                  <Typography variant="subtitle2">Réussites</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {summary.totalReussites}
                </Typography>
              </Paper>
            </Grid>

            {/* Échecs */}
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CancelIcon />
                  <Typography variant="subtitle2">Échecs</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {summary.totalEchecs}
                </Typography>
              </Paper>
            </Grid>

            {/* Max Streak */}
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocalFireDepartmentIcon />
                  <Typography variant="subtitle2">Max Streak</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {summary.maxStreak}
                </Typography>
              </Paper>
            </Grid>

            {/* Durée */}
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TimerIcon />
                  <Typography variant="subtitle2">Durée</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Détails supplémentaires */}
          <Box sx={{ px: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                <FitnessCenterIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                XP Gagné
              </Typography>
              <Typography variant="body1" fontWeight={600} color="primary">
                +{summary.xpGagne} XP
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Total tentatives
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {summary.totalTentatives}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Figures pratiquées
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {summary.figuresUniques}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined" fullWidth>
          Retour
        </Button>
        {onRetry && (
          <Button onClick={onRetry} variant="contained" fullWidth>
            Refaire
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default SessionSummary;
