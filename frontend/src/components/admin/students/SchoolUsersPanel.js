import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  InputAdornment,
  Tooltip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Archive as ArchiveIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useSchoolUsers } from '../../../hooks/useSchoolUsers';

const SchoolUsersPanel = () => {
  const { users, loading, fetchUsers, createUser, updateUser, deleteUser, archiveUser } = useSchoolUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Dialog States
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Success Dialog State
  const [successDialog, setSuccessDialog] = useState(null);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    role: 'eleve',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setEditMode(false);
    setFormData({ prenom: '', nom: '', email: '', role: 'eleve', password: '' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (user) => {
    setEditMode(true);
    setCurrentUser(user);
    setFormData({
      prenom: user.prenom,
      nom: user.nom,
      email: user.email || '',
      role: user.role,
      password: '' // Empty means no change
    });
    setOpenDialog(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      const result = await deleteUser(userId);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const handleArchive = async (userId) => {
    if (window.confirm("Voulez-vous archiver cet utilisateur ? Il n'aura plus accès mais ses données seront conservées.")) {
      const result = await archiveUser(userId);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.prenom || !formData.nom) {
        alert("Prénom et Nom sont requis");
        return;
    }

    // Validation email (format strict)
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Format d'email invalide");
      return;
    }

    if (editMode && currentUser) {
      const result = await updateUser(currentUser.id, formData);
      if (result.success) {
        setOpenDialog(false);
      } else {
        alert(result.error);
      }
    } else {
      const result = await createUser(formData);
      if (result.success) {
        setOpenDialog(false);
        // Show success credentials
        setSuccessDialog(result.data); 
      } else {
        alert(result.error);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copié !');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.prenom} ${user.nom} ${user.pseudo}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Gestion des Utilisateurs</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenCreate}
        >
          Nouvel Utilisateur
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2}>
          <TextField
            placeholder="Rechercher (nom, prénom, pseudo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={roleFilter}
              label="Rôle"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="eleve">Élèves</MenuItem>
              <MenuItem value="professeur">Professeurs</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Niveau/Info</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && users.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
               </TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user.id} hover sx={{ opacity: user.actif === false ? 0.6 : 1 }}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: user.role === 'professeur' ? 'secondary.main' : 'primary.main' }}>
                      {user.prenom?.[0]}{user.nom?.[0]}
                    </Avatar>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">{user.prenom} {user.nom}</Typography>
                        {user.actif === false && <Chip label="Archivé" size="small" color="default" sx={{ height: 20 }} />}
                      </Box>
                      <Typography variant="caption" color="textSecondary">{user.pseudo}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role === 'professeur' ? 'Professeur' : 'Élève'} 
                    size="small"
                    color={user.role === 'professeur' ? 'secondary' : 'default'}
                    icon={user.role === 'professeur' ? <SchoolIcon /> : <PersonIcon />}
                  />
                </TableCell>
                <TableCell>
                    {user.role === 'eleve' && (
                        <Chip label={`Niveau ${user.niveau || 1}`} size="small" variant="outlined" />
                    )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => handleOpenEdit(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {user.actif !== false && (
                    <Tooltip title="Archiver">
                        <IconButton size="small" color="warning" onClick={() => handleArchive(user.id)}>
                        <ArchiveIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Supprimer">
                    <IconButton size="small" color="error" onClick={() => handleDelete(user.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredUsers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} align="center">Aucun utilisateur trouvé</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Création/Édition */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
                <TextField 
                    label="Prénom" 
                    fullWidth 
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                />
                <TextField 
                    label="Nom" 
                    fullWidth 
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                />
            </Box>
            <TextField 
                label="Email" 
                fullWidth 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <FormControl fullWidth>
                <InputLabel>Rôle</InputLabel>
                <Select
                    value={formData.role}
                    label="Rôle"
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    disabled={editMode && formData.role === 'professeur'} // Empêcher modif role prof vers eleve si pas admin
                >
                    <MenuItem value="eleve">Élève</MenuItem>
                    <MenuItem value="professeur">Professeur</MenuItem>
                </Select>
            </FormControl>
            {!editMode && (
                <TextField 
                    label="Mot de passe initial" 
                    type="password"
                    fullWidth 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    helperText="Laisser vide pour générer automatiquement (NomEcoleAnnée!)"
                />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog with Credentials */}
      <Dialog open={!!successDialog} onClose={() => setSuccessDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon /> Utilisateur créé avec succès !
        </DialogTitle>
        <DialogContent>
            {successDialog && (
                <Box>
                    <Typography paragraph>
                        Voici les informations de connexion pour <strong>{successDialog.utilisateur?.prenom} {successDialog.utilisateur?.nom}</strong>.
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Veuillez transmettre ces informations à l'utilisateur.
                    </Alert>
                    
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" color="textSecondary">Pseudo :</Typography>
                            <Typography fontWeight="bold">{successDialog.utilisateur?.pseudo}</Typography>
                        </Box>
                        {successDialog.utilisateur?.email && (
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body2" color="textSecondary">Email :</Typography>
                                <Typography fontWeight="bold">{successDialog.utilisateur?.email}</Typography>
                            </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="textSecondary">Mot de passe :</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontFamily="monospace" fontWeight="bold" sx={{ bgcolor: 'white', px: 1, borderRadius: 1 }}>
                                    {successDialog.defaultPassword}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(successDialog.defaultPassword)}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setSuccessDialog(null)} variant="contained" autoFocus>
                Fermer
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchoolUsersPanel;