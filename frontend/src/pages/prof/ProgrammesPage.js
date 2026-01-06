import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useProgrammesProf, useDeleteProgramme } from '../../hooks/useProgrammes';
import CreateProgrammeDialog from '../../components/prof/CreateProgrammeDialog';
import AssignProgramModalV2 from '../../components/prof/AssignProgramModal';

function ProgrammesPage() {
  const { programmes, loading, error, refetch } = useProgrammesProf();
  const { deleteProgramme } = useDeleteProgramme();

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenAssignDialog = (programme) => {
    setSelectedProgramme(programme);
    setOpenAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedProgramme(null);
  };

  const handleDeleteProgramme = async (programmeId, programmeName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le programme "${programmeName}" ?`)) {
      return;
    }

    try {
      await deleteProgramme(programmeId);
      setSnackbar({
        open: true,
        message: 'Programme supprimé avec succès',
        severity: 'success'
      });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Erreur: ${err.message}`,
        severity: 'error'
      });
    }
  };

  const handleProgrammeCreated = () => {
    setOpenCreateDialog(false);
    setSnackbar({
      open: true,
      message: 'Programme créé avec succès',
      severity: 'success'
    });
    refetch();
  };

  const handleProgrammeAssigned = () => {
    handleCloseAssignDialog();
    setSnackbar({
      open: true,
      message: 'Programme assigné avec succès',
      severity: 'success'
    });
    refetch();
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Mes Programmes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Créez des programmes personnalisés et assignez-les à vos élèves
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Créer un Programme
        </Button>
      </Box>

      {/* Liste des programmes */}
      {programmes.length === 0 ? (
        <Alert severity="info">
          Vous n'avez pas encore créé de programmes. Commencez par créer votre premier programme !
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {programmes.map((programme) => (
            <Grid item xs={12} md={6} lg={4} key={programme.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h5" component="div">
                      {programme.nom}
                    </Typography>
                    {programme.est_modele && (
                      <Chip label="Modèle" size="small" color="primary" />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {programme.description || 'Aucune description'}
                  </Typography>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={`${programme.ProgrammesFigures?.length || 0} figure${
                        (programme.ProgrammesFigures?.length || 0) > 1 ? 's' : ''
                      }`}
                      size="small"
                      variant="outlined"
                    />
                    {(() => {
                      const uniqueStudentsCount = new Set(
                        programme.Assignations?.map(a => a.eleve_id) || []
                      ).size;
                      return (
                        <Chip
                          label={`${uniqueStudentsCount} élève${uniqueStudentsCount > 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      );
                    })()}
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AssignmentIcon />}
                      onClick={() => handleOpenAssignDialog(programme)}
                    >
                      Assigner
                    </Button>
                    <IconButton
                      size="small"
                      color="primary"
                      component={Link}
                      to={`/prof/programmes/${programme.id}`}
                      title="Voir les détails"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteProgramme(programme.id, programme.nom)}
                    title="Supprimer"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialogs */}
      <CreateProgrammeDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSuccess={handleProgrammeCreated}
      />

      {selectedProgramme && (
        <AssignProgramModalV2
          open={openAssignDialog}
          onClose={handleCloseAssignDialog}
          programme={selectedProgramme}
          onSuccess={handleProgrammeAssigned}
        />
      )}

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ProgrammesPage;
