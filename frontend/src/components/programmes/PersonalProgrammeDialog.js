import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

function PersonalProgrammeDialog({ open, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({ nom: '', description: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          nom: initialData.nom || '',
          description: initialData.description || ''
        });
      } else {
        setFormData({ nom: '', description: '' });
      }
      setError(null);
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.nom.trim()) {
      setError('Le nom du programme est requis.');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {initialData ? 'Modifier le programme' : 'Nouveau programme personnel'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          autoFocus
          margin="dense"
          name="nom"
          label="Nom du programme"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.nom}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          name="description"
          label="Description (optionnel)"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={formData.description}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PersonalProgrammeDialog;
