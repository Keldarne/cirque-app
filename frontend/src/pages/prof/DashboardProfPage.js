import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Grid,
  Chip,
  LinearProgress,
  Skeleton
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useProfAnalytics, useElevesNegliges } from '../../hooks/useStatistics';

function DashboardProfPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistiques, setStatistiques] = useState(null);
  const [eleves, setEleves] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [onglet, setOnglet] = useState(0);

  // Hook pour charger les analytics avancées
  const { analytics, loading: analyticsLoading, refresh: refreshAnalytics } = useProfAnalytics();

  // Hook pour charger les élèves négligés
  const { data: elevesNegliges, loading: negligesLoading } = useElevesNegliges(30);

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les statistiques
      const statsRes = await api.get('/api/prof/statistiques');
      if (!statsRes.ok) throw new Error('Erreur chargement statistiques');
      const statsData = await statsRes.json();
      setStatistiques(statsData.statistiques);

      // Charger les élèves
      const elevesRes = await api.get('/api/prof/eleves');
      if (!elevesRes.ok) throw new Error('Erreur chargement élèves');
      const elevesData = await elevesRes.json();
      setEleves(elevesData.eleves || []);

      // Charger les groupes
      const groupesRes = await api.get('/api/prof/groupes');
      if (!groupesRes.ok) throw new Error('Erreur chargement groupes');
      const groupesData = await groupesRes.json();
      setGroupes(groupesData.groupes || []);

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // Pas de dépendances - la fonction est stable

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ fontSize: 40, color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Loading skeleton pour une meilleure UX
  const LoadingSkeleton = () => (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Skeleton variant="rectangular" height={80} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rectangular" height={150} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rectangular" height={150} />
        </Grid>
      </Grid>
    </Container>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="dashboard-prof-container">
      {/* En-tête */}
      <Box className="dashboard-prof-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Dashboard Professeur
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Vue d'ensemble de vos élèves et de leur progression
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={chargerDonnees}
          disabled={loading}
        >
          Rafraîchir
        </Button>
      </Box>

      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Élèves & Groupes"
            value={`${statistiques?.total_eleves || 0} / ${statistiques?.total_groupes || 0}`}
            icon={GroupIcon}
            color="#4CAF50"
            subtitle="élèves / groupes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Actifs cette semaine"
            value={statistiques?.eleves_actifs_semaine || 0}
            icon={TrendingUpIcon}
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrophyIcon sx={{ fontSize: 30, color: 'white', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>XP Collectif</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
                {(statistiques?.xp_total_eleves || 0).toLocaleString()} XP
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
                Moyenne: {(statistiques?.moyenne_xp_par_eleve || 0).toLocaleString()} XP/élève
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Actions rapides
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<SchoolIcon />}
              onClick={() => navigate('/prof/eleves')}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Gérer les élèves
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => navigate('/prof/groupes')}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Gérer les groupes
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/prof/programmes')}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Programmes
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              color="info"
              onClick={() => navigate('/prof/statistiques')}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Statistiques
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Action-Oriented Alerts Section */}
      <Box mt={4}>
        {!analyticsLoading && !negligesLoading && (analytics.top_figures_bloquantes?.length > 0 || elevesNegliges?.negliges_count > 0) && (
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Alertes et Actions Prioritaires
          </Typography>
        )}
        
        {/* Figures Bloquantes */}
        {!analyticsLoading && analytics.top_figures_bloquantes?.length > 0 && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'warning.light' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <WarningIcon sx={{ fontSize: 30, color: 'warning.dark' }} />
              <Typography variant="h6" color="warning.dark" fontWeight="bold">
                Figures Bloquantes
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Plusieurs élèves rencontrent des difficultés sur ces figures.
            </Typography>
            {analytics.top_figures_bloquantes.map((fig) => (
              <Card key={fig.figure_id} sx={{ mb: 1, p: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">
                    {fig.figure_nom} (Difficulté: {fig.difficulty})
                  </Typography>
                  <Typography variant="h6" color="warning.dark" fontWeight="bold">
                    {fig.eleves_bloques} élèves
                  </Typography>
                </Box>
              </Card>
            ))}
          </Paper>
        )}

        {/* Élèves Négligés */}
        {!negligesLoading && elevesNegliges?.negliges_count > 0 && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'error.light' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <AccessTimeIcon sx={{ fontSize: 30, color: 'error.dark' }} />
              <Typography variant="h6" color="error.dark" fontWeight="bold">
                Élèves à Suivre
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {`Ces élèves n'ont eu aucune interaction de votre part depuis plus de 30 jours.`}
            </Typography>
            <List sx={{ p: 0 }}>
              {elevesNegliges.eleves?.slice(0, 3).map((eleve) => (
                <ListItem
                  key={eleve.id}
                  divider
                  button
                  onClick={() => navigate(`/prof/eleves/${eleve.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar>{eleve.prenom?.[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${eleve.prenom} ${eleve.nom}`}
                    secondary={`Dernière interaction: ${eleve.jours_sans_interaction} jours`}
                  />
                  <Button variant="outlined" size="small">Voir Profil</Button>
                </ListItem>
              ))}
            </List>
            {elevesNegliges.eleves?.length > 3 && (
              <Box mt={2} textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  et {elevesNegliges.eleves.length - 3} autres...
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* Météo de la Classe */}
      {!analyticsLoading && analytics?.meteo_classe && (
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            📊 Météo de la Classe
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {analytics.meteo_classe.taux_activite ? `${Math.round(analytics.meteo_classe.taux_activite)}%` : 'N/A'}
                </Typography>
                <Typography variant="body2">Taux d'activité</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {analytics.meteo_classe.moyenne_grit ? analytics.meteo_classe.moyenne_grit.toFixed(1) : 'N/A'}
                </Typography>
                <Typography variant="body2">Persévérance Moyenne</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {analytics.meteo_classe.progression_moyenne ? `${Math.round(analytics.meteo_classe.progression_moyenne)}%` : 'N/A'}
                </Typography>
                <Typography variant="body2">Progression Moyenne</Typography>
              </Box>
            </Grid>
          </Grid>
          {analytics.meteo_classe.tendance && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Tendance: {analytics.meteo_classe.tendance}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Onglets */}
      <Paper className="dashboard-tabs-section">
        <Tabs value={onglet} onChange={(e, newValue) => setOnglet(newValue)}>
          <Tab label="Élèves récents" />
          <Tab label="Groupes" />
        </Tabs>

        {/* Liste des élèves */}
        {onglet === 0 && (
          <Box sx={{ p: 3 }}>
            {eleves.length === 0 ? (
              <Alert severity="info" sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>Aucun élève pour le moment</Typography>
                <Typography variant="body2">
                  Tous les élèves de votre école sont automatiquement accessibles dans l'onglet Élèves.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate('/prof/eleves')}
                  sx={{ mt: 2 }}
                >
                  Voir tous les élèves
                </Button>
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {eleves.slice(0, 6).map((eleve) => (
                  <Grid item xs={12} sm={6} md={4} key={eleve.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-4px)'
                        }
                      }}
                      onClick={() => navigate(`/prof/eleves/${eleve.id}`)}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                            {eleve.prenom?.[0]}{eleve.nom?.[0]}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {eleve.prenom} {eleve.nom}
                            </Typography>
                            <Chip label={`Niveau ${eleve.niveau}`} size="small" color="primary" variant="outlined" />
                          </Box>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                            {(eleve.xp_total || 0).toLocaleString()} XP
                          </Typography>
                          {eleve.streak && (
                            <Chip
                              icon={<span>🔥</span>}
                              label={`${eleve.streak.jours_consecutifs}j`}
                              size="small"
                              color="warning"
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            {eleves.length > 6 && (
              <Box mt={3} textAlign="center">
                <Button onClick={() => navigate('/prof/eleves')}>
                  Voir tous les élèves ({eleves.length})
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Liste des groupes */}
        {onglet === 1 && (
          <Box sx={{ p: 3 }}>
            {groupes.length === 0 ? (
              <Alert severity="info" sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>Aucun groupe créé</Typography>
                <Typography variant="body2">
                  Créez un groupe pour organiser vos élèves et faciliter la gestion !
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<GroupIcon />}
                  onClick={() => navigate('/prof/groupes')}
                  sx={{ mt: 2 }}
                >
                  Créer un groupe
                </Button>
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {groupes.map((groupe) => (
                  <Grid item xs={12} sm={6} md={4} key={groupe.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        borderLeft: `4px solid ${groupe.couleur}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 6,
                          transform: 'translateY(-4px)'
                        }
                      }}
                      onClick={() => navigate(`/prof/groupes/${groupe.id}`)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {groupe.nom}
                        </Typography>
                        <Chip
                          icon={<GroupIcon />}
                          label={`${groupe.nombre_eleves} élève${groupe.nombre_eleves > 1 ? 's' : ''}`}
                          size="small"
                          sx={{ backgroundColor: `${groupe.couleur}20`, color: groupe.couleur }}
                        />
                        {groupe.description && (
                          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                            {groupe.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default DashboardProfPage;
