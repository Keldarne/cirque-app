import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import FigureManager from '../../components/admin/catalog/FigureManager';
import DisciplineManager from '../../components/admin/catalog/DisciplineManager';
import SchoolSettings from '../../components/admin/catalog/SchoolSettings';

const CatalogAdminPage = () => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const ecoleId = user?.role === 'school_admin' ? user.ecole_id : null;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Administration du Catalogue
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gérez les figures, disciplines et paramètres pédagogiques de votre école.
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Figures & Contenu" />
          <Tab label="Disciplines" />
          <Tab label="Paramètres École" />
        </Tabs>
      </Paper>

      <Box sx={{ minHeight: 500 }}>
        {tabIndex === 0 && <FigureManager />}
        
        {tabIndex === 1 && (
          <DisciplineManager ecoleId={ecoleId} /> 
        )}
        
        {tabIndex === 2 && <SchoolSettings />}
      </Box>
    </Container>
  );
};

export default CatalogAdminPage;
