import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { api } from '../../utils/api';
import ProgressBar from '../common/ProgressBar';
import StateBadge from '../common/StateBadge';
import MemoryDecayIndicator from '../common/MemoryDecayIndicator';

/**
 * StudentProgressDialog - Modal affichant la progression de tous les élèves sur une figure
 * Suit les specs de figma.md section 3.5
 * Réservé aux professeurs
 *
 * @param {boolean} open - Dialog ouvert
 * @param {object} figure - Données de la figure
 * @param {number} figureId - ID de la figure
 * @param {function} onClose - Callback fermeture
 */
function StudentProgressDialog({
  open,
  figure = null,
  figureId,
  onClose
}) {
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const loadStudentProgressions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Endpoint à créer côté backend: GET /prof/figures/:id/progressions
      const response = await api.get(`/api/prof/figures/${figureId}/progressions`);
      const data = await response.json();

      setProgressions(data.progressions || []);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement progressions élèves:', error);
      setError('Impossible de charger les progressions des élèves');
      setLoading(false);
    }
  }, [figureId]);

  // Charger les progressions de tous les élèves
  useEffect(() => {
    if (open && figureId) {
      loadStudentProgressions();
    }
  }, [open, figureId, loadStudentProgressions]);

  // Calculer statistiques globales
  const stats = {
    total: progressions.length,
    validees: progressions.filter(p => p.etat === 'validée').length,
    enCours: progressions.filter(p => p.etat === 'en_cours').length,
    nonCommencees: progressions.filter(p => p.etat === 'non_commencée').length,
    moyenneProgression: progressions.length > 0
      ? Math.round(progressions.reduce((sum, p) => sum + (p.pourcentage_progression || 0), 0) / progressions.length)
      : 0
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      {/* Header */}
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box>
            <Typography variant="h6">
              Progression des élèves
            </Typography>
            {figure && (
              <Typography variant="body2" color="text.secondary">
                {figure.nom}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* Statistiques globales */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Vue d'ensemble
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  label={`Total: ${stats.total} élèves`}
                  color="default"
                />
                <Chip
                  label={`✅ Validées: ${stats.validees}`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  label={`🔄 En cours: ${stats.enCours}`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  label={`⏸️ Non commencées: ${stats.nonCommencees}`}
                  color="default"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <ProgressBar
                  value={stats.moyenneProgression}
                  label={`Progression moyenne`}
                  showPercentage={true}
                  size="medium"
                />
              </Box>
            </Box>

            {/* Tableau des élèves */}
            {progressions.length === 0 ? (
              <Alert severity="info">
                Aucun élève n'a encore commencé cette figure
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Élève</strong></TableCell>
                      <TableCell><strong>État</strong></TableCell>
                      <TableCell><strong>Progression</strong></TableCell>
                      <TableCell><strong>Étapes validées</strong></TableCell>
                      <TableCell><strong>Dernière validation</strong></TableCell>
                      <TableCell><strong>Mémoire</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {progressions.map((prog) => (
                      <TableRow key={prog.eleve_id} hover>
                        {/* Nom élève */}
                        <TableCell>
                          <Typography variant="body2">
                            {prog.Utilisateur?.prenom} {prog.Utilisateur?.nom}
                          </Typography>
                        </TableCell>

                        {/* État */}
                        <TableCell>
                          <StateBadge etat={prog.etat} variant="chip" size="small" />
                        </TableCell>

                        {/* Progression */}
                        <TableCell sx={{ minWidth: 150 }}>
                          <ProgressBar
                            value={prog.pourcentage_progression || 0}
                            showPercentage={true}
                            size="small"
                          />
                        </TableCell>

                        {/* Étapes validées */}
                        <TableCell>
                          <Typography variant="body2">
                            {prog.etapes_validees || 0} / {prog.Figure?.nb_etapes || '?'}
                          </Typography>
                        </TableCell>

                        {/* Dernière validation */}
                        <TableCell>
                          {prog.date_derniere_validation || prog.date_validation ? (
                            <Typography variant="body2" color="text.secondary">
                              {new Date(prog.date_derniere_validation || prog.date_validation).toLocaleDateString('fr-FR')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              Jamais
                            </Typography>
                          )}
                        </TableCell>

                        {/* Indicateur mémoire */}
                        <TableCell>
                          {prog.etat === 'validée' && (prog.date_derniere_validation || prog.date_validation) ? (
                            <MemoryDecayIndicator
                              dateValidation={prog.date_derniere_validation || prog.date_validation}
                              variant="chip"
                              size="small"
                            />
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StudentProgressDialog;
