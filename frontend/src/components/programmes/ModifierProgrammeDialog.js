import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { api } from '../../utils/api';

/**
 * ModifierProgrammeDialog - Modal pour modifier nom et description d'un programme
 * Suit les specs de figma.md section 3.4
 *
 * @param {boolean} open - Dialog ouvert
 * @param {object} programme - Données du programme à modifier
 * @param {number} programmeId - ID du programme
 * @param {function} onClose - Callback fermeture
 * @param {function} onSuccess - Callback succès modification
 */
function ModifierProgrammeDialog({
  open,
  programme = null,
  programmeId,
  onClose,
  onSuccess
}) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialiser les champs quand le programme change
  useEffect(() => {
    if (programme) {
      setNom(programme.nom || '');
      setDescription(programme.description || '');
    }
  }, [programme]);

  const handleSubmit = async () => {
    if (!nom.trim()) return;

    setSubmitting(true);
    try {
      await api.put(`/api/prof/programmes/${programmeId}`, {
        nom: nom.trim(),
        description: description.trim()
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Erreur modification programme:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Réinitialiser les champs
    if (programme) {
      setNom(programme.nom || '');
      setDescription(programme.description || '');
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Header */}
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Modifier le programme
          </Typography>
          <IconButton onClick={handleClose} size="small" disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent>
        <TextField
          label="Nom"
          fullWidth
          margin="normal"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          disabled={submitting}
          required
          autoFocus
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
        />
      </DialogContent>

      {/* Actions */}
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!nom.trim() || submitting}
        >
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ModifierProgrammeDialog;
