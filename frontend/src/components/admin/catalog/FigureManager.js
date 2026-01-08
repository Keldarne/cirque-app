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
  useMediaQuery
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
  const [filteredFigures, setFilteredFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [openWizard, setOpenWizard] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchFigures();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredFigures(figures);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredFigures(figures.filter(f => 
        f.nom.toLowerCase().includes(lower) || 
        f.Discipline?.nom?.toLowerCase().includes(lower)
      ));
    }
  }, [searchQuery, figures]);

  const fetchFigures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/figures');
      if (res.ok) {
        const data = await res.json();
        setFigures(data);
        setFilteredFigures(data);
      }
    } catch (err) {
      console.error("Error fetching figures", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedFigure(null);
    setOpenWizard(true);
  };

  const handleEdit = (figure) => {
    // Need to fetch full details including etapes and prerequis? 
    // Usually the list endpoint might not return everything.
    // Let's assume we need to fetch details or we pass what we have.
    // Ideally FigureWizard or FigureManager fetches details.
    // I'll make FigureWizard fetch details if an ID is provided but initialData is partial?
    // Or better: fetch here.
    fetchFigureDetails(figure.id);
  };

  const fetchFigureDetails = async (id) => {
    try {
      // Parallel fetch figure and etapes
      const [figRes, etapesRes] = await Promise.all([
        api.get(`/api/figures/${id}`),
        api.get(`/api/figures/${id}/etapes`)
      ]);
      
      if (figRes.ok && etapesRes.ok) {
        const figData = await figRes.json();
        const etapesData = await etapesRes.json();
        
        const fullFigure = {
            ...figData.figure, 
            etapes: etapesData
            // prerequis: ... (If API supports it, add here)
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
        fetchFigures(); // Refresh
      } catch (err) {
        console.error("Error deleting figure", err);
      }
    }
  };

  const handleSaveSuccess = () => {
    fetchFigures();
    setOpenWizard(false);
  };

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
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Discipline</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFigures.map((figure) => (
              <TableRow key={figure.id} hover>
                <TableCell component="th" scope="row">
                  <Typography variant="subtitle2">{figure.nom}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={figure.Discipline?.nom || 'Autre'} 
                    size="small" 
                    variant="outlined" 
                  />
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
            {filteredFigures.length === 0 && (
               <TableRow>
                 <TableCell colSpan={5} align="center">
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
