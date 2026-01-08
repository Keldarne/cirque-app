import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const EngagementChart = ({ data }) => {
  const theme = useTheme();
  // data expected format: [{ date: 'YYYY-MM-DD', tentatives: 12, reussites: 8 }]

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Engagement (Fréquence d'entraînement)
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tentatives" name="Total Tentatives" fill={theme.palette.secondary.main} />
            <Bar dataKey="reussites" name="Réussites" fill={theme.palette.primary.main} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default EngagementChart;
