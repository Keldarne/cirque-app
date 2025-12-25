import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Grid
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../utils/api';

function ProgrammeAssignationsView({ programmeId, onUpdate }) {
  const [assignations, setAssignations] = useState({ groupes: [], individus: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!programmeId) return;
    loadAssignations();
  }, [programmeId]);

  const loadAssignations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/prof/programmes/${programmeId}/assignations`);
      if (!res.ok) {
        throw new Error('Erreur chargement assignations');
      }
      const data = await res.json();
      setAssignations(data);
    } catch (err) {
      console.error('Erreur loadAssignations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroupe = async (groupeId) => {
    if (!window.confirm('Retirer ce groupe du programme? Les élèves garderont leurs assignations individuelles.')) {
      return;
    }

    try {
      const res = await api.delete(`/api/prof/programmes/${programmeId}/groupes/${groupeId}`);
      if (!res.ok) {
        throw new Error('Erreur lors du retrait');
      }

      // Recharger les assignations
      await loadAssignations();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Erreur handleDeleteGroupe:', err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const totalGroupes = assignations.groupes?.length || 0;
  const totalIndividus = assignations.individus?.length || 0;
  const totalMembresGroupes = assignations.groupes?.reduce((acc, g) => acc + (g.nombre_membres || 0), 0) || 0;

  if (totalGroupes === 0 && totalIndividus === 0) {
    return (
      <Alert severity="info">
        Ce programme n'est assigné à aucun élève ou groupe pour le moment.
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <GroupIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4">{totalGroupes}</Typography>
            <Typography variant="body2" color="text.secondary">
              Groupe(s) ({totalMembresGroupes} élèves)
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <PersonIcon color="secondary" sx={{ fontSize: 40 }} />
            <Typography variant="h4">{totalIndividus}</Typography>
            <Typography variant="body2" color="text.secondary">
              Élève(s) individuel(s)
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {totalGroupes > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            <GroupIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Groupes assignés
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {assignations.groupes.map((groupe) => (
              <ListItem
                key={groupe.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="retirer"
                    onClick={() => handleDeleteGroupe(groupe.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: groupe.couleur || '#1976d2',
                      width: 32,
                      height: 32
                    }}
                  >
                    <GroupIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={groupe.nom}
                  secondary={`${groupe.nombre_membres || 0} membre(s)`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {totalIndividus > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            <PersonIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Élèves individuels
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" flexWrap="wrap" gap={1}>
            {assignations.individus.map((individu) => (
              <Chip
                key={individu.eleve_id}
                avatar={<Avatar>{individu.prenom?.[0]}{individu.nom?.[0]}</Avatar>}
                label={`${individu.prenom} ${individu.nom}`}
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default ProgrammeAssignationsView;
