import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Rating,
  FormHelperText
} from '@mui/material';
import { api } from '../../../utils/api';

const FigureInfoStep = ({ data, onChange, errors = {} }) => {
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    // Charger les disciplines pour le select
    const fetchDisciplines = async () => {
      try {
        const res = await api.get('/api/disciplines');
        if (res.ok) {
          const list = await res.json();
          setDisciplines(list);
        }
      } catch (err) {
        console.error("Failed to load disciplines", err);
      }
    };
    fetchDisciplines();
  }, []);

  const handleChange = (field) => (event) => {
    // Handle both event.target.value and direct value (for Rating)
    const value = event.target ? event.target.value : event;
    onChange({ ...data, [field]: value });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Informations Générales
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nom de la figure"
            value={data.nom || ''}
            onChange={handleChange('nom')}
            error={!!errors.nom}
            helperText={errors.nom}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.discipline_id}>
            <InputLabel>Discipline</InputLabel>
            <Select
              value={data.discipline_id || ''}
              label="Discipline"
              onChange={handleChange('discipline_id')}
            >
              {disciplines.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.nom}
                </MenuItem>
              ))}
            </Select>
            {errors.discipline_id && <FormHelperText>{errors.discipline_id}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={data.description || ''}
            onChange={handleChange('description')}
            error={!!errors.description}
            helperText={errors.description}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Box component="fieldset" borderColor="transparent">
            <Typography component="legend">Difficulté (1-10)</Typography>
            <Rating
              name="difficulty_level"
              value={data.difficulty_level || 1}
              max={10}
              onChange={(event, newValue) => {
                onChange({ ...data, difficulty_level: newValue });
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={data.type || 'pratique'}
              label="Type"
              onChange={handleChange('type')}
            >
              <MenuItem value="pratique">Pratique</MenuItem>
              <MenuItem value="theorique">Théarique</MenuItem>
              <MenuItem value="echauffement">Échauffement</MenuItem>
              <MenuItem value="etirement">Étirement</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="URL Vidéo (YouTube/Vimeo)"
            value={data.video_url || ''}
            onChange={handleChange('video_url')}
            placeholder="https://..."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="URL Image (Optionnel)"
            value={data.image_url || ''}
            onChange={handleChange('image_url')}
            placeholder="https://..."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default FigureInfoStep;
