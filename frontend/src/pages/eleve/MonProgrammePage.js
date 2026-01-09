import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  LinearProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PlaylistAdd as PlaylistAddIcon, Info as InfoIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { api } from '../../utils/api'; // Import explicite pour usage direct
import { useAuth } from '../../contexts/AuthContext';
import { 
  useProgressionEleve, 
  useProgrammesAssignes, 
  useProgrammeDetails,
  usePersonalProgrammeMutations
} from '../../hooks/useProgrammes';
import { useSuggestions } from '../../hooks/useSuggestions';

// Import des composants génériques
import { ProgressionGlobale, DisciplineSection, ProgrammeSelector } from '../../components/programmes';
import { FigureDetailDialog } from '../../components/figures';
import PersonalProgrammeDialog from '../../components/programmes/PersonalProgrammeDialog';
import AddFiguresDialog from '../../components/programmes/AddFiguresDialog';

function MonProgrammePage() {
  // 1. Hooks de base
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 2. États locaux
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('personnel');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addFiguresDialogState, setAddFiguresDialogState] = useState({ open: false, discipline: null });
  const [figureDialog, setFigureDialog] = useState({ open: false, figure: null });

  // 3. Hooks de données
  const { progression, loading: loadingProgression, error: errorProgression } = useProgressionEleve(user?.id);
  const { programmes: programmesAssignes, loading: loadingProgrammes, refetch: refetchProgrammes } = useProgrammesAssignes();
  const { programme: selectedProgramme, loading: loadingDetails, refetch: refetchDetails } = useProgrammeDetails(
    selectedProgrammeId !== 'personnel' ? selectedProgrammeId : null
  );
  const { createProgramme, updateProgramme, deleteProgramme, removeFigure } = usePersonalProgrammeMutations();
  const { suggestions, loading: loadingSuggestions, error: errorSuggestions, accepterSuggestion, dismisserSuggestion } = useSuggestions();

  // 4. Calculs préliminaires
  const realPersonalProgramme = useMemo(() => {
    return programmesAssignes.find(p => p.type === 'perso_cree' || p.nom === 'Programme Personnel');
  }, [programmesAssignes]);

  // 5. Effets de redirection et navigation
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (selectedProgrammeId === 'personnel' && realPersonalProgramme && !window.hasAutoSwitched) {
        setSelectedProgrammeId(realPersonalProgramme.id);
        window.hasAutoSwitched = true;
    }
  }, [realPersonalProgramme, selectedProgrammeId]);

  // 6. Calculs de permission
  const isPersonalCreated = useMemo(() => {
    if (selectedProgrammeId === 'personnel') return false;
    const prog = programmesAssignes.find(p => p.id === selectedProgrammeId);
    return prog?.type === 'perso_cree';
  }, [selectedProgrammeId, programmesAssignes]);

  const canRemove = useMemo(() => {
    if (selectedProgrammeId === 'personnel') return true; // On peut supprimer sa progression globale
    const prog = programmesAssignes.find(p => p.id === selectedProgrammeId);
    return prog?.type === 'perso_cree';
  }, [selectedProgrammeId, programmesAssignes]);

  // 7. Calcul principal : Liste des figures à afficher
  const figuresToDisplay = useMemo(() => {
    if (selectedProgrammeId === 'personnel') {
      const allFiguresMap = new Map();

      // 1. Ajouter les figures avec progression active
      if (progression) {
        progression.forEach(p => {
          allFiguresMap.set(p.figure_id, p);
        });
      }

      // 2. Ajouter les figures des programmes assignés (non commencées)
      if (programmesAssignes) {
        programmesAssignes.forEach(prog => {
          if (prog.ProgrammesFigures) {
            prog.ProgrammesFigures.forEach(pf => {
              const fig = pf.Figure;
              if (fig && !allFiguresMap.has(fig.id)) {
                allFiguresMap.set(fig.id, {
                  ...fig,
                  figure_id: fig.id,
                  figure_nom: fig.nom,
                  figure_description: fig.description || fig.descriptif,
                  discipline: fig.Discipline,
                  etapes: [], // Pas de progression
                  statut: 'non_commence'
                });
              }
            });
          }
        });
      }

      return Array.from(allFiguresMap.values());
    }

    if (selectedProgramme && selectedProgramme.ProgrammesFigures) {
      return selectedProgramme.ProgrammesFigures.map(pf => {
        const figure = pf.Figure;
        const existingProgression = progression?.find(p => p.figure_id === figure.id);

        return {
          ...figure,
          etapes: existingProgression ? existingProgression.etapes : [],
          statut: existingProgression ? 'en_cours' : 'non_commence',
          discipline: figure.Discipline,
          etapesTheoriques: figure.etapes || [] 
        };
      });
    }

    return [];
  }, [selectedProgrammeId, progression, selectedProgramme]);

  // 8. Calculs dérivés de la liste des figures
  const figuresParDiscipline = useMemo(() => {
    return figuresToDisplay.reduce((acc, fig) => {
      const disciplineNom = fig.discipline?.nom || fig.Discipline?.nom || 'Sans discipline';
      if (!acc[disciplineNom]) {
        acc[disciplineNom] = [];
      }
      acc[disciplineNom].push(fig);
      return acc;
    }, {});
  }, [figuresToDisplay]);

  const existingFigureIds = useMemo(() => {
    return figuresToDisplay.map(f => f.id || f.figure_id).filter(Boolean);
  }, [figuresToDisplay]);

  const stats = useMemo(() => {
    if (!figuresToDisplay || figuresToDisplay.length === 0) return { validated: 0, total: 0 };
    let totalEtapes = 0;
    let validatedEtapes = 0;
    figuresToDisplay.forEach(fig => {
      const etapesList = fig.etapes && fig.etapes.length > 0 ? fig.etapes : (fig.etapesTheoriques || []);
      totalEtapes += etapesList.length;
      if (fig.etapes) {
         validatedEtapes += fig.etapes.filter(e => e.statut === 'valide').length;
      }
    });
    return {
      validated: validatedEtapes,
      total: totalEtapes,
      percentage: totalEtapes > 0 ? Math.round((validatedEtapes / totalEtapes) * 100) : 0
    };
  }, [figuresToDisplay]);

  // 9. Handlers
  const handleCreate = async (data) => {
    try {
      const newProg = await createProgramme(data);
      await refetchProgrammes();
      setCreateDialogOpen(false);
      setSelectedProgrammeId(newProg.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateProgramme(selectedProgrammeId, data);
      await refetchProgrammes();
      setEditDialogOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      try {
        await deleteProgramme(selectedProgrammeId);
        await refetchProgrammes();
        setSelectedProgrammeId('personnel');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRemoveFigure = async (figure) => {
    const isGlobalView = selectedProgrammeId === 'personnel';
    const message = isGlobalView 
      ? `Attention: Cela supprimera tout votre historique de progression sur la figure "${figure.nom}". Continuer ?`
      : `Retirer ${figure.nom} du programme ?`;

    if (window.confirm(message)) {
      try {
        if (isGlobalView) {
            await api.delete(`/api/progression/figure/${figure.id}`);
            window.location.reload();
        } else {
            await removeFigure(selectedProgrammeId, figure.id);
            await refetchDetails();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFiguresAdded = async () => {
     await refetchDetails();
  };

  const handleAccepterSuggestion = async (figureId, figureName) => {
    const result = await accepterSuggestion(figureId);
    if (result.success) {
      console.log(`${figureName} ajoutée à ton programme personnel`);
      await refetchProgrammes();
      if (selectedProgrammeId !== 'personnel') {
        await refetchDetails();
      }
    }
  };

  const handleFigureClick = (clickedFigureOrId) => {
    if (typeof clickedFigureOrId === 'number') {
      const figureData = figuresToDisplay?.find(p =>
        p.id === clickedFigureOrId ||
        p.figure_id === clickedFigureOrId ||
        p.Figure?.id === clickedFigureOrId
      );
      if (figureData) {
        const figure = figureData.Figure || figureData;
        setFigureDialog({ open: true, figure });
      }
    } else {
      setFigureDialog({ open: true, figure: clickedFigureOrId });
    }
  };

  // Helpers UI
  const getBadgeColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'default';
  };

  const getBadgeText = (score) => {
    if (score >= 80) return 'Tu es prêt !';
    if (score >= 60) return 'Bientôt prêt';
    return `${Math.round(score)}%`;
  };

  const loading = loadingProgression || loadingProgrammes || (selectedProgrammeId !== 'personnel' && loadingDetails);

  if (loading && !figuresToDisplay.length) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (errorProgression) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">{errorProgression}</Alert></Container>;
  }
  
  const selectOptions = [
    { id: 'personnel', nom: 'Vue Globale (Toutes mes figures)', type: 'personnel' },
    ...(programmesAssignes || [])
  ];

  return (
    <Container sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
      {/* En-tête */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} mb={3} gap={2}>
        <Typography variant="h3" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' }, fontWeight: 'bold' }}>
          Mon Programme
        </Typography>
        
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" justifyContent={{ xs: 'center', md: 'flex-end' }}>
          <ProgrammeSelector
            programmes={selectOptions}
            selectedId={selectedProgrammeId}
            onChange={setSelectedProgrammeId}
            userRole="eleve"
            sx={{ minWidth: { xs: '100%', sm: 250 } }}
          />
          
          <Tooltip title="Créer un nouveau programme">
            <IconButton onClick={() => setCreateDialogOpen(true)} color="primary" sx={{ bgcolor: 'action.hover' }}>
              <AddIcon />
            </IconButton>
          </Tooltip>

          {isPersonalCreated && (
            <>
              <Tooltip title="Modifier le programme">
                <IconButton onClick={() => setEditDialogOpen(true)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ajouter des figures">
                <IconButton onClick={() => setAddFiguresDialogState({ open: true, discipline: null })} color="secondary">
                  <PlaylistAddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer le programme">
                <IconButton onClick={handleDelete} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* Progression */}
      <ProgressionGlobale
        figuresValidees={stats.validated}
        figuresTotal={stats.total}
        disciplinesCount={Object.keys(figuresParDiscipline).length}
        variant="detailed"
        sx={{ mb: 4 }}
      />

      {/* Suggestions */}
      {!loadingSuggestions && suggestions.length > 0 && selectedProgrammeId === 'personnel' && (
        <Box mb={4} p={3} component={Card} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom display="flex" alignItems="center" gap={1} sx={{ color: 'text.primary', fontWeight: 600 }}>
            💡 Suggestions pour toi
            <Tooltip title="Ces figures te sont recommandées car tu as validé la plupart de leurs exercices prérequis">
              <InfoIcon fontSize="small" color="primary" />
            </Tooltip>
          </Typography>

          <Typography variant="body2" color="textSecondary" gutterBottom mb={2}>
            Ces figures sont recommandées en fonction de ta progression
          </Typography>

          {errorSuggestions && <Alert severity="error" sx={{ mb: 2 }}>{errorSuggestions}</Alert>}

          <Grid container spacing={2}>
            {suggestions.map(suggestion => (
              <Grid item xs={12} sm={6} md={4} key={suggestion.figure_id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {suggestion.nom}
                      </Typography>
                      <Tooltip title="Masquer">
                        <IconButton size="small" onClick={() => dismisserSuggestion(suggestion.figure_id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {suggestion.descriptif}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={getBadgeText(suggestion.score_preparation)}
                        color={getBadgeColor(suggestion.score_preparation)}
                        size="small"
                      />
                      <Typography variant="caption" color="textSecondary">
                        {suggestion.nb_exercices_valides}/{suggestion.nb_exercices_total} prérequis
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={suggestion.score_preparation}
                      color={getBadgeColor(suggestion.score_preparation)}
                      sx={{ height: 6, borderRadius: 1, mb: 2 }}
                    />
                    
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleAccepterSuggestion(suggestion.figure_id, suggestion.nom)}
                    >
                      Ajouter
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Liste des Figures */}
      {figuresToDisplay.length === 0 ? (
         <Box textAlign="center" py={4}>
           <Alert severity="info" sx={{ mb: 2 }}>
             {selectedProgrammeId === 'personnel' 
               ? "Aucune figure dans votre progression personnelle. Commencez par explorer les figures !"
               : "Ce programme ne contient aucune figure."}
           </Alert>
           {isPersonalCreated && (
             <Button variant="contained" startIcon={<PlaylistAddIcon />} onClick={() => setAddFiguresDialogState({ open: true, discipline: null })}>
               Ajouter des figures
             </Button>
           )}
         </Box>
      ) : (
        Object.entries(figuresParDiscipline).map(([disciplineNom, figures]) => (
          <DisciplineSection
            key={disciplineNom}
            disciplineNom={disciplineNom}
            figures={figures}
            progressions={{}} 
            onFigureClick={handleFigureClick}
            showProgress={true}
            showActions={canRemove} 
            editMode={true} 
            onRemove={canRemove ? handleRemoveFigure : undefined}
            onAddFigures={isPersonalCreated ? () => setAddFiguresDialogState({ open: true, discipline: disciplineNom }) : undefined}
            sx={{ mb: 4 }}
          />
        ))
      )}

      {/* Dialogs */}
      <FigureDetailDialog
        open={figureDialog.open}
        figure={figureDialog.figure}
        onClose={() => setFigureDialog({ open: false, figure: null })}
        showEtapesProgression={true}
        showJournal={true}
        editable={false}
        progression={progression?.find(p => p.figure_id === figureDialog.figure?.id)}
      />

      <PersonalProgrammeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreate}
      />

      <PersonalProgrammeDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleUpdate}
        initialData={selectedProgramme}
      />

      <AddFiguresDialog
        open={addFiguresDialogState.open}
        disciplineNom={addFiguresDialogState.discipline}
        onClose={() => setAddFiguresDialogState({ ...addFiguresDialogState, open: false })}
        programmeId={selectedProgrammeId}
        existingFigureIds={existingFigureIds}
        onSuccess={handleFiguresAdded}
        apiUrl={`/api/progression/programmes/${selectedProgrammeId}/figures`}
      />
    </Container>
  );
}

export default MonProgrammePage;