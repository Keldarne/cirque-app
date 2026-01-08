import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShieldIcon from '@mui/icons-material/Shield';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

import api from '../../../utils/api';

import EngagementChart from './EngagementChart';
import VolumeChart from './VolumeChart';
import SentimentChart from './SentimentChart';

const StudentAnalyticsModal = ({ open, onClose, student }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [studentStats, setStudentStats] = useState(null);
  
  const [processedData, setProcessedData] = useState({
    engagement: [],
    volume: [],
    sentiment: []
  });
  const [tabIndex, setTabIndex] = useState(0);
  const [validating, setValidating] = useState(null);
  const [selectedFigureDetails, setSelectedFigureDetails] = useState(null);

  useEffect(() => {
    if (open && student) {
      fetchAllData();
    }
  }, [open, student]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, progressionsRes, statsRes] = await Promise.all([
        api.get(`/api/entrainement/historique/utilisateur/${student.id}?limit=100`),
        api.get(`/api/progression/utilisateur/${student.id}`),
        api.get(`/api/statistiques/eleve/${student.id}/dashboard`)
      ]);
      
      const historyData = await historyRes.json();
      const progressionsData = await progressionsRes.json();
      const statsData = await statsRes.json();
      
      setHistoryData(historyData);
      setProgressions(progressionsData);
      setStudentStats(statsData);
      processData(historyData);
    } catch (err) {
      console.error("Error fetching student analytics:", err);
      setError("Impossible de charger les données de l'élève.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateFigure = async (figureId) => {
    setValidating(figureId);
    try {
      const etapesRes = await api.get(`/api/progression/figure/${figureId}/etapes`);
      const etapes = await etapesRes.json();

      await Promise.all(etapes.map(etape => 
        api.post(`/api/progression/etape/${etape.etape_id}/valider`, {
          eleveId: student.id
        })
      ));

      await fetchAllData();
      
      // Update selected figure details if open
      if (selectedFigureDetails && selectedFigureDetails.progression.figure_id === figureId) {
        const updatedProg = progressions.find(p => p.figure_id === figureId);
        if (updatedProg) {
           setSelectedFigureDetails(prev => ({ ...prev, progression: updatedProg }));
        }
      }
    } catch (err) {
      console.error("Error validating figure:", err);
      alert("Erreur lors de la validation de la figure.");
    } finally {
      setValidating(null);
    }
  };

  const handleFigureClick = (progression) => {
    const figureHistory = historyData.filter(h => 
      progression.etapes.some(e => e.etape_id === h.progression_etape_id)
    );
    
    setSelectedFigureDetails({
      progression,
      history: figureHistory
    });
  };

  const handleBackToFigures = () => {
    setSelectedFigureDetails(null);
  };

  const processData = (data) => {
    const formatDate = (isoString) => {
      return new Date(isoString).toISOString().split('T')[0];
    };

    const groupedByDate = data.reduce((acc, attempt) => {
      const date = formatDate(attempt.createdAt);
      if (!acc[date]) {
        acc[date] = {
          date,
          attempts: [],
          totalDuration: 0,
          scores: []
        };
      }
      acc[date].attempts.push(attempt);
      
      if (attempt.duree_secondes) {
        acc[date].totalDuration += attempt.duree_secondes;
      }
      
      if ((attempt.type_saisie === 'evaluation' || attempt.type_saisie === 'evaluation_duree') && attempt.score) {
        acc[date].scores.push(attempt.score);
      }
      
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedByDate).sort();

    const engagement = sortedDates.map(date => ({
      date,
      tentatives: groupedByDate[date].attempts.length,
      reussites: groupedByDate[date].attempts.filter(a => a.reussie).length
    }));

    const volume = sortedDates.map(date => ({
      date,
      minutes: Math.round(groupedByDate[date].totalDuration / 60)
    }));

    const sentiment = sortedDates.map(date => {
      const scores = groupedByDate[date].scores;
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return avg ? { date, score_moyen: avg } : null;
    }).filter(item => item !== null);

    setProcessedData({ engagement, volume, sentiment });
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    if (newValue !== 1) setSelectedFigureDetails(null);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">{student.prenom} {student.nom}</Typography>
            <Typography variant="body2" color="textSecondary">
              Tableau de bord de progression individuelle
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {/* --- Summary KPIs Section --- */}
            {studentStats && (
              <Box sx={{ mb: 4, mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <ShieldIcon color="primary" />
                        <Typography variant="subtitle2">Score de Sécurité</Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {studentStats.securite?.score || 'N/A'}/100
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {studentStats.securite?.interpretation || 'Données insuffisantes'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                     <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                        bgcolor: studentStats.decrochage?.at_risk ? '#fff3e0' : 'background.paper' 
                     }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <WarningAmberIcon color={studentStats.decrochage?.at_risk ? 'error' : 'success'} />
                        <Typography variant="subtitle2">Risque Décrochage</Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color={studentStats.decrochage?.at_risk ? 'error.main' : 'success.main'}>
                        {studentStats.decrochage?.at_risk ? 'ÉLEVÉ' : 'FAIBLE'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ratio Activité: {studentStats.decrochage?.ratio || 0}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Paper elevation={1} sx={{ p: 1, height: '100%', minHeight: 150 }}>
                      <Typography variant="subtitle2" align="center" gutterBottom>Polyvalence</Typography>
                      <ResponsiveContainer width="100%" height={120}>
                        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={studentStats.polyvalence || []}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="discipline" tick={{fontSize: 10}} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Élève" dataKey="completion" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Tabs value={tabIndex} onChange={handleTabChange} centered sx={{ mb: 3 }}>
              <Tab label="Historique & Graphiques" />
              <Tab label="Validation Figures" />
            </Tabs>

            {tabIndex === 0 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <EngagementChart data={processedData.engagement} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <VolumeChart data={processedData.volume} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <SentimentChart data={processedData.sentiment} />
                  </Grid>
                </Grid>
              </Box>
            )}

            {tabIndex === 1 && (
              <Box>
                {selectedFigureDetails ? (
                  <Box>
                    <Button onClick={handleBackToFigures} sx={{ mb: 2 }}>
                      &larr; Retour à la liste
                    </Button>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{selectedFigureDetails.progression.figure_nom}</Typography>
                      {selectedFigureDetails.progression.etapes.every(e => e.statut === 'valide') && (
                        <Chip label="Maîtrisé" color="success" icon={<CheckCircleIcon />} />
                      )}
                    </Box>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Progression des Étapes</Typography>
                    <List dense>
                      {selectedFigureDetails.progression.etapes.map((etape, idx) => (
                        <ListItem key={etape.etape_id}>
                          <ListItemText 
                            primary={`Étape ${idx + 1}`}
                            secondary={etape.statut === 'valide' ? `Validé le ${new Date(etape.date_validation).toLocaleDateString()}` : 'En cours'}
                          />
                          {etape.statut === 'valide' ? <CheckCircleIcon color="success" /> : <CircularProgress size={20} variant="determinate" value={0} sx={{ color: 'text.disabled' }} />}
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Historique des Tentatives sur cette Figure</Typography>
                    {selectedFigureDetails.history.length > 0 ? (
                      <List sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper' }}>
                        {selectedFigureDetails.history.map((attempt) => (
                          <ListItem key={attempt.id} divider>
                            <ListItemText
                              primary={new Date(attempt.createdAt).toLocaleString()}
                              secondary={`Score: ${attempt.score || '-'} | Durée: ${attempt.duree_secondes ? attempt.duree_secondes + 's' : '-'}`}
                            />
                            {attempt.reussie ? <CheckCircleIcon color="success" fontSize="small" /> : <WarningAmberIcon color="error" fontSize="small" />}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Aucune tentative enregistrée.</Typography>
                    )}

                    <Box mt={3} display="flex" justifyContent="flex-end">
                       <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleValidateFigure(selectedFigureDetails.progression.figure_id)}
                          disabled={validating === selectedFigureDetails.progression.figure_id || selectedFigureDetails.progression.etapes.every(e => e.statut === 'valide')}
                        >
                          {validating === selectedFigureDetails.progression.figure_id ? <CircularProgress size={24} /> : "Valider toute la figure"}
                        </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>Figures en cours et Validation</Typography>
                    <List>
                      {progressions.length === 0 ? (
                        <Typography color="textSecondary">Aucune progression active.</Typography>
                      ) : (
                        progressions.map((prog) => {
                          const isValide = prog.etapes.every(e => e.statut === 'valide');
                          return (
                            <React.Fragment key={prog.figure_id}>
                              <ListItem
                                button
                                onClick={() => handleFigureClick(prog)}
                                secondaryAction={
                                  isValide ? (
                                    <Chip label="Maîtrisé" color="success" icon={<CheckCircleIcon />} size="small" />
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      color="success"
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleValidateFigure(prog.figure_id);
                                      }}
                                      disabled={validating === prog.figure_id}
                                    >
                                      {validating === prog.figure_id ? <CircularProgress size={20} /> : "Valider"}
                                    </Button>
                                  )
                                }
                              >
                                <ListItemText
                                  primary={prog.figure_nom}
                                  secondary={`${prog.discipline?.nom || 'Sans discipline'} - ${prog.etapes.filter(e => e.statut === 'valide').length}/${prog.etapes.length} étapes`}
                                />
                              </ListItem>
                              <Divider />
                            </React.Fragment>
                          );
                        })
                      )}
                    </List>
                  </>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentAnalyticsModal;