import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const VolumeChart = ({ data }) => {
  const theme = useTheme();
  // data expected format: [{ date: 'YYYY-MM-DD', minutes: 45 }]

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h${m}m` : `${m}m`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Volume d'Entraînement (Temps cumulé)
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(val) => `${Math.round(val/60)}h`} />
            <Tooltip formatter={(val) => [formatDuration(val), 'Temps passé']} />
            <Area type="monotone" dataKey="minutes" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default VolumeChart;
