import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Chip,
  Grid
} from '@mui/material';
import {
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { api } from '../../utils/api';

const RARETE_COLORS = {
  commun: '#9E9E9E',
  rare: '#2196F3',
  epique: '#9C27B0',
  legendaire: '#FF6B00'
};

function TitresPage() {
  const [loading, setLoading] = useState(true);
  const [titres, setTitres] = useState([]);
  const [titreEquipe, setTitreEquipe] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    chargerTitres();
  }, []);

  const chargerTitres = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/gamification/titres');
      if (!res.ok) throw new Error('Erreur chargement titres');

      const data = await res.json();
      setTitres(data.titres || []);

      // Trouver le titre équipé
      const equipe = data.titres?.find(t => t.equipe);
      setTitreEquipe(equipe || null);
    } catch (err) {
      console.error('Erreur chargement titres:', err);
    } finally {
      setLoading(false);
    }
  };

  const afficherSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const equiperTitre = async (titreId) => {
    try {
      const res = await api.put(`/api/gamification/titres/${titreId}/equiper`);
      if (!res.ok) throw new Error('Erreur équipement titre');

      const data = await res.json();
      afficherSnackbar(data.message || 'Titre équipé !');
      chargerTitres();
    } catch (err) {
      console.error('Erreur équipement titre:', err);
      afficherSnackbar('Erreur lors de l\'équipement', 'error');
    }
  };

  const desequiperTitre = async () => {
    try {
      const res = await api.put('/api/gamification/titres/desequiper');
      if (!res.ok) throw new Error('Erreur déséquipement titre');

      afficherSnackbar('Titre déséquipé');
      chargerTitres();
    } catch (err) {
      console.error('Erreur déséquipement titre:', err);
      afficherSnackbar('Erreur lors du déséquipement', 'error');
    }
  };

  const nombreObtenus = titres.filter(t => t.obtenu).length;

  const TitreCard = ({ titre }) => {
    const isEquipe = titreEquipe?.id === titre.id;

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity: titre.obtenu ? 1 : 0.5,
          border: isEquipe ? `3px solid ${titre.couleur}` : '2px solid transparent',
          boxShadow: isEquipe ? 6 : 1,
          transition: 'all 0.3s',
          '&:hover': {
            transform: titre.obtenu ? 'translateY(-4px)' : 'none',
            boxShadow: titre.obtenu ? 6 : 1
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
          {/* Badge équipé */}
          {isEquipe && (
            <Chip
              label="ÉQUIPÉ"
              size="small"
              icon={<CheckIcon />}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: '#4CAF50',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          )}

          {/* Lock pour titres non obtenus */}
          {!titre.obtenu && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: '#9E9E9E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LockIcon sx={{ color: 'white' }} />
            </Box>
          )}

          {/* Étoile avec couleur du titre */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <StarIcon sx={{ fontSize: 64, color: titre.couleur, filter: titre.obtenu ? 'none' : 'grayscale(100%)' }} />
          </Box>

          {/* Nom du titre */}
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: titre.obtenu ? titre.couleur : '#9E9E9E',
              textShadow: titre.obtenu ? `0 0 10px ${titre.couleur}40` : 'none'
            }}
          >
            {titre.nom}
          </Typography>

          {/* Description */}
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mb: 2 }}>
            {titre.description}
          </Typography>

          {/* Condition */}
          {titre.condition_type === 'niveau' && (
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label={`Niveau ${titre.condition_valeur} requis`}
                size="small"
                sx={{ bgcolor: RARETE_COLORS[titre.rarete] + '30' }}
              />
            </Box>
          )}

          {/* Date d'obtention */}
          {titre.obtenu && titre.date_obtention && (
            <Typography variant="caption" color="textSecondary" display="block" textAlign="center" mt={2}>
              Obtenu le {new Date(titre.date_obtention).toLocaleDateString('fr-FR')}
            </Typography>
          )}
        </CardContent>

        {/* Actions */}
        {titre.obtenu && (
          <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
            {isEquipe ? (
              <Button
                variant="outlined"
                color="error"
                onClick={desequiperTitre}
              >
                Déséquiper
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => equiperTitre(titre.id)}
                sx={{
                  bgcolor: titre.couleur,
                  '&:hover': {
                    bgcolor: titre.couleur,
                    filter: 'brightness(0.9)'
                  }
                }}
              >
                Équiper
              </Button>
            )}
          </CardActions>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
          Collection de Titres
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Débloque et équipe des titres pour afficher ton statut
        </Typography>
      </Box>

      {/* Titre actuellement équipé */}
      {titreEquipe && (
        <Paper
          sx={{
            p: 3,
            mb: 4,
            background: `linear-gradient(135deg, ${titreEquipe.couleur}20 0%, ${titreEquipe.couleur}05 100%)`,
            border: `2px solid ${titreEquipe.couleur}`,
            borderRadius: 2
          }}
        >
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={2}>
            <Box display="flex" alignItems="center">
              <StarIcon sx={{ fontSize: 48, color: titreEquipe.couleur, mr: 2 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Titre Équipé
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: titreEquipe.couleur }}>
                  {titreEquipe.nom}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {titreEquipe.description}
                </Typography>
              </Box>
            </Box>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={desequiperTitre}
              fullWidth={false}
              sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
            >
              Déséquiper
            </Button>
          </Box>
        </Paper>
      )}

      {/* Statistiques */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4} textAlign="center">
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '2rem', md: '3rem' } }}>
              {nombreObtenus}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Titres obtenus
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} textAlign="center">
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.disabled', fontSize: { xs: '2rem', md: '3rem' } }}>
              {titres.length - nombreObtenus}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Titres à débloquer
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} textAlign="center">
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'secondary.main', fontSize: { xs: '2rem', md: '3rem' } }}>
              {Math.round((nombreObtenus / titres.length) * 100)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Collection complète
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Grille de titres */}
      {titres.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>Aucun titre disponible pour le moment.</Alert>
      ) : (
        <Grid container spacing={3}>
          {titres.map((titre) => (
            <Grid item xs={12} sm={6} md={4} key={titre.id}>
              <TitreCard titre={titre} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TitresPage;
