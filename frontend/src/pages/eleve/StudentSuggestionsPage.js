import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useSuggestions } from '../../hooks/useSuggestions';
import { useNavigate } from 'react-router-dom';

/**
 * Page Suggestions pour les Élèves
 * Affiche les figures recommandées basées sur leur progression
 */
function StudentSuggestionsPage() {
  const navigate = useNavigate();
  const { suggestions, loading, error, accepterSuggestion, dismisserSuggestion, obtenirDetails } = useSuggestions();

  const [detailsDialog, setDetailsDialog] = useState({ open: false, data: null });
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAccept = async (figureId, figureName) => {
    setLoadingAction(figureId);
    const result = await accepterSuggestion(figureId);
    setLoadingAction(null);

    if (result.success) {
      alert(`"${figureName}" a été ajoutée à ton programme personnel ! 🎉`);
    } else {
      alert(`Erreur : ${result.error || 'Impossible d\'accepter la suggestion'}`);
    }
  };

  const handleDismiss = async (figureId, figureName) => {
    if (!window.confirm(`Es-tu sûr de vouloir masquer "${figureName}" des suggestions ?`)) {
      return;
    }

    setLoadingAction(figureId);
    const result = await dismisserSuggestion(figureId);
    setLoadingAction(null);

    if (result.success) {
      // Déjà retiré de la liste par le hook
    } else {
      alert('Erreur lors du masquage de la suggestion');
    }
  };

  const handleShowDetails = async (figureId) => {
    const details = await obtenirDetails(figureId);
    setDetailsDialog({ open: true, data: details });
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, data: null });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Analyse de ta progression...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recherche des meilleures figures pour toi
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Erreur lors du chargement des suggestions : {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* En-tête */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LightbulbIcon sx={{ fontSize: 60, color: '#FFC107' }} />
          </Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Suggestions pour Toi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Voici les figures que nous te recommandons selon ta progression
          </Typography>
        </Box>

        {/* Empty State */}
        {suggestions.length === 0 ? (
          <Alert severity="info" icon={<TrophyIcon />} sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Aucune suggestion disponible pour le moment
            </Typography>
            <Typography variant="body2">
              Continue à pratiquer pour débloquer de nouvelles recommandations !
            </Typography>
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} personnalisée{suggestions.length > 1 ? 's' : ''}
            </Typography>

            {/* Liste des Suggestions */}
            {suggestions.map((suggestion) => {
              const scorePercentage = suggestion.score_preparation || 0;
              const isReady = scorePercentage >= 80;
              const isAlmostReady = scorePercentage >= 60;

              return (
                <Card
                  key={suggestion.figure_id}
                  sx={{
                    mb: 3,
                    border: isReady ? '2px solid #4CAF50' : 'none',
                    boxShadow: isReady ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 2
                  }}
                >
                  <CardContent>
                    {/* En-tête */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {suggestion.nom}
                      </Typography>
                      {isReady && <StarIcon sx={{ color: '#FFD700', fontSize: 30 }} />}
                    </Box>

                    {/* Description */}
                    {suggestion.descriptif && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {suggestion.descriptif}
                      </Typography>
                    )}

                    {/* Barre de préparation */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption">Préparation</Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {scorePercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={scorePercentage}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: isReady ? '#4caf50' : isAlmostReady ? '#ff9800' : '#757575',
                            borderRadius: 5
                          }
                        }}
                      />
                    </Box>

                    {/* Exercices validés / total */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>{suggestion.exercices_valides || 0}</strong> / {suggestion.exercices_total || 0} exercices validés
                      </Typography>
                    </Box>

                    {/* Badge de statut */}
                    <Box sx={{ mb: 2 }}>
                      {isReady ? (
                        <Chip label="✨ Tu es prêt !" color="success" icon={<CheckIcon />} />
                      ) : isAlmostReady ? (
                        <Chip label="🔥 Bientôt prêt" color="warning" />
                      ) : (
                        <Chip label="🎯 Entraîne-toi encore" color="default" />
                      )}
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckIcon />}
                        onClick={() => handleAccept(suggestion.figure_id, suggestion.nom)}
                        disabled={loadingAction === suggestion.figure_id}
                      >
                        {loadingAction === suggestion.figure_id ? 'En cours...' : 'Ajouter à mon programme'}
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={() => handleShowDetails(suggestion.figure_id)}
                      >
                        Voir détails
                      </Button>

                      <Button
                        variant="text"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleDismiss(suggestion.figure_id, suggestion.nom)}
                        disabled={loadingAction === suggestion.figure_id}
                      >
                        Ignorer
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {/* Bouton retour */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </Box>
      </Paper>

      {/* Dialog Détails */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Détails de préparation</DialogTitle>
        <DialogContent>
          {detailsDialog.data ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Score de préparation:</strong> {detailsDialog.data.score_preparation}%
              </Typography>
              <Typography variant="body2" gutterBottom>
                {detailsDialog.data.message}
              </Typography>

              {detailsDialog.data.details && detailsDialog.data.details.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Exercices requis:
                  </Typography>
                  <List dense>
                    {detailsDialog.data.details.map((detail, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={detail.exercice_nom}
                          secondary={`${detail.statut} - ${detail.progression_pct}%`}
                          primaryTypographyProps={{
                            color: detail.statut === 'valide' ? 'success.main' : 'text.secondary'
                          }}
                        />
                        {detail.statut === 'valide' && <CheckIcon color="success" />}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          ) : (
            <CircularProgress />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default StudentSuggestionsPage;
