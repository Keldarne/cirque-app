import React, { useState, useEffect } from 'react';
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
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Autocomplete,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../utils/api';

const COULEURS_PREDEFINIES = [
  { nom: 'Bleu', valeur: '#1976d2' },
  { nom: 'Vert', valeur: '#4CAF50' },
  { nom: 'Orange', valeur: '#FF9800' },
  { nom: 'Violet', valeur: '#9C27B0' },
  { nom: 'Rouge', valeur: '#F44336' },
  { nom: 'Rose', valeur: '#E91E63' },
  { nom: 'Cyan', valeur: '#00BCD4' },
  { nom: 'Indigo', valeur: '#3F51B5' }
];

function GroupesPage() {
  const navigate = useNavigate();
  const { groupeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [groupes, setGroupes] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [groupeSelectionne, setGroupeSelectionne] = useState(null);
  const [dialogCreer, setDialogCreer] = useState(false);
  const [dialogDetail, setDialogDetail] = useState(false);
  const [dialogAjouterMembre, setDialogAjouterMembre] = useState(false);
  const [nouveauGroupe, setNouveauGroupe] = useState({ nom: '', description: '', couleur: '#1976d2' });
  const [eleveAAjouter, setEleveAAjouter] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    chargerDonnees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (groupeId) {
      chargerDetailGroupe(groupeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeId]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);

      // Charger groupes
      const groupesRes = await api.get('/api/prof/groupes');
      if (!groupesRes.ok) throw new Error('Erreur chargement groupes');
      const groupesData = await groupesRes.json();
      setGroupes(groupesData.groupes || []);

      // Charger élèves
      const elevesRes = await api.get('/api/prof/eleves');
      if (!elevesRes.ok) throw new Error('Erreur chargement élèves');
      const elevesData = await elevesRes.json();
      setEleves(elevesData.eleves || []);

    } catch (err) {
      console.error('Erreur chargement données:', err);
      afficherSnackbar('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const chargerDetailGroupe = async (id) => {
    try {
      const res = await api.get(`/api/prof/groupes/${id}`);
      if (!res.ok) throw new Error('Erreur chargement détail groupe');

      const data = await res.json();
      setGroupeSelectionne(data.groupe);
      setDialogDetail(true);
    } catch (err) {
      console.error('Erreur chargement détail groupe:', err);
      afficherSnackbar('Erreur lors du chargement des détails', 'error');
    }
  };

  const afficherSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const creerGroupe = async () => {
    if (!nouveauGroupe.nom.trim()) {
      afficherSnackbar('Le nom du groupe est requis', 'error');
      return;
    }

    try {
      const res = await api.post('/api/prof/groupes', nouveauGroupe);
      if (!res.ok) throw new Error('Erreur création groupe');

      afficherSnackbar('Groupe créé avec succès !');
      setDialogCreer(false);
      setNouveauGroupe({ nom: '', description: '', couleur: '#1976d2' });
      chargerDonnees();
    } catch (err) {
      console.error('Erreur création groupe:', err);
      afficherSnackbar('Erreur lors de la création', 'error');
    }
  };

  const supprimerGroupe = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce groupe ? Tous les membres seront retirés.')) {
      return;
    }

    try {
      const res = await api.delete(`/api/prof/groupes/${id}`);
      if (!res.ok) throw new Error('Erreur suppression groupe');

      afficherSnackbar('Groupe supprimé');
      setDialogDetail(false);
      navigate('/prof/groupes');
      chargerDonnees();
    } catch (err) {
      console.error('Erreur suppression groupe:', err);
      afficherSnackbar('Erreur lors de la suppression', 'error');
    }
  };

  const ajouterMembreGroupe = async () => {
    if (!eleveAAjouter || !groupeSelectionne) return;

    try {
      const res = await api.post(
        `/api/prof/groupes/${groupeSelectionne.id}/membres`,
        { eleve_id: eleveAAjouter.id }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur ajout membre');
      }

      afficherSnackbar('Élève ajouté au groupe');
      setDialogAjouterMembre(false);
      setEleveAAjouter(null);
      chargerDetailGroupe(groupeSelectionne.id);
      chargerDonnees();
    } catch (err) {
      console.error('Erreur ajout membre:', err);
      afficherSnackbar(err.message, 'error');
    }
  };

  const retirerMembreGroupe = async (eleveId) => {
    if (!groupeSelectionne) return;

    if (!window.confirm('Retirer cet élève du groupe ?')) {
      return;
    }

    try {
      const res = await api.delete(
        `/api/prof/groupes/${groupeSelectionne.id}/membres/${eleveId}`
      );

      if (!res.ok) throw new Error('Erreur retrait membre');

      afficherSnackbar('Élève retiré du groupe');
      chargerDetailGroupe(groupeSelectionne.id);
      chargerDonnees();
    } catch (err) {
      console.error('Erreur retrait membre:', err);
      afficherSnackbar('Erreur lors du retrait', 'error');
    }
  };

  const getElevesNonMembres = () => {
    if (!groupeSelectionne) return eleves;

    const membreIds = new Set(groupeSelectionne.membres?.map(m => m.eleve.id) || []);
    return eleves.filter(e => !membreIds.has(e.id));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Mes Groupes
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Organisez vos élèves en groupes ou classes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogCreer(true)}
          size="large"
        >
          Nouveau groupe
        </Button>
      </Box>

      {/* Liste des groupes */}
      {groupes.length === 0 ? (
        <Alert severity="info">
          Vous n'avez pas encore de groupes. Créez-en un pour organiser vos élèves !
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {groupes.map((groupe) => (
            <Grid item xs={12} sm={6} md={4} key={groupe.id}>
              <Card
                sx={{
                  height: '100%',
                  borderLeft: `6px solid ${groupe.couleur}`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: `${groupe.couleur}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}
                    >
                      <GroupIcon sx={{ color: groupe.couleur, fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6">{groupe.nom}</Typography>
                  </Box>

                  {groupe.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                      {groupe.description}
                    </Typography>
                  )}

                  <Chip
                    label={`${groupe.nombre_eleves || 0} élève${groupe.nombre_eleves > 1 ? 's' : ''}`}
                    size="small"
                    sx={{ bgcolor: `${groupe.couleur}30` }}
                  />
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => navigate(`/prof/groupes/${groupe.id}`)}
                  >
                    Gérer
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog création groupe */}
      <Dialog open={dialogCreer} onClose={() => setDialogCreer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <GroupIcon sx={{ mr: 1 }} />
            Nouveau groupe
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Nom du groupe"
              fullWidth
              value={nouveauGroupe.nom}
              onChange={(e) => setNouveauGroupe({ ...nouveauGroupe, nom: e.target.value })}
              placeholder="Ex: Débutants 2024, Groupe A..."
              sx={{ mb: 3 }}
              autoFocus
            />

            <TextField
              label="Description (optionnel)"
              multiline
              rows={3}
              fullWidth
              value={nouveauGroupe.description}
              onChange={(e) => setNouveauGroupe({ ...nouveauGroupe, description: e.target.value })}
              placeholder="Description du groupe..."
              sx={{ mb: 3 }}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PaletteIcon sx={{ mr: 1, fontSize: 20 }} />
                Couleur du groupe
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {COULEURS_PREDEFINIES.map((couleur) => (
                  <Box
                    key={couleur.valeur}
                    onClick={() => setNouveauGroupe({ ...nouveauGroupe, couleur: couleur.valeur })}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: couleur.valeur,
                      cursor: 'pointer',
                      border: nouveauGroupe.couleur === couleur.valeur ? '4px solid #000' : '2px solid #ddd',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                    title={couleur.nom}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCreer(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={creerGroupe}
            disabled={!nouveauGroupe.nom.trim()}
            startIcon={<AddIcon />}
          >
            Créer le groupe
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog détails groupe */}
      <Dialog
        open={dialogDetail}
        onClose={() => {
          setDialogDetail(false);
          navigate('/prof/groupes');
        }}
        maxWidth="md"
        fullWidth
      >
        {groupeSelectionne && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: `${groupeSelectionne.couleur}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <GroupIcon sx={{ color: groupeSelectionne.couleur, fontSize: 28 }} />
                  </Box>
                  <div>
                    <Typography variant="h6">{groupeSelectionne.nom}</Typography>
                    {groupeSelectionne.description && (
                      <Typography variant="body2" color="textSecondary">
                        {groupeSelectionne.description}
                      </Typography>
                    )}
                  </div>
                </Box>
                <Chip
                  label={`${groupeSelectionne.membres?.length || 0} membre${groupeSelectionne.membres?.length > 1 ? 's' : ''}`}
                  sx={{ bgcolor: `${groupeSelectionne.couleur}30` }}
                />
              </Box>
            </DialogTitle>

            <DialogContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Membres du groupe
                </Typography>
                <Button
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setDialogAjouterMembre(true)}
                  disabled={getElevesNonMembres().length === 0}
                >
                  Ajouter un élève
                </Button>
              </Box>

              {groupeSelectionne.membres?.length === 0 ? (
                <Alert severity="info">Ce groupe n'a pas encore de membres.</Alert>
              ) : (
                <List>
                  {groupeSelectionne.membres?.map((membre, index) => (
                    <React.Fragment key={membre.eleve.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={membre.eleve.avatar_url} sx={{ bgcolor: groupeSelectionne.couleur }}>
                            {membre.eleve.prenom?.[0]}{membre.eleve.nom?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${membre.eleve.prenom} ${membre.eleve.nom}`}
                          secondary={`Niveau ${membre.eleve.niveau} • ${membre.eleve.xp_total || 0} XP`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => retirerMembreGroupe(membre.eleve.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>

            <DialogActions>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => supprimerGroupe(groupeSelectionne.id)}
              >
                Supprimer le groupe
              </Button>
              <Box flexGrow={1} />
              <Button onClick={() => {
                setDialogDetail(false);
                navigate('/prof/groupes');
              }}>
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog ajout membre */}
      <Dialog open={dialogAjouterMembre} onClose={() => setDialogAjouterMembre(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ajouter un élève</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ mt: 2 }}
            options={getElevesNonMembres()}
            getOptionLabel={(eleve) => `${eleve.prenom} ${eleve.nom}`}
            value={eleveAAjouter}
            onChange={(e, newValue) => setEleveAAjouter(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Sélectionner un élève" />
            )}
            renderOption={(props, eleve) => (
              <li {...props}>
                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                  {eleve.prenom?.[0]}{eleve.nom?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2">{eleve.prenom} {eleve.nom}</Typography>
                  <Typography variant="caption" color="textSecondary">Niveau {eleve.niveau}</Typography>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAjouterMembre(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={ajouterMembreGroupe}
            disabled={!eleveAAjouter}
            startIcon={<PersonAddIcon />}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default GroupesPage;
