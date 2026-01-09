import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';

const SchoolSettings = () => {
  return (
    <Box>
       <Typography variant="h6" gutterBottom>Paramètres de l'École</Typography>
       <Paper sx={{ p: 3 }}>
         <Alert severity="info">
           Configuration spécifique à l'école (Logo, Thème, Année scolaire) - À venir.
         </Alert>
       </Paper>
    </Box>
  );
};

export default SchoolSettings;
