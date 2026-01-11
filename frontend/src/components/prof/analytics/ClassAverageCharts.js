import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Paper, Typography, Grid, Box, CircularProgress } from '@mui/material';

const ClassAverageCharts = ({ data, loading }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  const { moyennes_par_discipline = [], activite_hebdomadaire = [] } = data;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: 350, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Niveau Moyen par Discipline (%)
          </Typography>
          <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={250}>
              {moyennes_par_discipline.length > 0 ? (
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={moyennes_par_discipline}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="discipline" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Classe"
                    dataKey="score_moyen"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.main}
                    fillOpacity={0.6}
                  />
                </RadarChart>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="textSecondary">Données insuffisantes</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: 350, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Activité Hebdomadaire (Tentatives)
          </Typography>
          <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={250}>
              {activite_hebdomadaire.length > 0 ? (
                <BarChart data={activite_hebdomadaire}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tentatives" name="Total Tentatives" fill={theme.palette.secondary.main} />
                </BarChart>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="textSecondary">Aucune activité récente</Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ClassAverageCharts;

