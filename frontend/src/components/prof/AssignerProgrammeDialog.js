import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { useAssignerProgramme } from '../../hooks/useProgrammes';
import { api } from '../../utils/api';

function AssignerProgrammeDialog({ open, onClose, programme, onSuccess }) {
  const [eleves, setEleves] = useState([]);
  const [selectedEleveId, setSelectedEleveId] = useState('');
  const [loadingEleves, setLoadingEleves] = useState(true);
  const [errorEleves, setErrorEleves] = useState(null);

  const { assignerProgramme, loading: assigning } = useAssignerProgramme();

  // Charger la liste des élèves
  useEffect(() => {
    if (open) {
      const fetchEleves = async () => {
        setLoadingEleves(true);
        setErrorEleves(null);

        try {
          const response = await api.get('/api/prof/eleves');
          const data = await response.json();
          setEleves(data.eleves || []);
        } catch (err) {
          console.error('Erreur chargement élèves:', err);
          setErrorEleves(err.message);
        } finally {
          setLoadingEleves(false);
        }
      };

      fetchEleves();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedEleveId) {
      alert('Veuillez sélectionner un élève');
      return;
    }

    try {
      await assignerProgramme(programme.id, selectedEleveId);
      setSelectedEleveId('');
      onSuccess();
    } catch (err) {
      // Error handled in hook
      console.error('Erreur assignation programme:', err);
    }
  };

  const handleClose = () => {
    setSelectedEleveId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assigner un Programme</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="h6" gutterBottom>
            {programme?.nom}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {programme?.description || 'Aucune description'}
          </Typography>

          {/* Résumé du programme */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Contenu du programme:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={`${programme?.ProgrammesFigures?.length || 0} figure${
                  (programme?.ProgrammesFigures?.length || 0) > 1 ? 's' : ''
                }`}
                size="small"
                color="primary"
              />
              {programme?.est_modele && (
                <Chip label="Modèle" size="small" color="secondary" />
              )}
            </Box>

            {/* Liste des figures */}
            {programme?.ProgrammesFigures && programme.ProgrammesFigures.length > 0 && (
              <List dense sx={{ mt: 1 }}>
                {programme.ProgrammesFigures.slice(0, 5).map((pf, index) => (
                  <ListItem key={pf.id} disablePadding>
                    <ListItemText
                      primary={`${index + 1}. ${pf.Figure?.nom || 'Figure inconnue'}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
                {programme.ProgrammesFigures.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    ... et {programme.ProgrammesFigures.length - 5} autre(s) figure(s)
                  </Typography>
                )}
              </List>
            )}
          </Box>

          {/* Sélection de l'élève */}
          {loadingEleves ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : errorEleves ? (
            <Alert severity="error">{errorEleves}</Alert>
          ) : eleves.length === 0 ? (
            <Alert severity="warning">
              Vous n'avez pas encore d'élèves. Invitez des élèves pour pouvoir leur assigner des programmes.
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel id="eleve-select-label">Sélectionner un élève</InputLabel>
              <Select
                labelId="eleve-select-label"
                value={selectedEleveId}
                onChange={(e) => setSelectedEleveId(e.target.value)}
                label="Sélectionner un élève"
              >
                {eleves.map((eleve) => (
                  <MenuItem key={eleve.id} value={eleve.id}>
                    {eleve.prenom} {eleve.nom} - Niveau {eleve.niveau}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={assigning}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={assigning || !selectedEleveId || loadingEleves || eleves.length === 0}
        >
          {assigning ? <CircularProgress size={24} /> : 'Assigner'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssignerProgrammeDialog;
