import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Container, Typography, Box, Button, Paper, Chip,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, List, ListItem,
  ListItemText, Checkbox, Alert, CircularProgress,
  Card, CardContent, LinearProgress, Grid,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack, Edit as EditIcon, Add as AddIcon,
  Delete as DeleteIcon, ArrowUpward, ArrowDownward,
  Save as SaveIcon
} from '@mui/icons-material';
import { api } from '../../utils/api';
import { calculateDecayLevel } from '../../utils/memoryDecay';

function ProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addFiguresDialog, setAddFiguresDialog] = useState({ open: false, discipline: null });
  const [addDisciplineDialog, setAddDisciplineDialog] = useState(false);
  const [progressions, setProgressions] = useState({});
  const [detailsDialog, setDetailsDialog] = useState({ open: false, figure: null, figureProgressions: [] });

  const loadProgressions = useCallback(async (prog) => {
    if (!prog?.Assignations || prog.Assignations.length === 0) return;

    const progressionsMap = {};

    // Pour chaque élève assigné, charger ses progressions
    for (const assignation of prog.Assignations) {
      try {
        const response = await api.get(`/api/progression/utilisateur/${assignation.eleve_id}`);
        const data = await response.json();

        // Créer un map figureId -> progression pour cet élève
        const eleveProgressions = {};
        if (Array.isArray(data)) {
          data.forEach(progression => {
            if (progression.Figure) {
              eleveProgressions[progression.Figure.id] = progression;
            }
          });
        }

        progressionsMap[assignation.eleve_id] = eleveProgressions;
      } catch (error) {
        console.error(`Erreur chargement progressions élève ${assignation.eleve_id}:`, error);
      }
    }

    setProgressions(progressionsMap);
  }, []);

  const loadProgramme = useCallback(async () => {
    try {
      const response = await api.get(`/api/prof/programmes/${id}`);
      const data = await response.json();
      setProgramme(data.programme);

      // Charger les progressions des élèves assignés
      await loadProgressions(data.programme);

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement programme:', error);
      setLoading(false);
    }
  }, [id, loadProgressions]);

  // Charger le programme et les progressions
  useEffect(() => {
    loadProgramme();
  }, [id, loadProgramme]);

  // Regrouper figures par discipline avec useMemo pour optimisation
  const figuresParDiscipline = useMemo(() => {
    return programme?.ProgrammesFigures?.reduce((acc, pf) => {
      const disciplineNom = pf.Figure?.Discipline?.nom || 'Sans discipline';
      if (!acc[disciplineNom]) {
        acc[disciplineNom] = [];
      }
      acc[disciplineNom].push(pf);
      return acc;
    }, {}) || {};
  }, [programme?.ProgrammesFigures]);

  // Calculer les IDs existants pour griser dans la modale
  const existingFigureIds = useMemo(() => {
    return programme?.ProgrammesFigures?.map(pf => pf.figure_id) || [];
  }, [programme]);

  // Activer automatiquement le mode édition si le programme est vide
  useEffect(() => {
    if (programme && Object.entries(figuresParDiscipline).length === 0) {
      setEditMode(true);
    }
  }, [programme, figuresParDiscipline]);

  // Calculer progression moyenne pour une figure
  const calculateFigureProgress = (figureId) => {
    const elevesAvecProgression = Object.values(progressions)
      .filter(eleveProgs => eleveProgs[figureId])
      .map(eleveProgs => eleveProgs[figureId]);

    if (elevesAvecProgression.length === 0) return 0;

    const totalProgress = elevesAvecProgression.reduce((sum, progression) => {
      const validatedSteps = progression.EtapesUtilisateurs?.filter(e => e.valide).length || 0;
      const totalSteps = progression.Figure?.nb_etapes || 1;
      return sum + (validatedSteps / totalSteps) * 100;
    }, 0);

    return Math.round(totalProgress / elevesAvecProgression.length);
  };

  const handleRetirerFigure = async (figureId) => {
    if (!window.confirm('Retirer cette figure du programme ?')) return;

    try {
      await api.delete(`/api/prof/programmes/${id}/figures/${figureId}`);
      loadProgramme();
    } catch (error) {
      console.error('Erreur retrait figure:', error);
    }
  };

  const handleReorderFigure = async (disciplineNom, index, direction) => {
    const figures = figuresParDiscipline[disciplineNom];
    if (!figures) return;

    const newFigures = [...figures];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFigures.length) return;

    // Swap
    [newFigures[index], newFigures[targetIndex]] = [newFigures[targetIndex], newFigures[index]];

    // Recalculer les ordres globaux
    const figureOrders = newFigures.map((pf, idx) => ({
      figureId: pf.figure_id,
      ordre: pf.ordre - index + idx
    }));

    try {
      await api.put(`/api/prof/programmes/${id}/reorder`, { figureOrders });
      loadProgramme();
    } catch (error) {
      console.error('Erreur réordonnancement:', error);
    }
  };

  const handleOpenDetails = (figure, figureId) => {
    // Récupérer toutes les progressions des élèves pour cette figure
    const figureProgressions = Object.entries(progressions).map(([eleveId, eleveProgs]) => {
      const progression = eleveProgs[figureId];
      if (!progression) return null;

      // Trouver l'élève dans les assignations
      const assignation = programme?.Assignations?.find(a => a.eleve_id === parseInt(eleveId));

      return {
        eleveId: parseInt(eleveId),
        eleveNom: assignation?.Eleve?.nom || `Élève ${eleveId}`,
        elevePrenom: assignation?.Eleve?.prenom || '',
        progression
      };
    }).filter(Boolean);

    setDetailsDialog({
      open: true,
      figure,
      figureProgressions
    });
  };

  if (loading) return (
    <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/prof/programmes')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">{programme?.nom}</Typography>
          {programme?.est_modele && <Chip label="Modèle" color="primary" />}
          {programme?.Assignations && programme.Assignations.length > 0 && (
            <Chip
              label={`${programme.Assignations.length} élève${programme.Assignations.length > 1 ? 's' : ''}`}
              color="secondary"
            />
          )}
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
          >
            Modifier Infos
          </Button>
          <Button
            variant={editMode ? "contained" : "outlined"}
            color={editMode ? "success" : "primary"}
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Mode Consultation" : "Mode Édition"}
          </Button>
        </Box>
      </Box>

      {/* Description */}
      {programme?.description && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {programme.description}
        </Alert>
      )}

      {/* Message si programme vide (en mode édition) */}
      {editMode && Object.entries(figuresParDiscipline).length === 0 && (
        <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Ce programme est vide
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Commencez par ajouter une discipline, puis ajoutez des figures à cette discipline.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setAddDisciplineDialog(true)}
          >
            Ajouter une discipline
          </Button>
        </Paper>
      )}

      {/* Bouton Ajouter Discipline en mode édition (si programme non vide) */}
      {editMode && Object.entries(figuresParDiscipline).length > 0 && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddDisciplineDialog(true)}
          >
            Ajouter une nouvelle discipline
          </Button>
        </Box>
      )}

      {/* Figures par discipline */}
      {Object.entries(figuresParDiscipline).map(([disciplineNom, figures]) => (
        <Paper key={disciplineNom} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">{disciplineNom}</Typography>
            {editMode && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddFiguresDialog({ open: true, discipline: disciplineNom })}
              >
                Ajouter des figures
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            {figures.map((pf, index) => {
              const progress = calculateFigureProgress(pf.figure_id);
              const decayInfo = calculateDecayLevel(
                Object.values(progressions)
                  .map(eleveProgs => eleveProgs[pf.figure_id])
                  .filter(Boolean)[0]?.date_derniere_validation // Prendre la première progression comme référence
              );

              return (
                <Grid item xs={12} sm={6} md={4} key={pf.figure_id}>
                  <Card
                    sx={{
                      height: '100%',
                      border: `2px solid ${theme.palette[decayInfo.color]?.main || theme.palette.grey[300]}`,
                      bgcolor: decayInfo.level === 'fresh' ? 'rgba(76, 175, 80, 0.05)' :
                               decayInfo.level === 'warning' ? 'rgba(255, 152, 0, 0.05)' :
                               decayInfo.level === 'critical' ? 'rgba(244, 67, 54, 0.05)' :
                               'transparent'
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {pf.Figure?.nom}
                        </Typography>
                        {editMode && (
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            <IconButton
                              size="small"
                              disabled={index === 0}
                              onClick={() => handleReorderFigure(disciplineNom, index, 'up')}
                            >
                              <ArrowUpward fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              disabled={index === figures.length - 1}
                              onClick={() => handleReorderFigure(disciplineNom, index, 'down')}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRetirerFigure(pf.figure_id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                        {pf.Figure?.descriptif || 'Aucune description'}
                      </Typography>

                      {/* Progression moyenne */}
                      <Box sx={{ mb: 1 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Progression moyenne
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: progress >= 80 ? 'success.main' : progress >= 50 ? 'warning.main' : 'error.main'
                            }
                          }}
                        />
                      </Box>

                      {/* État de mémoire */}
                      {decayInfo.level !== 'not_validated' && decayInfo.message && (
                        <Chip
                          label={decayInfo.message}
                          size="small"
                          sx={{
                            bgcolor: theme.palette[decayInfo.color]?.main || theme.palette.grey.main,
                            color: 'white',
                            fontWeight: 'bold',
                            mt: 1
                          }}
                        />
                      )}

                      {/* Bouton Voir Détails */}
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => handleOpenDetails(pf.Figure, pf.figure_id)}
                      >
                        Voir Détails par Élève
                      </Button>

                      {/* Ordre */}
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Ordre: {pf.ordre}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      ))}

      {/* Dialog Modifier */}
      <ModifierProgrammeDialog
        open={editDialogOpen}
        programme={programme}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={loadProgramme}
        programmeId={id}
      />

      {/* Dialog Ajouter Figures */}
      <AjouterFiguresDialog
        open={addFiguresDialog.open}
        discipline={addFiguresDialog.discipline}
        programmeId={id}
        existingFigureIds={existingFigureIds}
        onClose={() => setAddFiguresDialog({ open: false, discipline: null })}
        onSuccess={loadProgramme}
      />

      {/* Dialog Détails Figure */}
      <DetailsDialog
        open={detailsDialog.open}
        figure={detailsDialog.figure}
        figureProgressions={detailsDialog.figureProgressions}
        onClose={() => setDetailsDialog({ open: false, figure: null, figureProgressions: [] })}
      />

      {/* Dialog Ajouter Discipline */}
      <AjouterDisciplineDialog
        open={addDisciplineDialog}
        onClose={() => setAddDisciplineDialog(false)}
        onSelectDiscipline={(disciplineNom) => {
          setAddDisciplineDialog(false);
          setAddFiguresDialog({ open: true, discipline: disciplineNom });
        }}
      />
    </Container>
  );
}

function ModifierProgrammeDialog({ open, programme, onClose, onSuccess, programmeId }) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (programme) {
      setNom(programme.nom);
      setDescription(programme.description || '');
    }
  }, [programme]);

  const handleSubmit = async () => {
    try {
      await api.put(`/api/prof/programmes/${programmeId}`, {
        nom,
        description
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur modification:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>Modifier le programme</DialogTitle>
      <DialogContent>
        <TextField
          label="Nom"
          fullWidth
          margin="normal"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained">
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AjouterFiguresDialog({ open, discipline, programmeId, existingFigureIds = [], onClose, onSuccess }) {
  const [figures, setFigures] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const loadFiguresDiscipline = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/figures');
      const data = await response.json();
      const filtered = data.filter(f => f.Discipline?.nom === discipline);
      setFigures(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement figures:', error);
      setLoading(false);
    }
  }, [discipline]);

  useEffect(() => {
    if (open && discipline) {
      loadFiguresDiscipline();
    }
  }, [open, discipline, loadFiguresDiscipline]);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;

    try {
      await api.post(`/api/prof/programmes/${programmeId}/figures`, {
        figureIds: selectedIds
      });
      onSuccess();
      onClose();
      setSelectedIds([]);
    } catch (error) {
      console.error('Erreur ajout figures:', error);
    }
  };

  const handleToggleFigure = (figureId) => {
    if (existingFigureIds.includes(figureId)) return; // Empêcher toggle si déjà présent

    if (selectedIds.includes(figureId)) {
      setSelectedIds(selectedIds.filter(id => id !== figureId));
    } else {
      setSelectedIds([...selectedIds, figureId]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>Ajouter des figures - {discipline}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {figures.map(figure => {
              const isAlreadyIn = existingFigureIds.includes(figure.id);
              return (
                <ListItem
                  key={figure.id}
                  button={!isAlreadyIn}
                  disabled={isAlreadyIn}
                  onClick={() => !isAlreadyIn && handleToggleFigure(figure.id)}
                  sx={{ opacity: isAlreadyIn ? 0.6 : 1 }}
                >
                  <Checkbox 
                    checked={selectedIds.includes(figure.id) || isAlreadyIn} 
                    disabled={isAlreadyIn}
                  />
                  <ListItemText 
                    primary={figure.nom} 
                    secondary={isAlreadyIn ? "Déjà ajouté" : null}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={selectedIds.length === 0}
        >
          Ajouter ({selectedIds.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AjouterDisciplineDialog({ open, onClose, onSelectDiscipline }) {
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      loadDisciplines();
    }
  }, [open]);

  const loadDisciplines = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/disciplines');
      const data = await response.json();
      setDisciplines(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement disciplines:', error);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>Sélectionner une discipline</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choisissez une discipline pour ajouter des figures à votre programme.
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {disciplines.map((discipline) => (
              <ListItem
                key={discipline.id}
                button
                onClick={() => onSelectDiscipline(discipline.nom)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <ListItemText
                  primary={discipline.nom}
                  secondary={discipline.description || 'Aucune description'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
      </DialogActions>
    </Dialog>
  );
}

function DetailsDialog({ open, figure, figureProgressions, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!figure) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Typography variant="h5">{figure.nom}</Typography>
        <Typography variant="body2" color="text.secondary">
          {figure.descriptif || 'Aucune description'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {figureProgressions.length === 0 ? (
          <Alert severity="info">
            Aucun élève n'a encore commencé cette figure.
          </Alert>
        ) : (
          <List>
            {figureProgressions.map((item) => {
              const { eleveId, eleveNom, elevePrenom, progression } = item;

              // Calculer progression
              const validatedSteps = progression.EtapesUtilisateurs?.filter(e => e.valide).length || 0;
              const totalSteps = progression.Figure?.nb_etapes || 1;
              const progressPercent = Math.round((validatedSteps / totalSteps) * 100);

              // Calculer memory decay
              const decayInfo = calculateDecayLevel(progression.date_derniere_validation);

              return (
                <Paper
                  key={eleveId}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: `2px solid ${theme.palette[decayInfo.color]?.main || theme.palette.grey[300]}`,
                    bgcolor: decayInfo.level === 'fresh' ? 'rgba(76, 175, 80, 0.05)' :
                             decayInfo.level === 'warning' ? 'rgba(255, 152, 0, 0.05)' :
                             decayInfo.level === 'critical' ? 'rgba(244, 67, 54, 0.05)' :
                             'transparent'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      {elevePrenom} {eleveNom}
                    </Typography>
                    <Chip
                      label={`${progressPercent}%`}
                      color={progressPercent >= 80 ? 'success' : progressPercent >= 50 ? 'warning' : 'error'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  {/* Barre de progression */}
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Étapes validées
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {validatedSteps}/{totalSteps}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPercent}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: progressPercent >= 80 ? 'success.main' : progressPercent >= 50 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                  </Box>

                  {/* Détails des étapes */}
                  <Typography variant="subtitle2" gutterBottom>
                    Détail des étapes :
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {progression.EtapesUtilisateurs?.map((etape, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Checkbox
                          checked={etape.valide}
                          disabled
                          size="small"
                          sx={{
                            color: etape.valide ? 'success.main' : 'grey.400',
                            '&.Mui-checked': { color: 'success.main' }
                          }}
                        />
                        <Typography variant="body2" color={etape.valide ? 'text.primary' : 'text.secondary'}>
                          Étape {idx + 1}
                          {etape.date_validation && (
                            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                              (validée le {new Date(etape.date_validation).toLocaleDateString('fr-FR')})
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* État de mémoire */}
                  {decayInfo.level !== 'not_validated' && decayInfo.message && (
                    <Chip
                      label={decayInfo.message}
                      size="small"
                      sx={{
                        bgcolor: theme.palette[decayInfo.color]?.main || theme.palette.grey.main,
                        color: 'white',
                        fontWeight: 'bold',
                        mt: 2
                      }}
                    />
                  )}
                </Paper>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProgrammeDetailPage;
