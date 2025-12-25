import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Alert, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../../contexts/AuthContext';
import FigureEditor from '../../components/admin/FigureEditor';
import { api } from '../../utils/api';

function AdminPage() {
  const { user, isLoading } = useAuth();
  const [ecoles, setEcoles] = useState([]);
  const [selectedScope, setSelectedScope] = useState('public'); // 'public' ou un ecole_id

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchEcoles = async () => {
        try {
          const res = await api.get('/api/admin/ecoles');
          if (res.ok) {
            const data = await res.json();
            setEcoles(data);
          }
        } catch (error) {
          console.error("Impossible de charger les écoles", error);
        }
      };
      fetchEcoles();
    }
  }, [user]);

  if (isLoading) {
    return <Container sx={{ mt: 4 }}><Typography>Chargement...</Typography></Container>;
  }

  if (!user) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">Accès non autorisé.</Alert></Container>;
  }
  
  const isMasterAdmin = user.role === 'admin';
  const isSchoolAdmin = user.role === 'school_admin';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h3">
          Administration
        </Typography>
      </Box>

      {isMasterAdmin && (
        <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Vue Master Admin</Typography>
          <FormControl fullWidth>
            <InputLabel id="scope-select-label">Changer de catalogue</InputLabel>
            <Select
              labelId="scope-select-label"
              value={selectedScope}
              label="Changer de catalogue"
              onChange={(e) => setSelectedScope(e.target.value)}
            >
              <MenuItem value="public">Catalogue Public</MenuItem>
              {ecoles.map((ecole) => (
                <MenuItem key={ecole.id} value={ecole.id}>
                  {ecole.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}
      
      {isSchoolAdmin && (
         <Paper elevation={2} sx={{ p: 2, mb: 4, backgroundColor: 'secondary.light' }}>
          <Typography variant="h6">Vue Admin d'École</Typography>
          <Typography variant="body2">
            Vous gérez le catalogue de figures de votre école.
          </Typography>
        </Paper>
      )}

      {(isMasterAdmin || isSchoolAdmin) ? (
        <FigureEditor key={selectedScope} scopedEcoleId={isMasterAdmin ? selectedScope : null} />
      ) : (
        <Alert severity="warning">
          Vous n'avez pas les permissions nécessaires pour voir cette page.
        </Alert>
      )}
    </Container>
  );
}

export default AdminPage;
