import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper
} from '@mui/material';
import FigureManager from './FigureManager';
import DisciplineManager from './DisciplineManager';
import SchoolSettings from './SchoolSettings';
import { useAuth } from '../../../contexts/AuthContext';

const CatalogPanel = () => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Les profs et school_admins voient uniquement leur école.
  // Seul le 'admin' (propriétaire) voit le catalogue global (null).
  const ecoleId = (user?.role === 'school_admin' || user?.role === 'professeur') ? user.ecole_id : null;
  const isGlobalAdmin = user?.role === 'admin';

  return (
    <Box>
       <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Gestion du Catalogue
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {isGlobalAdmin 
            ? "Gérez le catalogue public global et les disciplines." 
            : "Gérez les figures spécifiques à votre école."}
        </Typography>

      <Paper sx={{ mb: 3 }} variant="outlined">
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Figures" />
          <Tab label="Disciplines" />
          {/* Les paramètres d'école sont gérés dans un onglet séparé au niveau AdminPage pour plus de clarté, 
              mais on pourrait les garder ici si nécessaire. Pour l'instant on se concentre sur le contenu. */}
        </Tabs>
      </Paper>

      <Box sx={{ minHeight: 400 }}>
        {tabIndex === 0 && <FigureManager />}
        
        {tabIndex === 1 && (
          <DisciplineManager ecoleId={ecoleId} /> 
        )}
      </Box>
    </Box>
  );
};

export default CatalogPanel;
