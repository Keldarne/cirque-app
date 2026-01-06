import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

const SentimentChart = ({ data }) => {
  // data expected format: [{ date: 'YYYY-MM-DD', score_moyen: 2.5 }]

  const getSentimentLabel = (score) => {
    if (score >= 2.5) return 'Confiant';
    if (score >= 1.5) return 'Moyen';
    return 'Difficile';
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Confiance / Sentiment (Auto-évaluation)
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              domain={[1, 3]} 
              ticks={[1, 2, 3]}
              tickFormatter={(val) => {
                if(val === 1) return 'Difficile';
                if(val === 2) return 'Moyen';
                if(val === 3) return 'Confiant';
                return val;
              }}
            />
            <Tooltip formatter={(val) => [val.toFixed(1), 'Score Moyen']} labelFormatter={(label) => `Date : ${label}`} />
            <Legend />
            <ReferenceLine y={2} stroke="red" strokeDasharray="3 3" label="Zone Neutre" />
            <Line type="monotone" dataKey="score_moyen" stroke="#ff7300" activeDot={{ r: 8 }} name="Confiance Moyenne" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default SentimentChart;
