import React from 'react';
import { Container, Alert, Box, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import CatalogAdminPage from './CatalogAdminPage';

function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Container sx={{ mt: 4 }}><Typography>Chargement...</Typography></Container>;
  }

  if (!user) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">Accès non autorisé.</Alert></Container>;
  }
  
  const isMasterAdmin = user.role === 'admin';
  const isSchoolAdmin = user.role === 'school_admin';

  if (!isMasterAdmin && !isSchoolAdmin) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">
          Vous n'avez pas les permissions nécessaires pour accéder à l'administration.
        </Alert>
      </Container>
    );
  }

  // Nous déléguons l'affichage principal au nouveau composant de gestion
  // qui intègre les onglets (Figures, Disciplines, Paramètres)
  return (
    <Box>
      <CatalogAdminPage />
    </Box>
  );
}

export default AdminPage;
