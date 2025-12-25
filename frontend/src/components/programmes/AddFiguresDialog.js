import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Typography,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { api } from '../../utils/api';

/**
 * AddFiguresDialog - Modal pour ajouter des figures à un programme
 * Suit les specs de figma.md section 3.3
 *
 * @param {boolean} open - Dialog ouvert
 * @param {string} disciplineNom - Nom de la discipline (optionnel)
 * @param {number} disciplineId - ID de la discipline (optionnel)
 * @param {number} programmeId - ID du programme
 * @param {function} onClose - Callback fermeture
 * @param {function} onSuccess - Callback succès ajout
 * @param {string} apiUrl - URL de l'API cible (optionnel, défaut: /api/prof/programmes/{id}/figures)
 */
function AddFiguresDialog({
  open,
  disciplineNom,
  disciplineId = null,
  programmeId,
  onClose,
  onSuccess,
  apiUrl
}) {
  const [figures, setFigures] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadFigures = useCallback(async () => {
    setLoading(true);
    try {
      // Charger toutes les figures
      const response = await api.get('/api/figures');
      const data = await response.json();

      let filtered = data;

      // Filtrer par discipline si spécifié
      if (disciplineId) {
        filtered = data.filter(f => f.discipline_id === disciplineId);
      } else if (disciplineNom) {
        filtered = data.filter(f => f.Discipline?.nom === disciplineNom);
      }

      setFigures(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement figures:', error);
      setLoading(false);
    }
  }, [disciplineId, disciplineNom]);

  // Charger les figures
  useEffect(() => {
    if (open) {
      loadFigures();
    }
  }, [open, loadFigures]);

  const handleToggle = (figureId) => {
    if (selectedIds.includes(figureId)) {
      setSelectedIds(selectedIds.filter(id => id !== figureId));
    } else {
      setSelectedIds([...selectedIds, figureId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;

    setSubmitting(true);
    try {
      const url = apiUrl || `/api/prof/programmes/${programmeId}/figures`;
      
      await api.post(url, {
        figureIds: selectedIds
      });

      if (onSuccess) {
        onSuccess();
      }
      setSelectedIds([]);
      onClose();
    } catch (error) {
      console.error('Erreur ajout figures:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Header */}
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Ajouter des figures {disciplineNom ? `- ${disciplineNom}` : ''}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : figures.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Aucune figure disponible
          </Typography>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {figures.map(figure => (
              <ListItem
                key={figure.id}
                button
                onClick={() => handleToggle(figure.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Checkbox
                  checked={selectedIds.includes(figure.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {figure.nom}
                      {!disciplineNom && !disciplineId && figure.Discipline && (
                        <Chip label={figure.Discipline.nom} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  }
                  secondary={figure.descriptif?.substring(0, 80) + '...'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={selectedIds.length === 0 || submitting}
        >
          {submitting ? 'Ajout...' : `Ajouter (${selectedIds.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddFiguresDialog;
