import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  EmojiEvents as TrophyIcon,
  ExitToApp as LogoutIcon,
  Shield as ShieldIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

function ProfilPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  const [profil, setProfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [grit, setGrit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        if (!user?.id) return;

        // Appel parallèle des 3 sources de données
        const [profilRes, statsRes, gritRes] = await Promise.all([
          api.get('/api/gamification/statistiques/utilisateur/profil-gamification'),
          api.get(`/api/statistiques/eleve/${user.id}/dashboard`),
          api.get('/api/progression/grit-score')
        ]);

        if (!profilRes.ok) throw new Error("Erreur chargement profil gamification");
        
        const profilData = await profilRes.json();
        setProfil(profilData.profil);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (gritRes.ok) {
          const gritData = await gritRes.json();
          setGrit(gritData);
        }

      } catch (err) {
        console.error("Erreur chargement données profil:", err);
        setError("Impossible de charger certaines données du profil.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, [user, isAuthenticated, navigate, location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !profil) {
    return <Container sx={{ mt: 4 }}><Alert severity="warning">Aucune donnée de profil à afficher.</Alert></Container>;
  }

  const xpForNextLevel = 100; // Constante à ajuster selon règles backend
  const xpProgress = (profil.xp_total % xpForNextLevel);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      {/* --- En-tête Hero --- */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 4
        }}
      >
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" gap={3}>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'white', 
                color: 'primary.main',
                fontSize: 40,
                border: '4px solid rgba(255,255,255,0.3)'
              }}
            >
              {user.pseudo?.[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: 'white' }}>
                {user.pseudo}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EmailIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                <Typography variant="body1" sx={{ opacity: 0.8 }}>{user.email}</Typography>
              </Box>
            </Box>
          </Box>
          
          <Box display="flex" flexDirection="column" alignItems={{ xs: 'center', md: 'flex-end' }} gap={2}>
            <Box textAlign="right">
              <Typography variant="h6" sx={{ opacity: 0.9 }}>Niveau {profil.niveau}</Typography>
              <Typography variant="h2" fontWeight="bold" sx={{ lineHeight: 1 }}>
                {profil.xp_total} <span style={{ fontSize: '1rem', opacity: 0.7 }}>XP</span>
              </Typography>
            </Box>
            <Button
              variant="contained"
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </Box>
        </Box>

        {/* Barre XP */}
        <Box sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Progression niveau {profil.niveau + 1}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>{xpProgress} / {xpForNextLevel} XP</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={xpProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': { bgcolor: '#FFD700' } 
            }} 
          />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* --- Colonne Gauche: Stats & KPIs --- */}
        <Grid item xs={12} md={8}>
          {/* KPIs Principaux */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, height: '100%', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                <LocalFireDepartmentIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">{profil.streak?.jours_consecutifs || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Jours de Streak</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, height: '100%', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                <PsychologyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">{grit?.grit_score || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Score de Persévérance</Typography>
                <Typography variant="caption" color="textSecondary" display="block">{grit?.interpretation || '-'}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, height: '100%', textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                <TrophyIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">{profil.streak?.record_personnel || 0}</Typography>
                <Typography variant="body2" color="textSecondary">Record Personnel</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Graphique Polyvalence */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Profil de Compétences</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height={300} width="100%">
              {stats?.polyvalence && stats.polyvalence.length > 0 ? (
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.polyvalence}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="discipline" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Niveau"
                      dataKey="completion"
                      stroke={theme.palette.primary.main}
                      fill={theme.palette.primary.main}
                      fillOpacity={0.5}
                    />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="textSecondary">Pas assez de données pour le graphique</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Progression */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Progression</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" justifyContent="space-around" alignItems="center">
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold" color="primary">{profil.niveau}</Typography>
                <Typography variant="body2" color="textSecondary">Niveau</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold" color="secondary">{profil.xp_total}</Typography>
                <Typography variant="body2" color="textSecondary">XP Total</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* --- Colonne Droite: Context & Sécurité --- */}
        <Grid item xs={12} md={4}>
          {/* Carte École */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <SchoolIcon color="action" />
                <Typography variant="h6">Mon École</Typography>
              </Box>
              <Typography variant="h5" color="primary">
                {/* Nom de l'école non dispo directement dans profil gamification, 
                    idéalement à ajouter dans l'endpoint user/me ou profil */}
                L'Académie
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Élève
              </Typography>
            </CardContent>
          </Card>

          {/* Indicateurs Santé/Sécurité */}
          {stats?.securite && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Indicateurs Forme</Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Score Sécurité</Typography>
                    <Chip 
                      label={`${stats.securite.score}/100`} 
                      color={stats.securite.score > 80 ? "success" : stats.securite.score > 50 ? "warning" : "error"} 
                      size="small" 
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.securite.score} 
                    color={stats.securite.score > 80 ? "success" : "warning"}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }} 
                  />
                </Box>
                
                {stats?.decrochage && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Risque Décrochage</Typography>
                      {stats.decrochage.at_risk ? (
                        <WarningIcon color="error" fontSize="small" />
                      ) : (
                        <ShieldIcon color="success" fontSize="small" />
                      )}
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {stats.decrochage.at_risk ? "Risque détecté (faible activité)" : "Activité régulière"}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Titres */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Titres Débloqués</Typography>
              <Typography variant="h3" color="secondary.main">{profil.titres.total}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>titres obtenus</Typography>
              {/* 
              <Button variant="outlined" fullWidth onClick={() => navigate('/titres')}>
                Gérer mes titres
              </Button>
              */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ProfilPage;
