import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../../utils/api';

const ExerciceSelectionStep = ({ data, onChange }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const selectedFigures = data.prerequisObjects || [];

  useEffect(() => {
    const fetchFigures = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/figures'); // Get all figures
        if (res.ok) {
          const allFigures = await res.json();
          // Filter out current figure if editing (to avoid self-reference)
          const filtered = allFigures.filter(f => f.id !== data.id);
          setOptions(filtered);
        }
      } catch (err) {
        console.error("Error fetching figures:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFigures();
  }, [data.id]);

  const handleChange = (event, newValue) => {
    // Update parent state with IDs (and keep objects for restoration if needed)
    onChange({ 
      ...data, 
      prerequis: newValue.map(f => f.id),
      prerequisObjects: newValue 
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Pré-requis & Exercices Liés
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Sélectionnez les figures que l'élève devrait maîtriser avant de commencer celle-ci.
      </Typography>

      <Autocomplete
        multiple
        id="prerequis-selection"
        options={options}
        getOptionLabel={(option) => `${option.nom} (${option.Discipline?.nom || 'Autre'})`}
        value={selectedFigures}
        onChange={handleChange}
        loading={loading}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option.nom}
                {...tagProps}
                color="primary"
                variant="outlined"
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Rechercher une figure"
            placeholder="Ajouter un pré-requis..."
          />
        )}
      />

      {selectedFigures.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Résumé des dépendances :</Typography>
          <List dense>
            {selectedFigures.map((fig) => (
              <ListItem key={fig.id}>
                <ListItemText
                  primary={fig.nom}
                  secondary={`Niveau ${fig.difficulty_level} • ${fig.Discipline?.nom || 'Sans discipline'}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ExerciceSelectionStep;
