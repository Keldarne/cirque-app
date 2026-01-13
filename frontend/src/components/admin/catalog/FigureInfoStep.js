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
  FormHelperText,
  Divider,
  Paper
} from '@mui/material';
import { api } from '../../../utils/api';
import SiteswapVisualizer from '../../figures/metadata/SiteswapVisualizer';

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

  // Gestion spécifique des métadonnées (JSON)
  const handleMetadataChange = (key, value) => {
    const currentMetadata = data.metadata || {};
    onChange({
      ...data,
      metadata: {
        ...currentMetadata,
        [key]: value
      }
    });
  };

  // Détection de la discipline Jonglage
  const selectedDiscipline = disciplines.find(d => d.id === data.discipline_id);
  const isJuggling = selectedDiscipline?.nom?.toLowerCase().includes('jonglage') ||
                     selectedDiscipline?.nom?.toLowerCase().includes('diabolo') ||
                     selectedDiscipline?.nom?.toLowerCase().includes('massues');

  // Détection automatique du siteswap à partir du nom (UX)
  useEffect(() => {
    if (isJuggling && data.nom && !data.metadata?.siteswap) {
      const name = data.nom.trim();
      // Cas 1: Le nom est un chiffre pur (ex: 441)
      if (/^\d+$/.test(name)) {
        handleMetadataChange('siteswap', name);
      } 
      // Cas 2: Patterns avec parenthèses (ex: Cascade (3 Balles))
      else {
        const match = name.match(/\((\d+)\s+(Balles|Massues|Diabolos|Clubs|Objects)\)/i);
        if (match && match[1]) {
          handleMetadataChange('siteswap', match[1]);
        }
      }
    }
  }, [data.nom, isJuggling]); // Se déclenche quand le nom change

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
        
        {/* SECTION METADONNÉES DYNAMIQUES */}
        {isJuggling && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                Paramètres Jonglerie
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Code Siteswap"
                    placeholder="Ex: 531"
                    value={data.metadata?.siteswap || ''}
                    onChange={(e) => handleMetadataChange('siteswap', e.target.value)}
                    helperText="Notation standard (chiffres, lettres, [] pour multiplex)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: 'white', p: 1, borderRadius: 1, border: '1px dashed grey' }}>
                    {data.metadata?.siteswap ? (
                      <SiteswapVisualizer siteswap={data.metadata.siteswap} height={100} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Aperçu de l'animation
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

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
