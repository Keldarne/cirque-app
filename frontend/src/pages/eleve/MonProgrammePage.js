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
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PlaylistAdd as PlaylistAddIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  useProgressionEleve, 
  useProgrammesAssignes, 
  useProgrammeDetails,
  usePersonalProgrammeMutations
} from '../../hooks/useProgrammes';

// Import des composants génériques
import { ProgressionGlobale, DisciplineSection, ProgrammeSelector } from '../../components/programmes';
import { FigureDetailDialog } from '../../components/figures';
import PersonalProgrammeDialog from '../../components/programmes/PersonalProgrammeDialog';
import AddFiguresDialog from '../../components/programmes/AddFiguresDialog';

function MonProgrammePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // État du sélecteur de programme
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('personnel');
  
  // Dialogs management
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addFiguresDialogOpen, setAddFiguresDialogOpen] = useState(false);

  // 1. Charger la progression globale de l'élève
  const { progression, loading: loadingProgression, error: errorProgression } = useProgressionEleve(user?.id);

  // 2. Charger la liste des programmes assignés
  const { programmes: programmesAssignes, loading: loadingProgrammes, refetch: refetchProgrammes } = useProgrammesAssignes();

  // 3. Charger les détails du programme sélectionné
  const { programme: selectedProgramme, loading: loadingDetails } = useProgrammeDetails(
    selectedProgrammeId !== 'personnel' ? selectedProgrammeId : null
  );

  // Mutations
  const { createProgramme, updateProgramme, deleteProgramme, removeFigure } = usePersonalProgrammeMutations();

  // Dialog détails figure
  const [figureDialog, setFigureDialog] = useState({ open: false, figure: null });

  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Is current program owned by user?
  const isPersonalCreated = useMemo(() => {
    if (selectedProgrammeId === 'personnel') return false;
    // Check if in the list it is marked as 'perso_cree'
    const prog = programmesAssignes.find(p => p.id === selectedProgrammeId);
    return prog?.type === 'perso_cree';
  }, [selectedProgrammeId, programmesAssignes]);

  // Construire la liste des figures à afficher
  const figuresToDisplay = useMemo(() => {
    if (selectedProgrammeId === 'personnel') {
      return progression || [];
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


  // Handlers
  const handleCreate = async (data) => {
    try {
      const newProg = await createProgramme(data);
      await refetchProgrammes();
      setCreateDialogOpen(false);
      setSelectedProgrammeId(newProg.id); // Switch to new program
    } catch (err) {
      // Error handled in hook/dialog usually, or add snackbar here
      console.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateProgramme(selectedProgrammeId, data);
      await refetchProgrammes(); // To update name in selector
      // Need to refetch details too? Yes, but useProgrammeDetails handles it if key changes or we trigger a refetch?
      // Actually useProgrammeDetails relies on selectedProgrammeId.
      // Ideally we should force refetch details. For now, page reload or simple re-render might work if we invalidate cache.
      // But let's assume simple update for now.
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
    if (window.confirm(`Retirer ${figure.nom} du programme ?`)) {
      try {
        await removeFigure(selectedProgrammeId, figure.id);
        // We need to refresh the displayed figures.
        // Quickest way is to force reload of details. 
        // Since useProgrammeDetails doesn't expose refetch, we might need to toggle ID or improve hook.
        // For now, let's just reload page or rely on re-mount.
        // BETTER: Create a refresh trigger context or similar.
        window.location.reload(); // Temporary dirty fix to ensure UI sync
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFiguresAdded = () => {
     window.location.reload(); // Temporary dirty fix
  };

  // ... (rest of render logic remains same mostly)
  // Ouvrir le dialog de détails d'une figure
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

  const handleCloseFigureDialog = () => {
    setFigureDialog({ open: false, figure: null });
  };

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

  const calculateStats = () => {
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
  };

  const stats = calculateStats();
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
    { id: 'personnel', nom: 'Mon Programme Personnel', type: 'personnel' },
    ...(programmesAssignes || [])
  ];

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      {/* En-tête avec Sélecteur et Actions */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', md: 'center' }} mb={3} gap={2}>
        <Typography variant="h3">
          Mon Programme
        </Typography>
        
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <ProgrammeSelector
            programmes={selectOptions}
            selectedId={selectedProgrammeId}
            onChange={setSelectedProgrammeId}
            userRole="eleve"
            sx={{ minWidth: 250 }}
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
                <IconButton onClick={() => setAddFiguresDialogOpen(true)} color="secondary">
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

      {/* Progression globale */}
      <ProgressionGlobale
        figuresValidees={stats.validated}
        figuresTotal={stats.total}
        disciplinesCount={Object.keys(figuresParDiscipline).length}
        variant="detailed"
        sx={{ mb: 4 }}
      />

      {figuresToDisplay.length === 0 ? (
         <Box textAlign="center" py={4}>
           <Alert severity="info" sx={{ mb: 2 }}>
             {selectedProgrammeId === 'personnel' 
               ? "Aucune figure dans votre progression personnelle. Commencez par explorer les figures !"
               : "Ce programme ne contient aucune figure."}
           </Alert>
           {isPersonalCreated && (
             <Button variant="contained" startIcon={<PlaylistAddIcon />} onClick={() => setAddFiguresDialogOpen(true)}>
               Ajouter des figures
             </Button>
           )}
         </Box>
      ) : (
        /* Sections par discipline */
        Object.entries(figuresParDiscipline).map(([disciplineNom, figures]) => (
          <DisciplineSection
            key={disciplineNom}
            disciplineNom={disciplineNom}
            figures={figures}
            progressions={{}} 
            onFigureClick={handleFigureClick}
            showProgress={true}
            showActions={isPersonalCreated} // Show remove button if personal program
            editMode={isPersonalCreated}
            onRemove={isPersonalCreated ? handleRemoveFigure : undefined}
            sx={{ mb: 4 }}
          />
        ))
      )}

      {/* Dialogs */}
      <FigureDetailDialog
        open={figureDialog.open}
        figure={figureDialog.figure}
        onClose={handleCloseFigureDialog}
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
        open={addFiguresDialogOpen}
        onClose={() => setAddFiguresDialogOpen(false)}
        programmeId={selectedProgrammeId}
        onSuccess={handleFiguresAdded}
        apiUrl={`/api/progression/programmes/${selectedProgrammeId}/figures`}
      />
    </Container>
  );
}

export default MonProgrammePage;
