import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, LinearProgress, Chip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';

/**
 * Barre de statistiques en temps réel pour la session d'entraînement
 *
 * Props:
 * - stats: Object avec { totalReussites, totalEchecs, streak, progress: { current, total, percent } }
 * - startTime: Date.now() du début de session
 * - compact: boolean - Version compacte (bottom bar mobile)
 */
function SessionStats({ stats, startTime, compact = false }) {
  const [elapsed, setElapsed] = useState(0);

  // Mettre à jour le timer chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Formater le temps écoulé en MM:SS
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (compact) {
    // Version compacte pour bottom bar mobile
    return (
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 1,
          borderRadius: 0,
          zIndex: 1100,
          bgcolor: 'background.paper'
        }}
      >
        {/* Streak */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <LocalFireDepartmentIcon
            sx={{
              color: stats.streak > 0 ? 'warning.main' : 'text.disabled',
              fontSize: '1.3rem'
            }}
          />
          <Typography variant="body2" fontWeight={700}>
            {stats.streak}
          </Typography>
        </Box>

        {/* Réussites */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.2rem' }} />
          <Typography variant="body2" fontWeight={600}>
            {stats.totalReussites}
          </Typography>
        </Box>

        {/* Échecs */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <CancelIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
          <Typography variant="body2" fontWeight={600}>
            {stats.totalEchecs}
          </Typography>
        </Box>

        {/* Timer */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <TimerIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {formatTime(elapsed)}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Version complète pour header desktop
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2
      }}
    >
      {/* Barre de progression */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Progression
          </Typography>
          <Typography variant="subtitle2" fontWeight={700}>
            {stats.progress.current} / {stats.progress.total}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={stats.progress.percent}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: 'primary.main'
            }
          }}
        />
      </Box>

      {/* Stats détaillées */}
      <Box display="flex" gap={2} flexWrap="wrap">
        {/* Streak */}
        <Chip
          icon={<LocalFireDepartmentIcon />}
          label={`Streak: ${stats.streak}`}
          color={stats.streak > 0 ? 'warning' : 'default'}
          sx={{ fontWeight: 600 }}
        />

        {/* Réussites */}
        <Chip
          icon={<CheckCircleIcon />}
          label={`${stats.totalReussites} réussites`}
          color="success"
          variant="outlined"
        />

        {/* Échecs */}
        <Chip
          icon={<CancelIcon />}
          label={`${stats.totalEchecs} échecs`}
          color="error"
          variant="outlined"
        />

        {/* Timer */}
        <Chip
          icon={<TimerIcon />}
          label={formatTime(elapsed)}
          variant="outlined"
        />

        {/* Taux de réussite */}
        {(stats.totalReussites + stats.totalEchecs) > 0 && (
          <Chip
            label={`${Math.round((stats.totalReussites / (stats.totalReussites + stats.totalEchecs)) * 100)}% réussite`}
            color="info"
            variant="outlined"
          />
        )}
      </Box>
    </Paper>
  );
}

export default SessionStats;
