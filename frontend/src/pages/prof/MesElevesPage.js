import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../utils/api';
import AssignProgramModal from '../../components/prof/AssignProgramModal';
import { useRefresh } from '../../contexts/RefreshContext';

function MesElevesPage() {
  const navigate = useNavigate();
  const { eleveId } = useParams();
  const { refreshKey, triggerRefresh } = useRefresh();

  const [loading, setLoading] = useState(true);
  const [eleves, setEleves] = useState([]);
  const [eleveSelectionne, setEleveSelectionne] = useState(null);
  const [dialogDetail, setDialogDetail] = useState(false);
  const [dialogNotes, setDialogNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEleveForAssignment, setSelectedEleveForAssignment] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const chargerEleves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/prof/eleves');
      if (!res.ok) throw new Error('Erreur chargement élèves');

      const data = await res.json();
      setEleves(data.eleves || []);
    } catch (err) {
      console.error('Erreur chargement élèves:', err);
      afficherSnackbar('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerEleves();
  }, [refreshKey, chargerEleves]);

  const chargerDetailEleve = useCallback(async (id) => {
    try {
      const res = await api.get(`/api/prof/eleves/${id}`);
      if (!res.ok) throw new Error('Erreur chargement détail');

      const data = await res.json();
      setEleveSelectionne(data);
      setNotes(data.relation?.notes_prof || '');
      setDialogDetail(true);
    } catch (err) {
      console.error('Erreur chargement détail élève:', err);
      afficherSnackbar('Erreur lors du chargement des détails', 'error');
    }
  }, []);

  useEffect(() => {
    if (eleveId) {
      chargerDetailEleve(eleveId);
    }
  }, [eleveId, refreshKey, chargerDetailEleve]);

  const afficherSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const ouvrirDetailEleve = (eleve) => {
    navigate(`/prof/eleves/${eleve.id}`);
  };

  const modifierNotes = async () => {
    if (!eleveSelectionne) return;

    try {
      const res = await api.put(`/api/prof/eleves/${eleveSelectionne.eleve.id}/notes`, { notes });
      if (!res.ok) throw new Error('Erreur modification notes');

      afficherSnackbar('Notes mises à jour');
      setDialogNotes(false);
      triggerRefresh();
      if (eleveId) {
        chargerDetailEleve(eleveId);
      }
    } catch (err) {
      console.error('Erreur modification notes:', err);
      afficherSnackbar('Erreur lors de la modification', 'error');
    }
  };

  const retirerEleve = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cet élève ? Cette action est irréversible.')) return;

    try {
      const res = await api.delete(`/api/prof/eleves/${id}`);
      if (!res.ok) throw new Error('Erreur suppression élève');

      afficherSnackbar('Élève retiré de votre liste');
      setDialogDetail(false);
      navigate('/prof/eleves');
      triggerRefresh();
    } catch (err) {
      console.error('Erreur suppression élève:', err);
      afficherSnackbar('Erreur lors de la suppression', 'error');
    }
  };

  const handleOpenAssignModal = (eleve) => {
    setSelectedEleveForAssignment(eleve);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setSelectedEleveForAssignment(null);
    setIsAssignModalOpen(false);
  };

  const handleAssignSuccess = () => {
    afficherSnackbar('Programme assigné avec succès !');
    handleCloseAssignModal();
    triggerRefresh();
  };

  const getNiveauColor = (niveau) => {
    if (niveau >= 30) return '#9C27B0';
    if (niveau >= 20) return '#F44336';
    if (niveau >= 10) return '#FF9800';
    if (niveau >= 5) return '#2196F3';
    return '#4CAF50';
  };

  if (loading) {
    return <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Mes Élèves</Typography>
        <Typography variant="body1" color="textSecondary">{eleves.length} élève{eleves.length > 1 ? 's' : ''} sous votre supervision</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Tous les élèves de votre école sont automatiquement accessibles. Plus besoin d'envoyer des invitations !
      </Alert>

      {eleves.length === 0 ? (
        <Alert severity="info">Aucun élève trouvé dans votre école pour le moment.</Alert>
      ) : (
        <Grid container spacing={3}>
          {eleves.map((eleve) => (
            <Grid item xs={12} sm={6} md={4} key={eleve.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar src={eleve.avatar_url} sx={{ width: 56, height: 56, mr: 2, bgcolor: getNiveauColor(eleve.niveau) }}>{eleve.prenom?.[0]}{eleve.nom?.[0]}</Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6" gutterBottom>{eleve.prenom} {eleve.nom}</Typography>
                      <Chip label={`Niveau ${eleve.niveau}`} size="small" sx={{ bgcolor: getNiveauColor(eleve.niveau), color: 'white' }} />
                    </Box>
                  </Box>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="textSecondary">Expérience</Typography>
                      <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold' }}>{(eleve.xp_total || 0).toLocaleString()} XP</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min((eleve.xp_total % 1000) / 10, 100)} sx={{ height: 8, borderRadius: 4, backgroundColor: '#E0E0E0', '& .MuiLinearProgress-bar': { backgroundColor: '#FFD700' } }} />
                  </Box>
                  {eleve.streak && (
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center">
                        <FireIcon sx={{ color: '#FF5722', mr: 0.5 }} />
                        <Typography variant="body2">{eleve.streak.jours_consecutifs} jour{eleve.streak.jours_consecutifs > 1 ? 's' : ''}</Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">Record: {eleve.streak.record_personnel}</Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="textSecondary" display="block" mt={2}>Élève depuis {new Date(eleve.date_acceptation).toLocaleDateString('fr-FR')}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => ouvrirDetailEleve(eleve)}>Voir détails</Button>
                  <Button size="small" color="secondary" startIcon={<AssignmentIcon />} onClick={() => handleOpenAssignModal(eleve)}>Assigner Programme</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogDetail} onClose={() => { setDialogDetail(false); navigate('/prof/eleves'); }} maxWidth="md" fullWidth fullScreen={isMobile}>
        {eleveSelectionne && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Avatar src={eleveSelectionne.eleve.avatar_url} sx={{ width: 48, height: 48, mr: 2, bgcolor: getNiveauColor(eleveSelectionne.eleve.niveau) }}>{eleveSelectionne.eleve.prenom?.[0]}{eleveSelectionne.eleve.nom?.[0]}</Avatar>
                  <div>
                    <Typography variant="h6">{eleveSelectionne.eleve.prenom} {eleveSelectionne.eleve.nom}</Typography>
                    <Typography variant="body2" color="textSecondary">{eleveSelectionne.eleve.email}</Typography>
                  </div>
                </Box>
                <Chip label={`Niveau ${eleveSelectionne.eleve.niveau}`} sx={{ bgcolor: getNiveauColor(eleveSelectionne.eleve.niveau), color: 'white' }} />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center' }}><TrophyIcon sx={{ fontSize: 30, color: '#FFD700', mb: 1 }} /><Typography variant="h6">{eleveSelectionne.eleve.xp_total || 0}</Typography><Typography variant="caption" color="textSecondary">XP Total</Typography></Paper></Grid>
                <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center' }}><SchoolIcon sx={{ fontSize: 30, color: '#2196F3', mb: 1 }} /><Typography variant="h6">{eleveSelectionne.statistiques?.progressions_actives || 0}</Typography><Typography variant="caption" color="textSecondary">Progressions</Typography></Paper></Grid>
                <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center' }}><TrendingUpIcon sx={{ fontSize: 30, color: '#4CAF50', mb: 1 }} /><Typography variant="h6">{eleveSelectionne.statistiques?.figures_validees || 0}</Typography><Typography variant="caption" color="textSecondary">Figures validées</Typography></Paper></Grid>
                <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center' }}><FireIcon sx={{ fontSize: 30, color: '#FF5722', mb: 1 }} /><Typography variant="h6">{eleveSelectionne.eleve.streak?.jours_consecutifs || 0}</Typography><Typography variant="caption" color="textSecondary">Streak</Typography></Paper></Grid>
              </Grid>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Progression Générale</Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Étapes validées: {eleveSelectionne.statistiques?.etapes_validees || 0} / {eleveSelectionne.statistiques?.etapes_totales || 0}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{eleveSelectionne.statistiques?.taux_completion || 0}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={eleveSelectionne.statistiques?.taux_completion || 0} sx={{ height: 10, borderRadius: 5 }} />
              </Paper>
              {eleveSelectionne.eleve.badgesObtenus && eleveSelectionne.eleve.badgesObtenus.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Badges Récents</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {eleveSelectionne.eleve.badgesObtenus.slice(0, 5).map((badgeUtil) => (
                      <Tooltip key={badgeUtil.id} title={badgeUtil.Badge.description}>
                        <Chip label={badgeUtil.Badge.nom} icon={<span>{badgeUtil.Badge.icone}</span>} size="small" />
                      </Tooltip>
                    ))}
                  </Box>
                </Paper>
              )}
              <Paper sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Vos Notes</Typography>
                  <IconButton size="small" onClick={() => setDialogNotes(true)}><EditIcon /></IconButton>
                </Box>
                <Typography variant="body2" sx={{ fontStyle: eleveSelectionne.relation?.notes_prof ? 'normal' : 'italic' }}>{eleveSelectionne.relation?.notes_prof || 'Aucune note pour le moment'}</Typography>
              </Paper>
            </DialogContent>
            <DialogActions>
              <Button color="error" startIcon={<DeleteIcon />} onClick={() => retirerEleve(eleveSelectionne.eleve.id)}>Retirer cet élève</Button>
              <Box flexGrow={1} />
              <Button onClick={() => { setDialogDetail(false); navigate('/prof/eleves'); }}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={dialogNotes} onClose={() => setDialogNotes(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Modifier vos notes</DialogTitle>
        <DialogContent>
          <TextField label="Notes sur cet élève" multiline rows={6} fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, points forts, axes d'amélioration..." sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogNotes(false)}>Annuler</Button>
          <Button variant="contained" onClick={modifierNotes}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {selectedEleveForAssignment && (
        <AssignProgramModal
          open={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          eleve={selectedEleveForAssignment}
          onAssignSuccess={handleAssignSuccess}
        />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Container>
  );
}

export default MesElevesPage;
