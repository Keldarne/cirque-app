import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import confetti from 'canvas-confetti';
import { useEntrainement } from '../../hooks/useEntrainement';
import SessionStats from '../../components/entrainement/SessionStats';
import SessionSummary from '../../components/entrainement/SessionSummary';
import FocusView from '../../components/entrainement/FocusView';
import TimerView from '../../components/entrainement/TimerView';

/**
 * Page de session d'entraînement active
 *
 * URL: /entrainement/session/:figureId
 *
 * Affiche:
 * - Header avec bouton retour et stats
 * - Vue adaptée au mode (Focus ou Chrono)
 * - Bottom stats bar (mobile)
 * - SessionSummary modal en fin de session
 */
function EntrainementSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { figureId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Récupérer le mode depuis l'état de navigation (par défaut 'focus')
  const mode = location.state?.mode || 'focus';

  const {
    session,
    loading,
    error,
    startSession,
    recordTentative,
    nextEtape,
    endSession,
    getCurrentEtape,
    getStats,
    isLastEtape
  } = useEntrainement();

  const [processing, setProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

  // Démarrer la session au montage
  useEffect(() => {
    if (figureId) {
      startSession(figureId);
    }
  }, [figureId, startSession]);

  // Gérer le résultat d'une étape (pour tous les modes)
  const handleResult = async (resultData) => {
    if (processing) return;

    setProcessing(true);
    
    // Normalisation des données reçues des composants
    // FocusView et TimerView renvoient maintenant un objet complet { reussie, typeSaisie, score, dureeSecondes }
    // Ancienne compatibilité (si appel direct avec booléen)
    let payload = {};
    
    if (typeof resultData === 'boolean') {
        payload = { reussie: resultData, typeSaisie: 'binaire' };
    } else {
        payload = resultData;
    }

    // Enregistrer la tentative
    const result = await recordTentative(payload);

    if (!result.success) {
      setProcessing(false);
      return;
    }

    // Animation de célébration si réussite
    if (payload.reussie) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4CAF50', '#8BC34A', '#CDDC39']
      });
    }

    // Délai pour transition
    setTimeout(() => {
      if (result.isLastEtape) {
        // Fin de session
        const summary = endSession();
        setSessionSummary(summary);
        setShowSummary(true);
      } else {
        // Passer à l'étape suivante
        nextEtape();
      }
      setProcessing(false);
    }, 300);
  };

  // Retour en arrière avec confirmation
  const handleBack = () => {
    if (session) {
      const confirmed = window.confirm(
        'Êtes-vous sûr de vouloir quitter? Votre progression sera perdue.'
      );
      if (confirmed) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  // Refaire la session
  const handleRetry = () => {
    setShowSummary(false);
    setSessionSummary(null);
    if (figureId) {
      startSession(figureId);
    }
  };

  // Fermer le résumé et retourner
  const handleCloseSummary = () => {
    setShowSummary(false);
    navigate(-1);
  };

  const currentEtape = getCurrentEtape();
  const stats = getStats();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {mode === 'combined' ? 'Mode Combiné' : (mode === 'timer' ? 'Mode Chrono' : 'Mode Focus')}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Contenu principal */}
      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 3,
          pb: isMobile ? 10 : 3
        }}
      >
        {/* Loading */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress size={60} />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Session active */}
        {session && currentEtape && stats && (
          <>
            {/* Stats (desktop uniquement) */}
            {!isMobile && (
              <SessionStats
                stats={stats}
                startTime={session.stats.startTime}
                compact={false}
              />
            )}

            {/* Zone principale d'entraînement */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400
              }}
            >
              {mode === 'timer' || mode === 'combined' ? (
                <TimerView
                  key={currentEtape.id}
                  etape={currentEtape}
                  onResult={handleResult}
                  disabled={processing}
                  mode={mode} // Pass 'timer' or 'combined'
                />
              ) : (
                <FocusView
                  key={currentEtape.id}
                  etape={currentEtape}
                  onResult={handleResult}
                  disabled={processing}
                />
              )}
            </Box>

            {/* Message progression */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Étape {stats.progress.current} sur {stats.progress.total}
              </Typography>
              {isLastEtape && (
                <Typography variant="body2" color="primary" fontWeight={600} sx={{ mt: 1 }}>
                  Dernière étape!
                </Typography>
              )}
            </Box>
          </>
        )}
      </Container>

      {/* Bottom stats bar (mobile uniquement) */}
      {isMobile && session && stats && (
        <SessionStats
          stats={stats}
          startTime={session.stats.startTime}
          compact={true}
        />
      )}

      {/* Modal résumé fin de session */}
      <SessionSummary
        open={showSummary}
        onClose={handleCloseSummary}
        summary={sessionSummary}
        onRetry={handleRetry}
      />
    </Box>
  );
}

export default EntrainementSession;
