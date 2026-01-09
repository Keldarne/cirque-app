import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { api } from '../../utils/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function AssignProgramModalV2({ open, onClose, programme, onSuccess }) {
  const [tabValue, setTabValue] = useState(0);
  const [eleves, setEleves] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [assignations, setAssignations] = useState({ groupes: [], individus: [] });
  const [selectedEleves, setSelectedEleves] = useState(new Set());
  const [selectedGroupes, setSelectedGroupes] = useState(new Set());
  const [initialEleves, setInitialEleves] = useState(new Set());
  const [initialGroupes, setInitialGroupes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchEleve, setSearchEleve] = useState('');
  const [searchGroupe, setSearchGroupe] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!open || !programme) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [elevesRes, groupesRes, assignationsRes] = await Promise.all([
          api.get('/api/prof/eleves'),
          api.get('/api/prof/groupes'),
          api.get(`/api/prof/programmes/${programme.id}/assignations`)
        ]);

        if (!elevesRes.ok || !groupesRes.ok || !assignationsRes.ok) {
          throw new Error('Erreur de chargement des données');
        }

        const elevesData = await elevesRes.json();
        const groupesData = await groupesRes.json();
        const assignationsData = await assignationsRes.json();

        setEleves(elevesData.eleves || []);
        setGroupes(groupesData.groupes || []);
        setAssignations(assignationsData);

        // Pré-sélectionner les élèves et groupes déjà assignés
        const preSelectedEleves = new Set(
          assignationsData.individus?.map(ind => ind.eleve_id) || []
        );
        const preSelectedGroupes = new Set(
          assignationsData.groupes?.map(grp => grp.id) || []
        );

        setSelectedEleves(preSelectedEleves);
        setSelectedGroupes(preSelectedGroupes);
        setInitialEleves(new Set(preSelectedEleves));
        setInitialGroupes(new Set(preSelectedGroupes));
      } catch (err) {
        console.error('Erreur chargement modal:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, programme]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const toggleEleve = (eleveId) => {
    const newSelected = new Set(selectedEleves);
    if (newSelected.has(eleveId)) {
      newSelected.delete(eleveId);
    } else {
      newSelected.add(eleveId);
    }
    setSelectedEleves(newSelected);
  };

  const toggleGroupe = (groupeId) => {
    const newSelected = new Set(selectedGroupes);
    if (newSelected.has(groupeId)) {
      newSelected.delete(groupeId);
    } else {
      newSelected.add(groupeId);
    }
    setSelectedGroupes(newSelected);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Calculer les deltas
      const elevesToAdd = Array.from(selectedEleves).filter(id => !initialEleves.has(id));
      const elevesToRemove = Array.from(initialEleves).filter(id => !selectedEleves.has(id));
      const groupesToAdd = Array.from(selectedGroupes).filter(id => !initialGroupes.has(id));
      const groupesToRemove = Array.from(initialGroupes).filter(id => !selectedGroupes.has(id));

      console.log('Deltas:', {
        elevesToAdd,
        elevesToRemove,
        groupesToAdd,
        groupesToRemove
      });

      // 1. Ajouter nouvelles assignations
      if (elevesToAdd.length > 0 || groupesToAdd.length > 0) {
        const addRes = await api.post(`/api/prof/programmes/${programme.id}/assigner`, {
          eleve_ids: elevesToAdd,
          groupe_ids: groupesToAdd
        });

        if (!addRes.ok) {
          const errorData = await addRes.json();
          throw new Error(errorData.error || 'Erreur lors de l\'assignation');
        }

        const addData = await addRes.json();
        console.log('Assignations ajoutées:', addData.results);
      }

      // 2. Retirer assignations décochées
      const removePromises = [];

      // Retirer élèves individuels
      for (const eleveId of elevesToRemove) {
        removePromises.push(
          api.delete(`/api/prof/programmes/${programme.id}/eleves/${eleveId}`)
            .then(res => {
              if (!res.ok) throw new Error(`Erreur retrait élève ${eleveId}`);
              return res.json();
            })
        );
      }

      // Retirer groupes
      for (const groupeId of groupesToRemove) {
        removePromises.push(
          api.delete(`/api/prof/programmes/${programme.id}/groupes/${groupeId}`)
            .then(res => {
              if (!res.ok) throw new Error(`Erreur retrait groupe ${groupeId}`);
              return res.json();
            })
        );
      }

      if (removePromises.length > 0) {
        await Promise.all(removePromises);
        console.log('Assignations retirées avec succès');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur assignation:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEleves = eleves.filter(eleve =>
    `${eleve.prenom} ${eleve.nom} ${eleve.email}`
      .toLowerCase()
      .includes(searchEleve.toLowerCase())
  );

  const filteredGroupes = groupes.filter(groupe =>
    groupe.nom.toLowerCase().includes(searchGroupe.toLowerCase())
  );

  const isEleveAssigned = (eleveId) => {
    return assignations.individus?.some(ind => ind.eleve_id === eleveId);
  };

  const isGroupeAssigned = (groupeId) => {
    return assignations.groupes?.some(grp => grp.id === groupeId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        Assigner le programme: {programme?.nom}
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab
                icon={<PersonIcon />}
                label={`Élèves (${selectedEleves.size})`}
                iconPosition="start"
              />
              <Tab
                icon={<GroupIcon />}
                label={`Groupes (${selectedGroupes.size})`}
                iconPosition="start"
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <TextField
                fullWidth
                placeholder="Rechercher un élève..."
                value={searchEleve}
                onChange={(e) => setSearchEleve(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />

              {filteredEleves.length === 0 ? (
                <Alert severity="info">
                  {searchEleve ? 'Aucun élève trouvé' : 'Aucun élève disponible'}
                </Alert>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredEleves.map(eleve => (
                    <ListItem
                      key={eleve.id}
                      dense
                      button
                      onClick={() => toggleEleve(eleve.id)}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedEleves.has(eleve.id)}
                            onChange={() => toggleEleve(eleve.id)}
                          />
                        }
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">
                              {eleve.prenom} {eleve.nom}
                            </Typography>
                            {isEleveAssigned(eleve.id) && (
                              <Chip label="Assigné" size="small" color="success" />
                            )}
                          </Box>
                        }
                      />
                      <ListItemText
                        secondary={eleve.email}
                        sx={{ textAlign: 'right' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TextField
                fullWidth
                placeholder="Rechercher un groupe..."
                value={searchGroupe}
                onChange={(e) => setSearchGroupe(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />

              {filteredGroupes.length === 0 ? (
                <Alert severity="info">
                  {searchGroupe ? 'Aucun groupe trouvé' : 'Aucun groupe disponible'}
                </Alert>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredGroupes.map(groupe => (
                    <ListItem
                      key={groupe.id}
                      dense
                      button
                      onClick={() => toggleGroupe(groupe.id)}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedGroupes.has(groupe.id)}
                            onChange={() => toggleGroupe(groupe.id)}
                          />
                        }
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: groupe.couleur || '#1976d2'
                              }}
                            />
                            <Typography variant="body1">{groupe.nom}</Typography>
                            {isGroupeAssigned(groupe.id) && (
                              <Chip label="Assigné" size="small" color="success" />
                            )}
                          </Box>
                        }
                      />
                      <ListItemText
                        secondary={`${groupe.nombre_eleves || 0} élève(s)`}
                        sx={{ textAlign: 'right' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedEleves.size} élève(s) et {selectedGroupes.size} groupe(s) sélectionné(s)
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || submitting}
        >
          {submitting ? <CircularProgress size={24} /> : 'Assigner'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssignProgramModalV2;
