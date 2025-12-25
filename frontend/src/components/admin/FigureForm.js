import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { api } from '../../utils/api';

function FigureForm({ figure, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nom: '',
    descriptif: '',
    image_url: '',
    video_url: '',
    discipline_id: ''
  });
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si on édite une figure, pré-remplir le formulaire
    if (figure) {
      setFormData({
        nom: figure.nom || '',
        descriptif: figure.descriptif || '',
        image_url: figure.image_url || '',
        video_url: figure.video_url || '',
        discipline_id: figure.discipline_id || ''
      });
    }
    
    // Charger les disciplines pour le menu déroulant
    const fetchDisciplines = async () => {
      try {
        const res = await api.get('/api/disciplines'); // Cet endpoint doit exister
        if (res.ok) {
          const data = await res.json();
          setDisciplines(data);
        }
      } catch (error) {
        console.error("Impossible de charger les disciplines", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDisciplines();
    
  }, [figure]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3} sx={{ pt: 1 }}>
        <Grid item xs={12} md={8}>
          <TextField
            name="nom"
            label="Nom de la figure"
            value={formData.nom}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            name="discipline_id"
            label="Discipline"
            value={formData.discipline_id}
            onChange={handleChange}
            fullWidth
            required
            select
          >
            <MenuItem value="">-- Choisissez --</MenuItem>
            {disciplines.map(d => (
              <MenuItem key={d.id} value={d.id}>{d.nom}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="descriptif"
            label="Description"
            value={formData.descriptif}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="image_url"
            label="URL de l'image"
            value={formData.image_url}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            name="video_url"
            label="URL de la vidéo"
            value={formData.video_url}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button onClick={onCancel} color="secondary">
          Annuler
        </Button>
        <Button type="submit" variant="contained">
          Enregistrer
        </Button>
      </Box>
    </form>
  );
}

export default FigureForm;
