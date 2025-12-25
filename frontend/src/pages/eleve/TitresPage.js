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
  Chip
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
    <Container maxWidth="lg" className="titres-container">
      {/* En-tête */}
      <Box className="titres-header">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Collection de Titres
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Débloque et équipe des titres pour afficher ton statut
        </Typography>
      </Box>

      {/* Titre actuellement équipé */}
      {titreEquipe && (
        <Paper
          className="titres-equipped-section"
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${titreEquipe.couleur}20 0%, ${titreEquipe.couleur}05 100%)`,
            border: `2px solid ${titreEquipe.couleur}`
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
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
            <Button variant="outlined" color="error" onClick={desequiperTitre}>
              Déséquiper
            </Button>
          </Box>
        </Paper>
      )}

      {/* Statistiques */}
      <Paper className="titres-stats-section" sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
          <Box textAlign="center">
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
              {nombreObtenus}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Titres obtenus
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#9E9E9E' }}>
              {titres.length - nombreObtenus}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Titres à débloquer
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#FFD700' }}>
              {Math.round((nombreObtenus / titres.length) * 100)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Collection complète
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Grille de titres */}
      {titres.length === 0 ? (
        <Alert severity="info">Aucun titre disponible pour le moment.</Alert>
      ) : (
        <div className="titres-grid-wrapper">
          {titres.map((titre) => (
            <div key={titre.id} className="titres-card-item">
              <TitreCard titre={titre} />
            </div>
          ))}
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TitresPage;
