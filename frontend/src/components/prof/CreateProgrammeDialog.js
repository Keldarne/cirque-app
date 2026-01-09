import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useCreateProgramme, useFigures } from '../../hooks/useProgrammes';

function CreateProgrammeDialog({ open, onClose, onSuccess }) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [figureIds, setFigureIds] = useState([]);
  const [estModele, setEstModele] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { createProgramme, loading: creating } = useCreateProgramme();
  const { figures, loading: loadingFigures } = useFigures();

  const handleToggleFigure = (figureId) => {
    if (figureIds.includes(figureId)) {
      setFigureIds(figureIds.filter(id => id !== figureId));
    } else {
      setFigureIds([...figureIds, figureId]);
    }
  };

  const handleSubmit = async () => {
    if (!nom.trim()) {
      alert('Le nom du programme est requis');
      return;
    }

    if (figureIds.length === 0) {
      alert('Veuillez sélectionner au moins une figure');
      return;
    }

    try {
      await createProgramme({
        nom: nom.trim(),
        description: description.trim(),
        figureIds,
        estModele
      });

      // Reset form
      setNom('');
      setDescription('');
      setFigureIds([]);
      setEstModele(false);

      onSuccess();
    } catch (err) {
      // Error handled in hook
      console.error('Erreur création programme:', err);
    }
  };

  const handleClose = () => {
    setNom('');
    setDescription('');
    setFigureIds([]);
    setEstModele(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>Créer un Programme</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            label="Nom du programme"
            fullWidth
            margin="normal"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Programme Débutant Jonglage"
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le programme..."
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={estModele}
                onChange={(e) => setEstModele(e.target.checked)}
              />
            }
            label="Enregistrer comme modèle réutilisable"
            sx={{ mt: 2, mb: 2 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Sélectionner les figures ({figureIds.length} sélectionnée{figureIds.length > 1 ? 's' : ''}) :
          </Typography>

          {loadingFigures ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : figures.length === 0 ? (
            <Alert severity="warning">Aucune figure disponible</Alert>
          ) : (
            <List
              sx={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mt: 1
              }}
            >
              {figures.map((figure) => (
                <ListItem
                  key={figure.id}
                  button
                  onClick={() => handleToggleFigure(figure.id)}
                  selected={figureIds.includes(figure.id)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={figureIds.includes(figure.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={figure.nom}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        {figure.Discipline?.nom && (
                          <Chip label={figure.Discipline.nom} size="small" />
                        )}
                        {figure.difficulte && (
                          <Typography variant="caption" color="text.secondary">
                            Difficulté: {'⭐'.repeat(figure.difficulte)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={creating || !nom.trim() || figureIds.length === 0}
        >
          {creating ? <CircularProgress size={24} /> : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateProgrammeDialog;
