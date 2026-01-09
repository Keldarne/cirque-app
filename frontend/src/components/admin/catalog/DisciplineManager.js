import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../../utils/api';

const DisciplineManager = ({ ecoleId }) => {
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [formData, setFormData] = useState({ nom: '' });
  const [saving, setSaving] = useState(false);

  // If ecoleId is null/undefined, we are in "Master Admin" mode for global catalog
  const isGlobalCatalog = !ecoleId;

  useEffect(() => {
    fetchDisciplines();
  }, [ecoleId]);

  const fetchDisciplines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Si catalogue global: /api/disciplines (toutes, sans filtre école)
      // Si école: /api/admin/ecoles/:id/disciplines (disponibilité)
      const endpoint = ecoleId 
        ? `/api/admin/ecoles/${ecoleId}/disciplines?includeInactive=true`
        : `/api/disciplines`; 
      
      const response = await api.get(endpoint);
      if (!response.ok) throw new Error('Impossible de charger les disciplines');
      
      const data = await response.json();
      setDisciplines(data || []);
    } catch (err) {
      console.error('Error fetching disciplines:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (disciplineId, currentStatus) => {
    try {
      // Optimistic update
      setDisciplines(prev => prev.map(d => 
        d.id === disciplineId ? { ...d, active: !currentStatus } : d
      ));

      const endpoint = ecoleId 
         ? `/api/admin/ecoles/${ecoleId}/disciplines` 
         : `/api/admin/disciplines/${disciplineId}/toggle`; // Fallback (pas encore implémenté global)

      await api.post(endpoint, {
        discipline_id: disciplineId,
        actif: !currentStatus
      });

    } catch (err) {
      console.error('Error toggling discipline:', err);
      setError("Erreur lors de la modification du statut");
      fetchDisciplines(); // Revert
    }
  };

  const handleOpenDialog = (discipline = null) => {
    setEditingDiscipline(discipline);
    setFormData({ nom: discipline ? discipline.nom : '' });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.nom.trim()) return;
    
    setSaving(true);
    try {
      const url = editingDiscipline 
        ? `/api/admin/disciplines/${editingDiscipline.id}` 
        : '/api/admin/disciplines';
      
      const method = editingDiscipline ? 'PUT' : 'POST';
      
      let res;
      if (method === 'POST') {
        res = await api.post(url, formData);
      } else {
        res = await api.put(url, formData);
      }

      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");

      await fetchDisciplines();
      setOpenDialog(false);
    } catch (err) {
      console.error(err);
      alert("Erreur: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (discipline) => {
    if (window.confirm(`Voulez-vous vraiment supprimer la discipline "${discipline.nom}" ? Cette action est irréversible.`)) {
      try {
        const res = await api.delete(`/api/admin/disciplines/${discipline.id}`);
        
        if (res.status === 409) {
          const data = await res.json();
          alert(`Suppression impossible : ${data.details || data.message}`);
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || data.message || "Impossible de supprimer");
        }
        
        await fetchDisciplines();
      } catch (err) {
        alert("Erreur : " + err.message);
      }
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Gestion des Disciplines
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isGlobalCatalog 
              ? "Gérez le catalogue global des disciplines." 
              : "Activez ou désactivez les disciplines disponibles pour votre école."}
          </Typography>
        </Box>
        {isGlobalCatalog && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Ajouter
          </Button>
        )}
      </Box>
      
      <List>
        {disciplines.map((discipline, index) => (
          <React.Fragment key={discipline.id}>
            {index > 0 && <Divider />}
            <ListItem>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {discipline.nom}
                    {!isGlobalCatalog && !discipline.active && <Chip label="Inactif" size="small" color="default" />}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {isGlobalCatalog ? (
                  <Box>
                    <Tooltip title="Modifier">
                      <IconButton onClick={() => handleOpenDialog(discipline)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer (si vide)">
                      <IconButton onClick={() => handleDelete(discipline)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Switch
                    edge="end"
                    checked={!!discipline.active}
                    onChange={() => handleToggle(discipline.id, discipline.active)}
                    color="primary"
                  />
                )}
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        ))}
        {disciplines.length === 0 && (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
            Aucune discipline trouvée.
          </Typography>
        )}
      </List>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDiscipline ? 'Modifier la discipline' : 'Nouvelle discipline'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom de la discipline"
            fullWidth
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DisciplineManager;