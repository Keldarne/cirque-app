import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import { Person as PersonIcon, School as SchoolIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

// Import des composants génériques
import {
  ProgressionGlobale,
  DisciplineSection
} from '../../components/programmes';
import { FigureDetailDialog } from '../../components/figures';
import { StudentProgressDialog } from '../../components/prof';

/**
 * DashboardPage - Dashboard prof avec sélecteur d'élève
 * Affiche les statistiques globales de l'élève sélectionné
 * Le prof peut naviguer dans les figures pour avoir des détails spécifiques
 */
function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // États
  const [eleves, setEleves] = useState([]);
  const [selectedEleveId, setSelectedEleveId] = useState('');
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgressions, setLoadingProgressions] = useState(false);

  // Dialogs
  const [figureDialog, setFigureDialog] = useState({ open: false, figure: null, progression: null });
  const [studentProgressDialog, setStudentProgressDialog] = useState({ open: false, figure: null, figureId: null });

  // Redirection si non authentifié ou pas prof
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (user?.role !== 'professeur' && user?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Charger la liste des élèves
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const chargerEleves = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/prof/eleves');
        const data = await response.json();
        setEleves(data.eleves || []);

        // Sélectionner le premier élève par défaut
        if (data.eleves && data.eleves.length > 0) {
          setSelectedEleveId(data.eleves[0].id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement élèves:', error);
        setLoading(false);
      }
    };

    chargerEleves();
  }, [isAuthenticated, user]);

  // Charger les progressions de l'élève sélectionné
  useEffect(() => {
    if (!selectedEleveId) return;

    const chargerProgressions = async () => {
      setLoadingProgressions(true);
      try {
        const response = await api.get(`/api/progression/utilisateur/${selectedEleveId}`);
        const data = await response.json();
        setProgressions(Array.isArray(data) ? data : []);
        setLoadingProgressions(false);
      } catch (error) {
        console.error('Erreur chargement progressions:', error);
        setProgressions([]);
        setLoadingProgressions(false);
      }
    };

    chargerProgressions();
  }, [selectedEleveId]);

  // Regrouper progressions par discipline
  const progressionsParDiscipline = progressions.reduce((acc, progression) => {
    if (progression.Figure && progression.Figure.Discipline) {
      const disciplineNom = progression.Figure.Discipline.nom;
      if (!acc[disciplineNom]) {
        acc[disciplineNom] = [];
      }
      acc[disciplineNom].push({
        ...progression.Figure,
        ordre: progression.id
      });
    }
    return acc;
  }, {});

  // Créer un map figureId -> progression
  const progressionsMap = {};
  progressions.forEach(prog => {
    if (prog.Figure) {
      progressionsMap[prog.Figure.id] = prog;
    }
  });

  // Calculer statistiques globales
  const stats = {
    total: progressions.length,
    validees: progressions.filter(p => p.etat === 'validée').length,
    enCours: progressions.filter(p => p.etat === 'en_cours').length,
    nonCommencees: progressions.filter(p => p.etat === 'non_commencée').length,
    disciplinesCount: Object.keys(progressionsParDiscipline).length,
    pourcentage: progressions.length > 0
      ? Math.round((progressions.filter(p => p.etat === 'validée').length / progressions.length) * 100)
      : 0
  };

  // Ouvrir le dialog de détails d'une figure (pour l'élève)
  const handleFigureClick = (figure, progression) => {
    setFigureDialog({ open: true, figure, progression });
  };

  // Ouvrir le dialog de progression de tous les élèves sur une figure
  const handleViewAllStudentsProgress = (figure) => {
    setStudentProgressDialog({ open: true, figure, figureId: figure.id });
  };

  const selectedEleve = eleves.find(e => e.id === selectedEleveId);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (eleves.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h3" gutterBottom>
          Dashboard Professeur
        </Typography>
        <Alert severity="info">
          Vous n'avez pas encore d'élèves. Les élèves apparaîtront ici lorsque vous leur assignerez des programmes.
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3">
          Dashboard Professeur
        </Typography>

        {/* Sélecteur d'élève */}
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel id="eleve-select-label">Sélectionner un élève</InputLabel>
          <Select
            labelId="eleve-select-label"
            id="eleve-select"
            value={selectedEleveId}
            label="Sélectionner un élève"
            onChange={(e) => setSelectedEleveId(e.target.value)}
          >
            {eleves.map((eleve) => (
              <MenuItem key={eleve.id} value={eleve.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" />
                  <Typography>
                    {eleve.prenom} {eleve.nom}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Informations élève */}
      {selectedEleve && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <PersonIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h4">
                {selectedEleve.prenom} {selectedEleve.nom}
              </Typography>
              <Typography variant="body1">
                {selectedEleve.email}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {loadingProgressions ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : progressions.length === 0 ? (
        <Alert severity="info">
          Cet élève n'a pas encore de progressions. Assignez-lui un programme pour commencer !
        </Alert>
      ) : (
        <>
          {/* Statistiques globales */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Statistiques Globales
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" color="primary.main">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Figures totales
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" color="success.main">
                    {stats.validees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validées
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" color="warning.main">
                    {stats.enCours}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En cours
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h3" color="text.secondary">
                    {stats.nonCommencees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Non commencées
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Progression globale */}
          <ProgressionGlobale
            figuresValidees={stats.validees}
            figuresTotal={stats.total}
            disciplinesCount={stats.disciplinesCount}
            variant="detailed"
            sx={{ mb: 4 }}
          />

          {/* Sections par discipline */}
          <Typography variant="h5" gutterBottom>
            Détails par Discipline
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {Object.entries(progressionsParDiscipline).map(([disciplineNom, figures]) => (
            <DisciplineSection
              key={disciplineNom}
              disciplineNom={disciplineNom}
              figures={figures}
              progressions={progressionsMap}
              onFigureClick={handleFigureClick}
              showProgress={true}
              showActions={true}
              editMode={false}
              onViewAllProgress={handleViewAllStudentsProgress}
              sx={{ mb: 4 }}
            />
          ))}
        </>
      )}

      {/* Dialog détails figure (pour l'élève sélectionné) */}
      <FigureDetailDialog
        open={figureDialog.open}
        figure={figureDialog.figure}
        progression={figureDialog.progression}
        onClose={() => setFigureDialog({ open: false, figure: null, progression: null })}
        showEtapesProgression={true}
        showJournal={true}
        editable={false}
      />

      {/* Dialog progression de tous les élèves sur une figure */}
      <StudentProgressDialog
        open={studentProgressDialog.open}
        figure={studentProgressDialog.figure}
        figureId={studentProgressDialog.figureId}
        onClose={() => setStudentProgressDialog({ open: false, figure: null, figureId: null })}
      />
    </Container>
  );
}

export default DashboardPage;
