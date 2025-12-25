import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { api } from '../../utils/api';
import FigureForm from './FigureForm';
import { useAuth } from '../../contexts/AuthContext';
import { useRefresh } from '../../contexts/RefreshContext';

function FigureEditor({ scopedEcoleId = null }) {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useRefresh(); // Utiliser le contexte de rafraîchissement
  const [figures, setFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchFigures = async () => {
      try {
        setLoading(true);
        let url = '/api/figures';
        if (user?.role === 'admin' && scopedEcoleId) {
            const ecoleIdQuery = scopedEcoleId === 'public' ? 'null' : scopedEcoleId;
            url = `/api/admin/figures?ecole_id=${ecoleIdQuery}`;
        }

        const res = await api.get(url);
        if (!res.ok) throw new Error('Erreur de chargement des figures');
        const data = await res.json();
        setFigures(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFigures();
  }, [scopedEcoleId, refreshKey, user]); // Re-fetch quand le scope ou la clé de rafraîchissement change

  const handleOpenModal = (figure = null) => {
    setEditingFigure(figure);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingFigure(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData) => {
    try {
      const dataToSave = { ...formData };
      let response;

      if (editingFigure) {
        response = await api.put(`/api/admin/figures/${editingFigure.id}`, dataToSave);
      } else {
        if (user?.role === 'admin' && scopedEcoleId && scopedEcoleId !== 'public') {
            dataToSave.ecole_id = scopedEcoleId;
        }
        response = await api.post('/api/admin/figures', dataToSave);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      setSnackbar({ open: true, message: `Figure ${editingFigure ? 'modifiée' : 'ajoutée'} avec succès !`, severity: 'success' });
      handleCloseModal();
      triggerRefresh(); // Déclencher le rafraîchissement global
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Catalogue de Figures</Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => handleOpenModal()}
          >
            Ajouter une Figure
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Discipline</TableCell>
                <TableCell>Portée</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {figures.map((figure) => (
                <TableRow key={figure.id}>
                  <TableCell>{figure.nom}</TableCell>
                  <TableCell>{figure.Discipline?.nom || 'N/A'}</TableCell>
                  <TableCell>{figure.ecole_id ? 'École' : 'Publique'}</TableCell>
                  <TableCell>
                    <Button 
                      size="small"
                      onClick={() => handleOpenModal(figure)}
                    >
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingFigure ? 'Modifier la Figure' : 'Ajouter une Figure'}</DialogTitle>
        <DialogContent>
          <FigureForm 
            figure={editingFigure}
            onSave={handleSave}
            onCancel={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default FigureEditor;
