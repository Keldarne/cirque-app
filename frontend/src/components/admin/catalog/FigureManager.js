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
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

import { api } from '../../../utils/api';
import FigureWizard from './FigureWizard';

const FigureManager = () => {
  const [figures, setFigures] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [filteredFigures, setFilteredFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('all');
  
  const [openWizard, setOpenWizard] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchData();
  }, []);

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

    setFilteredFigures(result);
  }, [searchQuery, selectedDisciplineId, figures]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [figuresRes, disciplinesRes] = await Promise.all([
        api.get('/api/figures'),
        api.get('/api/disciplines')
      ]);

      if (figuresRes.ok) {
        setFigures(await figuresRes.json());
      }
      if (disciplinesRes.ok) {
        setDisciplines(await disciplinesRes.json());
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
        await api.delete(`/api/admin/figures/${id}`);
        fetchData(); // Refresh both lists
      } catch (err) {
        console.error("Error deleting figure", err);
      }
    }
  };

  const handleSaveSuccess = () => {
    fetchData();
    setOpenWizard(false);
  };

  // Group figures by discipline for display
  const groupedFigures = filteredFigures.reduce((acc, figure) => {
    const discName = figure.Discipline?.nom || 'Sans Discipline';
    if (!acc[discName]) acc[discName] = [];
    acc[discName].push(figure);
    return acc;
  }, {});

  const sortedDisciplineNames = Object.keys(groupedFigures).sort();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Catalogue des Figures</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleCreate}
        >
          Nouvelle Figure
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2}>
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
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDisciplineNames.map(disciplineName => (
              <React.Fragment key={disciplineName}>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>
                    {disciplineName} ({groupedFigures[disciplineName].length})
                  </TableCell>
                </TableRow>
                {groupedFigures[disciplineName].map((figure) => (
                  <TableRow key={figure.id} hover>
                    <TableCell component="th" scope="row" sx={{ pl: 4 }}>
                      <Typography variant="body2">{figure.nom}</Typography>
                    </TableCell>
                    <TableCell>{figure.difficulty_level}/10</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {figure.type}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEdit(figure)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" color="error" onClick={() => handleDelete(figure.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            
            {filteredFigures.length === 0 && (
               <TableRow>
                 <TableCell colSpan={4} align="center">
                   Aucune figure trouvée
                 </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
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
