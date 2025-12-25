import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Paper,
  LinearProgress
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  FitnessCenter as FitnessCenterIcon
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";

function FigureDetailPage() {
  const { figureId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, setUser, loading: authLoading } = useAuth();

  const [figure, setFigure] = useState(null);
  const [progressionEtapes, setProgressionEtapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    const fetchFigureData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger la figure et ses progressions en parallèle
        const [figureRes, progressionRes] = await Promise.all([
          api.get(`/api/figures/${figureId}`),
          api.get(`/api/progression/figure/${figureId}/etapes`)
        ]);

        if (!figureRes.ok) {
          throw new Error('Figure non trouvée');
        }
        if (!progressionRes.ok) {
          throw new Error('Erreur lors du chargement de la progression');
        }

        const figureData = await figureRes.json();
        const progressionData = await progressionRes.json();

        setFigure(figureData);
        setProgressionEtapes(Array.isArray(progressionData) ? progressionData : []);
      } catch (err) {
        console.error("Erreur chargement figure:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFigureData();
  }, [figureId, isAuthenticated, navigate, authLoading]);

  const handleValidateEtape = async (progressionEtapeId) => {
    try {
      const response = await api.post(`/api/progression/etapes/${progressionEtapeId}/valider`, {});

      if (response.ok) {
        const data = await response.json();

        // Mettre à jour la liste des progressions
        setProgressionEtapes(prev =>
          prev.map(pe =>
            pe.id === progressionEtapeId
              ? { ...pe, statut: 'valide', date_validation: new Date().toISOString() }
              : pe
          )
        );

        // Mettre à jour l'utilisateur dans le contexte
        if (data.utilisateur) {
          setUser({ ...data.utilisateur });
        }
      } else {
        const error = await response.json();
        console.error("Erreur validation étape:", error);
      }
    } catch (error) {
      console.error("Erreur lors de la validation de l'étape:", error);
    }
  };

  const handleStartTraining = () => {
    navigate(`/entrainement/figure/${figureId}`);
  };

  // Calculer la progression globale
  const etapesValidees = progressionEtapes.filter(pe => pe.statut === 'valide');
  const totalEtapes = progressionEtapes.length;
  const progressionPercent = totalEtapes > 0 ? (etapesValidees.length / totalEtapes) * 100 : 0;
  const totalXpEtapes = progressionEtapes.reduce((sum, pe) => sum + (pe.etape?.xp || 0), 0);
  const xpGagne = etapesValidees.reduce((sum, pe) => sum + (pe.etape?.xp || 0), 0);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !figure) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          {error || 'Figure introuvable'}
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/mon-programme')} sx={{ mt: 2 }}>
          Retour à Mon Programme
        </Button>
      </Container>
    );
  }

  return (
    <Container className="figure-detail-container">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/mon-programme')}
        className="figure-detail-back-button"
      >
        Retour à Mon Programme
      </Button>

      <div className="figure-detail-grid-wrapper">
        {/* Carte principale de la figure */}
        <div className="figure-detail-main-content">
          <Card className="figure-detail-figure-card">
            {figure.image_url && (
              <CardMedia
                component="img"
                height="400"
                image={figure.image_url}
                alt={figure.nom}
              />
            )}
            <CardContent>
              <Box className="figure-detail-header">
                <Typography variant="h3" className="figure-detail-title">
                  {figure.nom}
                </Typography>
                <Chip
                  label={
                    progressionPercent === 100 ? 'Validée' :
                    progressionPercent > 0 ? 'En cours' :
                    'Non commencée'
                  }
                  color={
                    progressionPercent === 100 ? 'success' :
                    progressionPercent > 0 ? 'primary' :
                    'default'
                  }
                />
              </Box>

              <Typography variant="h6" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {figure.descriptif || "Aucune description disponible pour cette figure."}
              </Typography>

              {figure.video_url && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Vidéo de démonstration
                  </Typography>
                  <video
                    src={figure.video_url}
                    controls
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      marginTop: "10px"
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panneau de progression */}
        <div className="figure-detail-progress-panel-wrapper">
          <Paper elevation={3} className="figure-detail-progress-panel">
            <Typography variant="h5" gutterBottom>
              Votre Progression
            </Typography>

            {/* Barre de progression XP */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progression XP
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {xpGagne} / {totalXpEtapes} XP
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressionPercent}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'grey.300',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: progressionPercent === 100 ? 'success.main' : 'primary.main'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {progressionPercent.toFixed(0)}% complété
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                État actuel
              </Typography>
              <Typography variant="h6" color={progressionPercent === 100 ? 'success.main' : 'primary.main'}>
                {progressionPercent === 100 ? 'Maîtrisée' : 'En apprentissage'}
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Étapes validées
              </Typography>
              <Typography variant="h6">
                {etapesValidees.length} / {totalEtapes}
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                XP accumulés
              </Typography>
              <Chip
                label={`${xpGagne} XP`}
                color={xpGagne > 0 ? "success" : "default"}
                icon={xpGagne > 0 ? <CheckCircleIcon /> : undefined}
              />
            </Box>

            {/* Bouton S'entraîner */}
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={<FitnessCenterIcon />}
                onClick={handleStartTraining}
              >
                S'entraîner sur cette figure
              </Button>
            </Box>

            {progressionPercent === 100 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'success.main', borderRadius: 1 }}>
                <Typography variant="h6" color="white" align="center" fontWeight="bold">
                  🎉 Figure Maîtrisée !
                </Typography>
                <Typography variant="body2" color="white" align="center" sx={{ mt: 1 }}>
                  ✓ Toutes les étapes ont été complétées
                </Typography>
              </Box>
            )}
          </Paper>
        </div>

        {/* Étapes de progression */}
        <div className="figure-detail-etapes-wrapper">
          {totalEtapes > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Étapes de progression
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Suivez ces étapes pour maîtriser cette figure
                </Typography>

                {progressionEtapes.map((progEtape, index) => {
                  const etape = progEtape.etape;
                  const estValidee = progEtape.statut === 'valide';

                  return (
                    <Paper
                      key={progEtape.id}
                      elevation={2}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: estValidee ? 'success.light' : 'grey.50',
                        borderLeft: 4,
                        borderColor: estValidee ? 'success.main' : 'primary.main',
                        opacity: estValidee ? 0.8 : 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Chip
                          label={`Étape ${index + 1}`}
                          color={estValidee ? "success" : "primary"}
                          size="small"
                        />
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {etape?.titre || `Étape ${index + 1}`}
                        </Typography>
                        <Chip
                          label={`${etape?.xp || 0} XP`}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                        {estValidee && (
                          <CheckCircleIcon color="success" />
                        )}
                      </Box>

                      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        {etape?.description || 'Aucune description'}
                      </Typography>

                      {etape?.video_url && (
                        <Box sx={{ mt: 2 }}>
                          <video
                            src={etape.video_url}
                            controls
                            style={{
                              width: "100%",
                              maxHeight: "300px",
                              borderRadius: "4px"
                            }}
                          />
                        </Box>
                      )}

                      {!estValidee && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          sx={{ mt: 2 }}
                          onClick={() => handleValidateEtape(progEtape.id)}
                          startIcon={<CheckCircleIcon />}
                        >
                          Valider cette étape
                        </Button>
                      )}

                      {estValidee && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'success.dark', borderRadius: 1 }}>
                          <Typography variant="caption" color="white">
                            ✓ Étape validée - {etape?.xp || 0} XP gagnés
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}

                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="info.dark">
                    💡 Total: <strong>{totalXpEtapes} XP</strong> à gagner en complétant toutes les étapes
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}

export default FigureDetailPage;
