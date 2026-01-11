import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, useMediaQuery, useTheme } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';

function SessionStats({ stats, startTime, compact = false }) {
  const [elapsed, setElapsed] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    const i = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(i);
  }, [startTime]);

  const formatTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const containerStyle = compact ? {
    position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    width: '90%', maxWidth: 400,
    bgcolor: 'transparent', // Totally transparent
    color: 'text.primary', // Switch to primary text color for readability
    borderRadius: 50,
    p: '8px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 1200, boxShadow: 'none' // Remove shadow
  } : {
    p: 3, borderRadius: 4, bgcolor: 'white', border: '1px solid', borderColor: 'divider'
  };

  return (
    <Paper elevation={0} sx={containerStyle}>
      <StatItem icon={<LocalFireDepartmentIcon sx={{ color: '#FF9100' }} />} value={stats.streak} label={compact ? null : "Série"} />
      {compact && <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(0,0,0,0.1)' }} />}
      {!compact && <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.2)' }} />}
      <StatItem icon={<CheckCircleIcon sx={{ color: '#00E676' }} />} value={stats.totalReussites} label={compact ? null : "Réussites"} />
      {compact && <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(0,0,0,0.1)' }} />}
      {!compact && <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.2)' }} />}
      <StatItem icon={<TimerIcon sx={{ color: compact ? 'text.secondary' : 'text.secondary' }} />} value={formatTime(elapsed)} label={compact ? null : "Temps"} />
    </Paper>
  );
}

const StatItem = ({ icon, value, label }) => (
  <Box display="flex" alignItems="center" gap={1} flexDirection={label ? 'row' : 'row'}>
    {icon}
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1 }}>{value}</Typography>
      {label && <Typography variant="caption" display="block" color="text.secondary">{label}</Typography>}
    </Box>
  </Box>
);

export default SessionStats;
