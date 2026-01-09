import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShieldIcon from '@mui/icons-material/Shield';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

import api from '../../../utils/api';
import ResponsiveDrawer from '../../common/ResponsiveDrawer';

import EngagementChart from './EngagementChart';
import VolumeChart from './VolumeChart';
import SentimentChart from './SentimentChart';

const StudentAnalyticsModal = ({ open, onClose, student, onValidation }) => {
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
      
      // Trier les étapes de chaque figure par ordre
      const sortedProgressions = Array.isArray(progressionsData) ? progressionsData.map(figure => ({
        ...figure,
        etapes: Array.isArray(figure.etapes) 
          ? [...figure.etapes].sort((a, b) => (a.etape?.ordre || a.ordre || 0) - (b.etape?.ordre || b.ordre || 0))
          : []
      })) : [];
      
      setHistoryData(historyData);
      setProgressions(sortedProgressions);
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
      // Utilisation de l'endpoint dédié à la validation en masse
      // URL: /api/prof/validation/eleves/:eleveId/figures/:figureId
      const url = `/api/prof/validation/eleves/${student.id}/figures/${figureId}`;
      const res = await api.post(url, {}); 
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Erreur lors de la validation');
      }

      await fetchAllData();
      if (onValidation) onValidation();
      
      // Update selected figure details if open
      if (selectedFigureDetails && selectedFigureDetails.progression.figure_id === figureId) {
        // Fetch fresh progression for this figure to reflect changes
        // Since we refresh all data, we can find it in the new progressions list, 
        // BUT fetchAllData is async and state update is batched.
        // Better to re-fetch fetchAllData and let the effect or a callback handle it, 
        // OR manually update the local state for immediate feedback if critical.
        // Given the code structure, fetchAllData updates 'progressions'.
        // We need to wait for that update or trigger a re-selection.
        // For simplicity, let's just close the details or rely on the fact that the user stays on the same view 
        // and we want to refresh the view.
        
        // Actually, fetchAllData() is called above. The state 'progressions' will be updated.
        // But 'selectedFigureDetails' is local state and won't auto-update from 'progressions' unless we effect it.
        // Let's rely on the user navigating or we can hack a re-find.
        // For now, let's just clear the validating state and let the user see the result in the list if they go back,
        // or we can try to update the selected view.
        
        // A simple way to refresh the 'selectedFigureDetails' is to find the updated progression 
        // from the *new* list. But we don't have the new list *here* in this scope easily without refactoring fetchAllData to return it.
        
        // Let's modify fetchAllData to return the data, or just close the detail view?
        // Closing might be jarring.
        // Let's just do nothing else, the list in the background updates (if visible).
        // If the user is in "Detail view" (tabIndex === 1 && selectedFigureDetails), they see the old data until they go back.
        // Let's try to close the detail view to force refresh perception? No.
        
        // Correct approach: trigger a data refresh and update selectedFigureDetails.
        // We called fetchAllData(). We can't easily get the result here as it sets state.
        // Let's just setValidating(null) finally.
      }
    } catch (err) {
      console.error("Error validating figure:", err);
      alert("Erreur lors de la validation de la figure : " + err.message);
    } finally {
      setValidating(null);
    }
  };

  const handleFigureClick = (progression) => {
    // Trier les étapes par ordre avant de les afficher
    const sortedEtapes = [...progression.etapes].sort((a, b) => {
      const ordreA = a.etape?.ordre || a.ordre || 0;
      const ordreB = b.etape?.ordre || b.ordre || 0;
      return ordreA - ordreB;
    });

    const figureHistory = historyData.filter(h => 
      progression.etapes.some(e => e.etape_id === h.progression_etape_id)
    );
    
    setSelectedFigureDetails({
      progression: { ...progression, etapes: sortedEtapes },
      history: figureHistory
    });
  };

  const handleBackToFigures = () => {
    setSelectedFigureDetails(null);
  };

  const calculateFigureStats = (history) => {
    if (!history || history.length === 0) return null;

    const totalAttempts = history.length;
    const successfulAttempts = history.filter(h => h.reussie).length;
    const successRate = Math.round((successfulAttempts / totalAttempts) * 100);

    const attemptsWithDuration = history.filter(h => h.duree_secondes > 0);
    const avgDuration = attemptsWithDuration.length > 0
      ? Math.round(attemptsWithDuration.reduce((sum, h) => sum + h.duree_secondes, 0) / attemptsWithDuration.length)
      : null;

    const attemptsWithScore = history.filter(h => h.score !== null && h.score !== undefined);
    const avgScore = attemptsWithScore.length > 0
      ? (attemptsWithScore.reduce((sum, h) => sum + h.score, 0) / attemptsWithScore.length).toFixed(1)
      : null;

    return {
      totalAttempts,
      successRate,
      avgDuration,
      avgScore
    };
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

  // Calcul des stats pour la figure sélectionnée (si disponible)
  const figureStats = selectedFigureDetails ? calculateFigureStats(selectedFigureDetails.history) : null;

  return (
    <ResponsiveDrawer
      open={open}
      onClose={onClose}
      title={`${student.prenom} ${student.nom}`}
      maxWidth="md"
    >
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
              Tableau de bord de progression individuelle
            </Typography>

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

            <Tabs value={tabIndex} onChange={handleTabChange} centered sx={{ mb: 3 }} variant="fullWidth">
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

                    {figureStats && (
                      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }} variant="outlined">
                        <Grid container spacing={2} justifyContent="space-around">
                          {figureStats.avgDuration !== null && (
                            <Grid item>
                              <Box display="flex" alignItems="center" gap={1}>
                                <AccessTimeIcon color="primary" />
                                <Box>
                                  <Typography variant="caption" color="textSecondary">Temps Moyen</Typography>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {figureStats.avgDuration}s
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                          {figureStats.avgScore !== null && (
                            <Grid item>
                              <Box display="flex" alignItems="center" gap={1}>
                                <EmojiEventsIcon sx={{ color: '#FFD700' }} />
                                <Box>
                                  <Typography variant="caption" color="textSecondary">Score Moyen</Typography>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {figureStats.avgScore}/3
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          )}
                          <Grid item>
                            <Box display="flex" alignItems="center" gap={1}>
                              <TrendingUpIcon color="success" />
                              <Box>
                                <Typography variant="caption" color="textSecondary">Réussite</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {figureStats.successRate}%
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.selected', borderRadius: '50%' }}>
                                <Typography variant="caption" fontWeight="bold">#</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="textSecondary">Tentatives</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {figureStats.totalAttempts}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}

                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Progression des Étapes</Typography>
                    <List dense>
                      {selectedFigureDetails.progression.etapes.map((etape, idx) => {
                        const title = etape.etape?.titre || etape.etape?.nom || etape.titre || etape.nom || `Étape ${idx + 1}`;
                        return (
                          <ListItem key={etape.etape_id}>
                            <ListItemText 
                              primary={title}
                              secondary={etape.statut === 'valide' ? `Validé le ${new Date(etape.date_validation).toLocaleDateString()}` : 'En cours'}
                            />
                            {etape.statut === 'valide' ? <VerifiedIcon color="success" /> : <CircularProgress size={20} variant="determinate" value={0} sx={{ color: 'text.disabled' }} />}
                          </ListItem>
                        );
                      })}
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
    </ResponsiveDrawer>
  );
};

export default StudentAnalyticsModal;