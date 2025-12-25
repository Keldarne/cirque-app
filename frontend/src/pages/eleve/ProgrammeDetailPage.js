import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Paper, Chip,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem,
  ListItemText, Checkbox, Alert, CircularProgress
} from '@mui/material';
import {
  ArrowBack, Add as AddIcon,
  Delete as DeleteIcon, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { api } from '../../utils/api';

function ProgrammeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addFiguresDialog, setAddFiguresDialog] = useState({ open: false, discipline: null });

  const loadProgramme = useCallback(async () => {
    try {
      const response = await api.get(`/api/progression/programmes/${id}`);
      const data = await response.json();
      setProgramme(data.programme);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement programme:', error);
      setLoading(false);
    }
  }, [id]);

  // Charger le programme
  useEffect(() => {
    loadProgramme();
  }, [id, loadProgramme]);

  // Regrouper figures par discipline
  const figuresParDiscipline = programme?.ProgrammesFigures?.reduce((acc, pf) => {
    const disciplineNom = pf.Figure?.Discipline?.nom || 'Sans discipline';
    if (!acc[disciplineNom]) {
      acc[disciplineNom] = [];
    }
    acc[disciplineNom].push(pf);
    return acc;
  }, {}) || {};

  const handleRetirerFigure = async (figureId) => {
    if (!window.confirm('Retirer cette figure du programme ?')) return;

    try {
      await api.delete(`/api/progression/programmes/${id}/figures/${figureId}`);
      loadProgramme(); // Recharger
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
      await api.put(`/api/progression/programmes/${id}/reorder`, { figureOrders });
      loadProgramme();
    } catch (error) {
      console.error('Erreur réordonnancement:', error);
    }
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
          <IconButton onClick={() => navigate('/mon-programme')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">{programme?.nom}</Typography>
          {programme?.est_modele && <Chip label="Modèle" color="primary" />}
        </Box>
      </Box>

      {/* Description */}
      {programme?.description && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {programme.description}
        </Alert>
      )}

      {/* Figures par discipline */}
      {Object.entries(figuresParDiscipline).map(([disciplineNom, figures]) => (
        <Paper key={disciplineNom} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">{disciplineNom}</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAddFiguresDialog({ open: true, discipline: disciplineNom })}
            >
              Ajouter des figures
            </Button>
          </Box>

          <List>
            {figures.map((pf, index) => (
              <ListItem
                key={pf.figure_id}
                secondaryAction={
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => handleReorderFigure(disciplineNom, index, 'up')}
                    >
                      <ArrowUpward />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === figures.length - 1}
                      onClick={() => handleReorderFigure(disciplineNom, index, 'down')}
                    >
                      <ArrowDownward />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRetirerFigure(pf.figure_id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={pf.Figure?.nom}
                  secondary={`Ordre: ${pf.ordre}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}

      {/* Dialog Ajouter Figures */}
      <AjouterFiguresDialog
        open={addFiguresDialog.open}
        discipline={addFiguresDialog.discipline}
        programmeId={id}
        onClose={() => setAddFiguresDialog({ open: false, discipline: null })}
        onSuccess={loadProgramme}
      />
    </Container>
  );
}

function AjouterFiguresDialog({ open, discipline, programmeId, onClose, onSuccess }) {
  const [figures, setFigures] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFiguresDiscipline = useCallback(async () => {
    setLoading(true);
    try {
      // Charger toutes les figures
      const response = await api.get('/api/figures');
      const data = await response.json();

      // Filtrer par discipline
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
      await api.post(`/api/progression/programmes/${programmeId}/figures`, {
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
    if (selectedIds.includes(figureId)) {
      setSelectedIds(selectedIds.filter(id => id !== figureId));
    } else {
      setSelectedIds([...selectedIds, figureId]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter des figures - {discipline}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {figures.map(figure => (
              <ListItem
                key={figure.id}
                button
                onClick={() => handleToggleFigure(figure.id)}
              >
                <Checkbox checked={selectedIds.includes(figure.id)} />
                <ListItemText primary={figure.nom} />
              </ListItem>
            ))}
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

export default ProgrammeDetailPage;
