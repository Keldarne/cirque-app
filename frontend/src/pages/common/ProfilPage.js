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
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  EmojiEvents as TrophyIcon,
  ExitToApp as LogoutIcon,
  Shield as ShieldIcon,
  LocalFireDepartment as LocalFireDepartmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

function ProfilPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Ajout du hook useLocation
  
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const fetchProfil = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/gamification/statistiques/utilisateur/profil-gamification');
        
        if (!res.ok) {
          throw new Error(`Erreur HTTP: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        
        if (!data || !data.profil) {
            throw new Error("Les données du profil sont invalides ou vides.");
        }

        setProfil(data.profil);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement du profil de gamification:", err);
        setError("Impossible de charger le profil. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfil();
    }
  }, [user, isAuthenticated, navigate, location]); // Ajout de 'location' aux dépendances

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <Container sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }
  
  if (!user || !profil) {
    return <Container sx={{ mt: 4 }}><Alert severity="warning">Aucune donnée de profil à afficher.</Alert></Container>;
  }

  // Calcul du progrès XP pour le niveau actuel
  const xpForNextLevel = 100; // Supposons 100 XP par niveau pour l'instant
  const xpProgress = (profil.xp_total % xpForNextLevel);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête du profil */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                {user.pseudo}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <EmailIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Déconnexion
          </Button>
        </Box>
      </Paper>

      {/* Statistiques de Gamification */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Niveau</Typography>
              <Typography variant="h3" color="primary">{profil.niveau}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Classement Global</Typography>
              <Typography variant="h3" color="primary">#{profil.classement_global}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
           <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Défis Complétés</Typography>
              <Typography variant="h3" color="primary">{profil.defis_completes}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Streak */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <LocalFireDepartmentIcon sx={{ color: profil.streak.jours_consecutifs > 0 ? 'error.main' : 'text.secondary' }} />
          <Typography variant="h6">Série de Jours (Streak)</Typography>
        </Box>
        <Typography variant="body1">
          Série actuelle : <strong>{profil.streak.jours_consecutifs} jours</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Record personnel : {profil.streak.record_personnel} jours
        </Typography>
      </Paper>

      {/* Barre de progression XP */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Progression vers le niveau {profil.niveau + 1}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
           <Box sx={{ width: '100%' }}>
             <LinearProgress
                variant="determinate"
                value={xpProgress}
                sx={{ height: 10, borderRadius: 5 }}
              />
           </Box>
           <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px' }}>
            {profil.xp_total % xpForNextLevel} / {xpForNextLevel} XP
          </Typography>
        </Box>
      </Paper>
      
      {/* Badges et Titres */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Badges</Typography>
                    <Typography variant="h4">{profil.badges.total}</Typography>
                    <Typography variant="body2" color="text.secondary">Badges débloqués</Typography>
                    {profil.badges.affiche && (
                      <Box mt={2} p={1} bgcolor="grey.100" borderRadius={1}>
                        <Typography variant="caption">Badge affiché :</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                           <ShieldIcon sx={{ color: 'primary.main' }} />
                           <Typography variant="body1" fontWeight="bold">{profil.badges.affiche.nom}</Typography>
                        </Box>
                      </Box>
                    )}
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Titres</Typography>
                    <Typography variant="h4">{profil.titres.total}</Typography>
                    <Typography variant="body2" color="text.secondary">Titres débloqués</Typography>
                     {profil.titres.equipe && (
                      <Box mt={2} p={1} bgcolor="grey.100" borderRadius={1}>
                        <Typography variant="caption">Titre équipé :</Typography>
                         <Box display="flex" alignItems="center" gap={1}>
                           <TrophyIcon sx={{ color: 'warning.main' }} />
                           <Typography variant="body1" fontWeight="bold">{profil.titres.equipe.nom}</Typography>
                        </Box>
                      </Box>
                    )}
                </CardContent>
            </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ProfilPage;
