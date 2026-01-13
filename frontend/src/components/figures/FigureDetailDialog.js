import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  useMediaQuery,
  useTheme,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Close as CloseIcon, FitnessCenter as FitnessCenterIcon, Checklist as ChecklistIcon } from '@mui/icons-material';
import EtapesProgressionList from './EtapesProgressionList';
import JournalProgression from './JournalProgression';
import MetadataViewer from './metadata/MetadataViewer';
import { isValidUrl } from '../../utils/validators';

/**
 * FigureDetailDialog - Modal détails d'une figure avec onglets
 * Suit les specs de figma.md section 3.1
 *
 * @param {boolean} open - Dialog ouvert
 * @param {object} figure - Données de la figure
 * @param {object} progression - Données de progression utilisateur
 * @param {function} onClose - Callback fermeture
 * @param {boolean} showEtapesProgression - Afficher onglet étapes
 * @param {boolean} showJournal - Afficher onglet journal
 * @param {function} onValidateStep - Callback validation étape
 * @param {boolean} editable - Mode édition étapes
 */
function FigureDetailDialog({
  open,
  figure,
  progression = null,
  onClose,
  showEtapesProgression = true,
  showJournal = true,
  onValidateStep,
  editable = false
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabIndex, setTabIndex] = useState(0);
  
  // Selection mode for training specific steps
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedStepIds, setSelectedStepIds] = useState([]);

  if (!figure) return null;

  // Normalisation des données de la figure et progression
  const figureId = figure.id || figure.figure_id;
  const nom = figure.nom || figure.figure_nom;
  const descriptif = figure.descriptif || figure.figure_description || figure.description;
  
  // Les étapes peuvent être dans figure.EtapesProgressions ou figure.etapes (format API progression)
  const etapesTheoriques = figure.EtapesProgressions || (figure.etapes?.map(e => e.etape)) || [];
  
  // Les étapes utilisateur peuvent être dans le prop progression ou directement dans figure.etapes
  const etapesUtilisateur = progression?.EtapesUtilisateurs || 
                           (figure.etapes?.map(e => ({
                             etape_numero: e.etape?.ordre || e.ordre,
                             valide: e.statut === 'valide',
                             date_validation: e.date_validation,
                             statut: e.statut,
                             descriptif: e.etape?.description || e.description
                           }))) || [];

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleToggleSelection = (stepId) => {
    if (selectedStepIds.includes(stepId)) {
      setSelectedStepIds(selectedStepIds.filter(id => id !== stepId));
    } else {
      setSelectedStepIds([...selectedStepIds, stepId]);
    }
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedStepIds([]); // Reset selection when toggling mode
  };

  const handleStartTraining = () => {
    // Navigate to training page
    // Note: We use EntrainementPage which then redirects to EntrainementSession, 
    // BUT EntrainementPage is just a wrapper. We should probably target EntrainementPage
    // OR directly EntrainementSession.
    // The previous code targeted `/entrainement/figure/${figureId}` which is EntrainementPage.
    
    navigate(`/entrainement/figure/${figureId}`, { 
      state: { 
        selectedStepIds: null // No pre-selection from this dialog
      } 
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      {/* Header */}
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box>
            <Typography variant="h5">{nom}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange} 
          centered={!isMobile} 
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
        >
          <Tab label="Détails" />
          {showEtapesProgression && <Tab label="Étapes de Progression" />}
          {showJournal && <Tab label="Journal Progression" />}
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent sx={{ minHeight: 400 }}>
        {/* Onglet Détails */}
        {tabIndex === 0 && (
          <Box>
            {/* Image */}
            {figure.image_url && (
              <Box
                component="img"
                src={figure.image_url}
                alt={nom}
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 2
                }}
              />
            )}

            {/* Vidéo */}
            {isValidUrl(figure.video_url) && (
              <Box sx={{ mb: 2 }}>
                <video
                  src={figure.video_url}
                  controls
                  style={{
                    width: '100%',
                    borderRadius: '8px'
                  }}
                />
              </Box>
            )}

            {/* Visualisation Metadata (Siteswap, etc.) */}
            <MetadataViewer figure={figure} />

            {/* Description complète */}
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {descriptif || 'Aucune description disponible'}
            </Typography>

            {/* Informations supplémentaires */}
            <Box sx={{ mt: 3 }}>
              {figure.difficulty_level && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  <strong>Difficulté:</strong> {figure.difficulty_level}/5
                </Typography>
              )}
              {etapesTheoriques.length > 0 && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  <strong>Nombre d'étapes:</strong> {etapesTheoriques.length}
                </Typography>
              )}
              {figure.discipline && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  <strong>Discipline:</strong> {figure.discipline.nom}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Onglet Étapes de Progression */}
        {showEtapesProgression && tabIndex === 1 && (
          <Box>
            <EtapesProgressionList
              etapes={etapesTheoriques}
              etapesUtilisateur={etapesUtilisateur}
              editable={editable}
              onValidateStep={onValidateStep}
              showCheckboxes={false} // Checkboxes removed in view mode
              selectionMode={false}
              selectedIds={[]}
              onToggleSelection={() => {}}
            />
          </Box>
        )}

        {/* Onglet Journal Progression */}
        {showJournal && tabIndex === (showEtapesProgression ? 2 : 1) && (
          <JournalProgression
            figure={figure}
            progression={{
              ...(progression || {}),
              date_derniere_validation: progression?.date_derniere_validation || 
                                       etapesUtilisateur.filter(e => e.valide)
                                         .sort((a, b) => new Date(b.date_validation) - new Date(a.date_validation))[0]?.date_validation ||
                                       figure.date_derniere_validation ||
                                       figure.date_validation
            }}
          />
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions>
        <Button onClick={onClose}>
          Fermer
        </Button>
        <Button
          onClick={handleStartTraining}
          variant="contained"
          color="primary"
          startIcon={<FitnessCenterIcon />}
        >
          S'entraîner
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FigureDetailDialog;
