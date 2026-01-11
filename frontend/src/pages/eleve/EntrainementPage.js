import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Card,
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

import { useEntrainementFigure } from '../../hooks/useEntrainementFigure';
import EtapesProgressionList from '../../components/figures/EtapesProgressionList';
import JournalProgression from '../../components/figures/JournalProgression';
import ProgressBar from '../../components/common/ProgressBar';
import ModeSelector from '../../components/entrainement/ModeSelector';

/**
 * Page d'entrée pour le mode entraînement
 * 
 * Refonte pour cohérence visuelle avec FigureDetailDialog
 * - Colonne gauche : Action principale + Résumé visuel
 * - Colonne droite : Onglets (Détails, Étapes, Journal)
 */
function EntrainementPage() {
  const navigate = useNavigate();
  const { figureId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabIndex, setTabIndex] = useState(1); // 0: Détails, 1: Étapes, 2: Journal
  const [selectedEtapes, setSelectedEtapes] = useState([]); // Pour le filtrage des étapes d'entraînement

  const { figure, etapes, loading, error } = useEntrainementFigure(figureId);

  // Import dynamique si nécessaire, ou on assume que ModeSelector est importé en haut
  // J'ajoute l'import manquant dans les dépendances
  
  const handleStartSession = (mode) => {
    // Si des étapes sont sélectionnées, on les passe au state, sinon null (tout)
    const sessionState = { 
      mode,
      selectedStepIds: selectedEtapes.length > 0 ? selectedEtapes : null
    };
    navigate(`/entrainement/session/${figureId}`, { state: sessionState });
  };

  const handleToggleStep = (etapeId) => {
    setSelectedEtapes(prev => {
      if (prev.includes(etapeId)) {
        return prev.filter(id => id !== etapeId);
      } else {
        return [...prev, etapeId];
      }
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !figure) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || "Figure introuvable"}</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Retour</Button>
      </Container>
    );
  }

  // Préparation des données pour les composants partagés
  // Adapter les données pour EtapesProgressionList
  const etapesTheoriques = etapes.map(p => p.etape).sort((a, b) => a.ordre - b.ordre);
  const etapesUtilisateur = etapes.map(p => ({
    etape_numero: p.etape.ordre,
    valide: p.statut === 'valide',
    date_validation: p.date_validation,
    statut: p.statut,
    descriptif: p.etape.description
  }));

  // Calcul progression
  const totalEtapes = etapes.length;
  const etapesValidees = etapesUtilisateur.filter(e => e.valide).length;
  const progressPercent = totalEtapes > 0 ? Math.round((etapesValidees / totalEtapes) * 100) : 0;

  // Adapter les données pour JournalProgression
  const progressionPourJournal = {
    EtapesUtilisateurs: etapesUtilisateur,
    date_derniere_validation: etapesUtilisateur
      .filter(e => e.valide)
      .sort((a, b) => new Date(b.date_validation) - new Date(a.date_validation))[0]?.date_validation
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      {/* Header avec Navigation */}
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {figure.nom}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {figure.discipline?.nom || 'Discipline inconnue'} • Niveau {figure.difficulty_level || 1}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          {/* COLONNE GAUCHE : Action & Résumé */}
          <Grid item xs={12} md={4}>
            {/* Carte d'action principale */}
            <Card elevation={3} sx={{ mb: 3, position: 'sticky', top: 80 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <FitnessCenterIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  Prêt à s'entraîner ?
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Lancez une session pour valider vos étapes et maintenir votre niveau.
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                   <ProgressBar 
                    value={progressPercent} 
                    label={`${etapesValidees}/${totalEtapes} étapes maîtrisées`} 
                  />
                </Box>

                {selectedEtapes.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                    <strong>{selectedEtapes.length}</strong> étape{selectedEtapes.length > 1 ? 's' : ''} sélectionnée{selectedEtapes.length > 1 ? 's' : ''} pour cette session.
                  </Alert>
                )}

                <ModeSelector onSelectMode={handleStartSession} />

              </CardContent>
            </Card>

            {/* Media (Image/Video) si présent - Affiché ici sur Desktop */}
            {!isMobile && (figure.image_url || figure.video_url) && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, overflow: 'hidden' }}>
                {figure.image_url && (
                  <Box
                    component="img"
                    src={figure.image_url}
                    alt={figure.nom}
                    sx={{ width: '100%', borderRadius: 1, mb: figure.video_url ? 2 : 0 }}
                  />
                )}
                {figure.video_url && (
                   <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                    <video
                      src={figure.video_url}
                      controls
                      style={{ width: '100%', display: 'block' }}
                    />
                  </Box>
                )}
              </Paper>
            )}
          </Grid>

          {/* COLONNE DROITE : Contenu Détaillé */}
          <Grid item xs={12} md={8}>
            <Paper elevation={1} sx={{ minHeight: 500 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabIndex} 
                  onChange={handleTabChange} 
                  variant={isMobile ? "scrollable" : "fullWidth"}
                  scrollButtons="auto"
                >
                  <Tab label="Détails" />
                  <Tab label={`Étapes (${etapes.length})`} />
                  <Tab label="Journal & Stats" />
                </Tabs>
              </Box>

              <Box sx={{ p: 3 }}>
                {/* ONGLET 0 : DÉTAILS */}
                {tabIndex === 0 && (
                  <Box>
                    <Typography variant="h5" gutterBottom color="primary">
                      Description
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                      {figure.descriptif || figure.description || 'Aucune description détaillée disponible.'}
                    </Typography>

                    {/* Media affiché ici sur Mobile uniquement */}
                    {isMobile && (figure.image_url || figure.video_url) && (
                      <Box sx={{ mt: 3 }}>
                        {figure.image_url && (
                          <Box
                            component="img"
                            src={figure.image_url}
                            alt={figure.nom}
                            sx={{ width: '100%', borderRadius: 2, mb: 2 }}
                          />
                        )}
                         {figure.video_url && (
                          <video
                            src={figure.video_url}
                            controls
                            style={{ width: '100%', borderRadius: 8 }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {/* ONGLET 1 : ÉTAPES */}
                {tabIndex === 1 && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Sélectionnez les étapes que vous souhaitez travailler spécifiquement aujourd'hui, ou lancez la session directement pour tout réviser.
                    </Alert>
                    <EtapesProgressionList
                      etapes={etapesTheoriques}
                      etapesUtilisateur={etapesUtilisateur}
                      editable={false}
                      showCheckboxes={true}
                      selectionMode={true}
                      selectedIds={selectedEtapes}
                      onToggleSelection={handleToggleStep}
                    />
                  </Box>
                )}

                {/* ONGLET 2 : JOURNAL */}
                {tabIndex === 2 && (
                  <JournalProgression
                    figure={{
                      ...figure,
                      etapes: etapes // On passe les étapes fusionnées (qui contiennent les IDs réels)
                    }}
                    progression={progressionPourJournal}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default EntrainementPage;

