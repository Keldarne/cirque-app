import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Collapse,
  Grid,
  Button,
  Snackbar,
  Alert,
  Chip,
  Box
} from "@mui/material";
import { Add as AddIcon, Check as CheckIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useRefresh } from "../../contexts/RefreshContext";
import { api } from "../../utils/api";

function FiguresPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { refreshKey } = useRefresh();

  const [figures, setFigures] = useState([]);
  const [expandedFigure, setExpandedFigure] = useState(null);
  const [discipline, setDiscipline] = useState(null);
  const [progressions, setProgressions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    api.get(`/api/disciplines/${id}`)
      .then(res => res.json())
      .then(data => setDiscipline(data))
      .catch(err => console.error("Erreur fetch discipline:", err));

    api.get(`/api/figures?discipline_id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFigures(data);
        } else {
          console.error("Les figures ne sont pas un tableau:", data);
          setFigures([]);
        }
      })
      .catch(err => console.error("Erreur fetch figures:", err));
  }, [id, isAuthenticated, navigate, refreshKey]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Note: This endpoint is from the old system. It might need updating
      // to use the new ProgressionFigure model on the backend.
      api.get(`/api/progression/utilisateur/${user.id}/discipline/${id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setProgressions(data);
          } else {
            console.error("Les progressions ne sont pas un tableau:", data);
            setProgressions([]);
          }
        })
        .catch(err => console.error("Erreur fetch progressions:", err));
    }
  }, [id, user, isAuthenticated, refreshKey]);

  // Ouvre/ferme la carte détaillée d'une figure
  const toggleExpand = (figure) => {
    setExpandedFigure(expandedFigure?.id === figure.id ? null : figure);
  };

  // Teste si la figure est déjà dans la liste de l'utilisateur
  const isInProgress = (figureId) => {
    return progressions.some(p => p.figure_id === figureId);
  };

  const getProgressionEtat = (figureId) => {
    const progression = progressions.find(p => p.figure_id === figureId);
    // Note: this uses 'etat', but the new model has 'statut' and 'score_maitrise'.
    // This will need to be updated when the progression fetching is refactored.
    return progression?.etat || null;
  };

  const handleAddToProgress = async (e, figureId) => {
    e.stopPropagation();

    try {
      const response = await api.post('/api/progression', {
        figure_id: figureId,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setSnackbar({
            open: true,
            message: 'Cette figure est déjà dans votre liste',
            severity: 'info'
          });
        } else {
          throw new Error(data.error || 'Erreur lors de l\'ajout');
        }
        return;
      }

      // Mettre à jour la liste des progressions
      setProgressions([...progressions, data]);
      setSnackbar({
        open: true,
        message: 'Figure ajoutée à votre liste !',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de l\'ajout',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Bouton retour et titre */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Retour aux disciplines
        </Button>
        <Typography variant="h4">
          Figures de la discipline {discipline ? discipline.nom : id}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {figures.map(fig => (
          <Grid
            item
            xs={expandedFigure?.id === fig.id ? 12 : 6} // ✅ carte cliquée prend toute la largeur
            key={fig.id}
          >
            <Card
              onClick={() => toggleExpand(fig)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: expandedFigure?.id === fig.id ? 6 : 2,
                position: 'relative'
              }}
            >
              {/* Badge d'état */}
              {getProgressionEtat(fig.id) && (
                <Chip
                  label={
                    getProgressionEtat(fig.id) === 'valide' ? 'Validée' :
                    getProgressionEtat(fig.id) === 'en_cours' ? 'En cours' :
                    'Non commencée'
                  }
                  color={
                    getProgressionEtat(fig.id) === 'valide' ? 'success' :
                    getProgressionEtat(fig.id) === 'en_cours' ? 'primary' :
                    'default'
                  }
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1
                  }}
                />
              )}

              {fig.image_url && (
                <CardMedia
                  component="img"
                  height="200"
                  image={fig.image_url}
                  alt={fig.nom}
                />
              )}
              <CardContent>
                <Typography variant="h6">{fig.nom}</Typography>
              </CardContent>

              <Collapse in={expandedFigure?.id === fig.id} timeout="auto" unmountOnExit>
                <CardContent>
                  <Typography variant="body2" paragraph>
                    {fig.descriptif}
                  </Typography>
                  {fig.video_url && (
                    <video
                      src={fig.video_url}
                      controls
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        marginTop: "10px"
                      }}
                    />
                  )}

                  <Button
                    variant={isInProgress(fig.id) ? "outlined" : "contained"}
                    color={isInProgress(fig.id) ? "success" : "primary"}
                    startIcon={isInProgress(fig.id) ? <CheckIcon /> : <AddIcon />}
                    onClick={(e) => handleAddToProgress(e, fig.id)}
                    disabled={isInProgress(fig.id)}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    {isInProgress(fig.id) ? 'Déjà dans votre liste' : 'Ajouter à ma liste'}
                  </Button>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default FiguresPage;