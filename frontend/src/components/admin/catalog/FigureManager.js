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
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

import { api } from '../../../utils/api';
import FigureWizard from './FigureWizard';
import { useAuth } from '../../../contexts/AuthContext';

const FigureManager = () => {
  const { user } = useAuth();
  const [figures, setFigures] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [schools, setSchools] = useState([]);
  const [filteredFigures, setFilteredFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('all');
  const [selectedSchoolId, setSelectedSchoolId] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [openWizard, setOpenWizard] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    let result = figures;

    // Filter by search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.nom.toLowerCase().includes(lower) || 
        f.Discipline?.nom?.toLowerCase().includes(lower)
      );
    }

    // Filter by discipline
    if (selectedDisciplineId !== 'all') {
      result = result.filter(f => f.discipline_id === selectedDisciplineId);
    }

    // Filter by school/catalog
    if (selectedSchoolId !== 'all') {
      if (selectedSchoolId === 'public') {
        result = result.filter(f => f.ecole_id === null || f.ecole_id === undefined);
      } else if (selectedSchoolId === 'my_school') {
        if (user?.ecole_id) {
           result = result.filter(f => f.ecole_id === user.ecole_id);
        }
      } else if (user?.role === 'admin') {
        result = result.filter(f => f.ecole_id === parseInt(selectedSchoolId));
      }
    }

    setFilteredFigures(result);
    setPage(0); // Reset to first page on filter change
  }, [searchQuery, selectedDisciplineId, selectedSchoolId, figures, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Utiliser l'endpoint approprié selon le rôle
      const figuresEndpoint = (user?.role === 'professeur' || user?.role === 'school_admin')
        ? '/api/prof/figures'
        : '/api/figures';

      const promises = [
        api.get(figuresEndpoint),
        api.get('/api/disciplines')
      ];

      // Fetch schools only for admin
      if (user?.role === 'admin') {
        promises.push(api.get('/api/admin/ecoles'));
      }

      const results = await Promise.all(promises);
      const figuresRes = results[0];
      const disciplinesRes = results[1];
      const schoolsRes = user?.role === 'admin' ? results[2] : null;

      if (figuresRes.ok) {
        const data = await figuresRes.json();
        if (Array.isArray(data)) {
          setFigures(data);
        }
      }
      if (disciplinesRes.ok) {
        setDisciplines(await disciplinesRes.json());
      }
      if (schoolsRes && schoolsRes.ok) {
        setSchools(await schoolsRes.json());
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedFigure(null);
    setOpenWizard(true);
  };

  const handleEdit = (figure) => {
    fetchFigureDetails(figure.id);
  };

  const fetchFigureDetails = async (id) => {
    try {
      // Parallel fetch figure, etapes, and prerequisites
      const [figRes, etapesRes, exercicesRes] = await Promise.all([
        api.get(`/api/figures/${id}`),
        api.get(`/api/figures/${id}/etapes`),
        api.get(`/api/admin/exercices/figures/${id}/exercices`)
      ]);
      
      if (figRes.ok && etapesRes.ok) {
        const figData = await figRes.json();
        const etapesData = await etapesRes.json();
        
        // Handle prerequisites if the request was successful
        let prerequisIds = [];
        let prerequisObjects = [];
        
        if (exercicesRes.ok) {
          const exercicesData = await exercicesRes.json();
          // The API returns { exercices: [...] } where each item has "exercice" (the figure details)
          if (exercicesData.exercices) {
            prerequisIds = exercicesData.exercices.map(ex => ex.exercice.id);
            prerequisObjects = exercicesData.exercices.map(ex => ex.exercice);
          }
        }
        
        const fullFigure = {
            ...figData.figure, 
            etapes: etapesData,
            prerequis: prerequisIds,
            prerequisObjects: prerequisObjects
        };
        
        setSelectedFigure(fullFigure);
        setOpenWizard(true);
      }
    } catch (err) {
      console.error("Error loading figure details", err);
      alert("Impossible de charger les détails de la figure");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette figure ?")) {
      try {
        // Utiliser l'endpoint approprié selon le rôle
        const endpoint = (user?.role === 'professeur' || user?.role === 'school_admin')
          ? `/api/prof/figures/${id}`
          : `/api/admin/figures/${id}`;

        const res = await api.delete(endpoint);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        fetchData(); // Refresh both lists
      } catch (err) {
        console.error("Error deleting figure", err);
        alert(`Impossible de supprimer la figure: ${err.message}`);
      }
    }
  };

  const handleSaveSuccess = () => {
    fetchData();
    setOpenWizard(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Pagination calculation
  const paginatedFigures = filteredFigures.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          {user?.role === 'admin' ? "Catalogue Global" : "Catalogue de mon École"}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleCreate}
        >
          Nouvelle Figure
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher une figure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
          />
          
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Discipline</InputLabel>
            <Select
              value={selectedDisciplineId}
              label="Discipline"
              onChange={(e) => setSelectedDisciplineId(e.target.value)}
            >
              <MenuItem value="all">Toutes</MenuItem>
              {disciplines.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {user?.role === 'admin' ? (
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>École / Catalogue</InputLabel>
              <Select
                value={selectedSchoolId}
                label="École / Catalogue"
                onChange={(e) => setSelectedSchoolId(e.target.value)}
              >
                <MenuItem value="all">Tout voir</MenuItem>
                <MenuItem value="public">Catalogue Public</MenuItem>
                {schools.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
             <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>Catalogue</InputLabel>
              <Select
                value={selectedSchoolId}
                label="Catalogue"
                onChange={(e) => setSelectedSchoolId(e.target.value)}
              >
                <MenuItem value="all">Tout voir</MenuItem>
                <MenuItem value="public">Catalogue Public</MenuItem>
                <MenuItem value="my_school">Mon École</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Discipline</TableCell>
              {user?.role === 'admin' && <TableCell>École</TableCell>}
              <TableCell>Niveau</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFigures.map((figure) => {
              // Logique de permission pour l'édition/suppression
              const isPublic = figure.ecole_id === null;
              const isMySchool = user?.ecole_id && figure.ecole_id === user.ecole_id;
              const isAdmin = user?.role === 'admin';
              
              // On peut modifier si on est Admin OU si la figure appartient à notre école
              const canEdit = isAdmin || isMySchool;

              // Find school name for admin
              let schoolName = 'Public';
              if (user?.role === 'admin' && figure.ecole_id) {
                  const school = schools.find(s => s.id === figure.ecole_id);
                  schoolName = school ? school.nom : 'École Inconnue';
              }

              return (
                <TableRow key={figure.id} hover>
                  <TableCell component="th" scope="row">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">{figure.nom}</Typography>
                      {!isAdmin && isPublic && (
                        <Chip label="Public" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={figure.Discipline?.nom || 'Inconnue'} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Chip 
                        label={schoolName} 
                        size="small" 
                        color={isPublic ? "primary" : "default"}
                        variant={isPublic ? "filled" : "outlined"}
                        sx={{ height: 24, fontSize: '0.75rem' }} 
                      />
                    </TableCell>
                  )}
                  <TableCell>{figure.difficulty_level}/10</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {figure.type}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={canEdit ? "Modifier" : "Lecture seule (Catalogue Public)"}>
                      <span>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(figure)}
                          disabled={!canEdit}
                        >
                          <EditIcon color={canEdit ? "action" : "disabled"} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={canEdit ? "Supprimer" : "Impossible de supprimer une figure publique"}>
                      <span>
                        <IconButton 
                          size="small" 
                          color={canEdit ? "error" : "disabled"} 
                          onClick={() => handleDelete(figure.id)}
                          disabled={!canEdit}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {paginatedFigures.length === 0 && (
               <TableRow>
                 <TableCell colSpan={user?.role === 'admin' ? 6 : 5} align="center" sx={{ py: 3 }}>
                   <Typography color="textSecondary">Aucune figure trouvée</Typography>
                 </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredFigures.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page"
        />
      </TableContainer>

      <Dialog 
        open={openWizard} 
        onClose={() => setOpenWizard(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={fullScreen}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedFigure ? `Modifier "${selectedFigure.nom}"` : 'Créer une nouvelle figure'}
          <IconButton onClick={() => setOpenWizard(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
           <FigureWizard 
             initialData={selectedFigure} 
             onClose={() => setOpenWizard(false)}
             onSaveSuccess={handleSaveSuccess}
           />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FigureManager;
