import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';

/**
 * Real-time session stats
 */
function SessionStats({ stats, startTime, compact = false }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <Paper
        elevation={0}
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          p: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          borderRadius: 0,
          zIndex: 1100,
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <StatItem icon={<LocalFireDepartmentIcon color="warning" />} value={stats.streak} label="STREAK" />
        <StatItem icon={<CheckCircleIcon color="success" />} value={stats.totalReussites} label="RÉUSSI" />
        <StatItem icon={<CancelIcon color="error" />} value={stats.totalEchecs} label="ÉCHECS" />
        <StatItem icon={<TimerIcon color="action" />} value={formatTime(elapsed)} label="TEMPS" />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3, mb: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'white'
      }}
    >
      <Typography variant="overline" sx={{ fontWeight: 'bold', opacity: 0.5, mb: 2, display: 'block' }}>
        PERFORMANCES LIVE
      </Typography>

      <Box display="flex" flexDirection="column" gap={2.5}>
        <DetailItem icon={<LocalFireDepartmentIcon sx={{ color: '#ff9800' }} />} label="Série actuelle" value={stats.streak} />
        <DetailItem icon={<CheckCircleIcon sx={{ color: '#4caf50' }} />} label="Réussites" value={stats.totalReussites} />
        <DetailItem icon={<CancelIcon sx={{ color: '#f44336' }} />} label="Échecs" value={stats.totalEchecs} />
        <DetailItem icon={<TimerIcon sx={{ color: '#757575' }} />} label="Temps écoulé" value={formatTime(elapsed)} />
      </Box>
    </Paper>
  );
}

const StatItem = ({ icon, value, label }) => (
  <Box display="flex" flexDirection="column" alignItems="center">
    {icon}
    <Typography variant="caption" fontWeight="900" sx={{ mt: 0.5 }}>{value}</Typography>
  </Box>
);

const DetailItem = ({ icon, label, value }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center">
    <Box display="flex" alignItems="center" gap={1.5}>
      {icon}
      <Typography variant="body2" fontWeight="bold" color="text.secondary">{label}</Typography>
    </Box>
    <Typography variant="body1" fontWeight="900">{value}</Typography>
  </Box>
);

export default SessionStats;