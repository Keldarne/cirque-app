import React, { useState, useEffect, useCallback } from 'react';
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
  Avatar
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

      // Rafraîchir les analytics avancées
      if (refreshAnalytics) {
        refreshAnalytics();
      }

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [refreshAnalytics]);

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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
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
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <StatCard
            title="Élèves & Groupes"
            value={`${statistiques?.total_eleves || 0} / ${statistiques?.total_groupes || 0}`}
            icon={GroupIcon}
            color="#4CAF50"
            subtitle="élèves / groupes"
          />
        </div>
        <div className="dashboard-stat-card">
          <StatCard
            title="Actifs cette semaine"
            value={statistiques?.eleves_actifs_semaine || 0}
            icon={TrendingUpIcon}
            color="#9C27B0"
          />
        </div>
      </div>

      {/* XP Total */}
      <div className="dashboard-xp-actions-grid">
        <div className="dashboard-xp-actions-card">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrophyIcon sx={{ fontSize: 30, color: '#FFD700', mr: 1 }} />
                <Typography variant="h6">XP Collectif</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFD700' }}>
                {(statistiques?.xp_total_eleves || 0).toLocaleString()} XP
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Moyenne par élève : {(statistiques?.moyenne_xp_par_eleve || 0).toLocaleString()} XP
              </Typography>
            </CardContent>
          </Card>
        </div>

        <div className="dashboard-xp-actions-card">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions rapides
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate('/prof/eleves')}
                  fullWidth
                >
                  Gérer les élèves
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  onClick={() => navigate('/prof/groupes')}
                  fullWidth
                >
                  Gérer les groupes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </div>
      </div>

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

      {/* Météo de la Classe (peut être gardé ou fusionné dans les alertes) */}
      {!analyticsLoading && analytics?.meteo_classe && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Météo de la Classe
          </Typography>
          {/* ... Météo de la classe reste ici ... */}
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
              <Alert severity="info">
                Vous n'avez pas encore d'élèves. Tous les élèves de votre école sont automatiquement accessibles dans l'onglet Élèves.
              </Alert>
            ) : (
              <div className="dashboard-items-grid">
                {eleves.slice(0, 6).map((eleve) => (
                  <div key={eleve.id} className="dashboard-item-card">
                    <Card
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 6 }
                      }}
                      onClick={() => navigate(`/prof/eleves/${eleve.id}`)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {eleve.prenom} {eleve.nom}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="textSecondary">
                            Niveau {eleve.niveau}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                            {(eleve.xp_total || 0).toLocaleString()} XP
                          </Typography>
                        </Box>
                        {eleve.streak && (
                          <Box mt={1} display="flex" alignItems="center">
                            <Typography variant="body2" color="textSecondary">
                              🔥 {eleve.streak.jours_consecutifs} jours
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
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
              <Alert severity="info">
                Vous n'avez pas encore de groupes. Créez-en un pour organiser vos élèves !
              </Alert>
            ) : (
              <div className="dashboard-items-grid">
                {groupes.map((groupe) => (
                  <div key={groupe.id} className="dashboard-item-card">
                    <Card
                      sx={{
                        cursor: 'pointer',
                        borderLeft: `4px solid ${groupe.couleur}`,
                        '&:hover': { boxShadow: 6 }
                      }}
                      onClick={() => navigate(`/prof/groupes/${groupe.id}`)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {groupe.nom}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {groupe.nombre_eleves} élève{groupe.nombre_eleves > 1 ? 's' : ''}
                        </Typography>
                        {groupe.description && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            {groupe.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default DashboardProfPage;
