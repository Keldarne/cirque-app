import React from 'react';
import { useSuggestionsGroupe } from '../../../hooks/useSuggestionsGroupe';
import {
  Paper,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LinearProgress,
  Button,
  Box,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function SuggestionsGroupeWidget({ groupeId, groupeNom }) {
  const { suggestions, loading, error, assignerFigure } = useSuggestionsGroupe(groupeId);

  const handleAssigner = async (figureId, figureName) => {
    const result = await assignerFigure(figureId);
    if (result.success) {
      console.log(`${figureName} assignée au groupe`);
      // Feedback UI pourrait être ajouté ici (snackbar)
    } else {
      console.error(result.error);
    }
  };

  if (!groupeId) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Sélectionnez un groupe dans les filtres pour voir les suggestions personnalisées.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (suggestions.length === 0) {
    return (
      <Alert severity="info">
        Aucune suggestion spécifique pour ce groupe actuellement (tous les élèves prêts ont déjà les figures ou pas assez d'élèves prêts).
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Figure Suggérée</TableCell>
            <TableCell>Préparation Groupe</TableCell>
            <TableCell>Détails</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suggestions.map((suggestion) => (
            <TableRow key={suggestion.figure_id} hover>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  {suggestion.nom}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {suggestion.descriptif}
                </Typography>
              </TableCell>

              <TableCell>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight="bold">
                      {suggestion.pourcentage_groupe_pret}% prêts
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={suggestion.pourcentage_groupe_pret} 
                    color={suggestion.pourcentage_groupe_pret >= 80 ? "success" : "primary"}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                </Box>
              </TableCell>

              <TableCell>
                <Tooltip title={`Élèves prêts: ${suggestion.eleves_prets.join(', ')}`}>
                  <Typography variant="caption" sx={{ cursor: 'help', borderBottom: '1px dotted' }}>
                    {suggestion.nb_eleves_prets}/{suggestion.nb_eleves_total} élèves
                  </Typography>
                </Tooltip>
              </TableCell>

              <TableCell align="right">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleAssigner(suggestion.figure_id, suggestion.nom)}
                  sx={{ textTransform: 'none' }}
                >
                  Assigner
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SuggestionsGroupeWidget;
