import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { api } from '../../utils/api';

function AssignProgramModal({ open, onClose, eleve, onAssignSuccess }) {
  const [programmesProf, setProgrammesProf] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Charger les programmes du professeur
  useEffect(() => {
    if (!open) return; // Ne charger que si la modale est ouverte
    
    const fetchProgrammes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/prof/programmes'); // Utilise l'endpoint existant
        if (!res.ok) {
          throw new Error('Erreur de chargement des programmes');
        }
        const data = await res.json();
        setProgrammesProf(data.programmes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProgrammes();
  }, [open]);

  const handleAssign = async () => {
    if (!selectedProgramme) {
      setSnackbar({ open: true, message: 'Veuillez sélectionner un programme', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/api/prof/eleves/${eleve.id}/programmes/assigner`, {
        programme_id: selectedProgramme
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de l\'assignation');
      }

      setSnackbar({ open: true, message: 'Programme assigné avec succès !', severity: 'success' });
      onAssignSuccess(); // Callback pour rafraîchir la liste des élèves
      onClose(); // Fermer la modale
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assigner un programme à {eleve?.prenom} {eleve?.nom}</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {error && <Alert severity="error">{error}</Alert>}
        
        {!loading && !error && (
          <FormControl fullWidth margin="normal">
            <InputLabel id="programme-select-label">Programme</InputLabel>
            <Select
              labelId="programme-select-label"
              value={selectedProgramme}
              label="Programme"
              onChange={(e) => setSelectedProgramme(e.target.value)}
            >
              {programmesProf.length === 0 && (
                <MenuItem value="" disabled>Aucun programme disponible</MenuItem>
              )}
              {programmesProf.map((prog) => (
                <MenuItem key={prog.id} value={prog.id}>
                  {prog.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Annuler
        </Button>
        <Button onClick={handleAssign} color="primary" variant="contained" disabled={loading || !selectedProgramme}>
          Assigner
        </Button>
      </DialogActions>
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
    </Dialog>
  );
}

export default AssignProgramModal;
