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
  useTheme,
  LinearProgress
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
  const [protectionDelay, setProtectionDelay] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);

  useEffect(() => {
    if (figureId) {
      startSession(figureId);
    }
  }, [figureId, startSession]);

  const handleResult = async (resultData) => {
    if (processing || protectionDelay) return;
    setProcessing(true);
    setProtectionDelay(true);
    setTimeout(() => setProtectionDelay(false), 1000);
    
    let payload = typeof resultData === 'boolean' ? { reussie: resultData, typeSaisie: 'binaire' } : resultData;
    const result = await recordTentative(payload);

    if (!result.success) {
      setProcessing(false);
      return;
    }

    if (result.updatedProgression?.idempotent) {
        setProcessing(false);
        return; 
    }

    if (payload.reussie) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#4CAF50', '#8BC34A', '#CDDC39']
      });
    }

    setTimeout(() => {
      if (result.isLastEtape) {
        const summary = endSession();
        setSessionSummary(summary);
        setShowSummary(true);
      } else {
        nextEtape();
      }
      setProcessing(false);
    }, 400);
  };

  const handleBack = () => {
    if (session) {
      if (window.confirm('Quitter la session ? Votre progression actuelle ne sera pas sauvegardée.')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleRetry = () => {
    setShowSummary(false);
    setSessionSummary(null);
    if (figureId) startSession(figureId);
  };

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
        bgcolor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden'
      }}
    >
      {/* Immersive Header */}
      <AppBar 
        position="static" 
        color="transparent" 
        elevation={0} 
        sx={{ 
          bgcolor: 'white', 
          borderBottom: '1px solid', 
          borderColor: 'divider' 
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton edge="start" onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ opacity: 0.6, letterSpacing: 1 }}>
              {mode.toUpperCase()}
            </Typography>
            <Typography variant="body2" fontWeight="900" color="primary">
              {stats?.progress.current || 0} / {stats?.progress.total || 0}
            </Typography>
          </Box>

          <Box sx={{ width: 48 }} /> {/* Spacer */}
        </Toolbar>
        
        {/* Progress bar at the very top of the app bar */}
        <LinearProgress 
          variant="determinate" 
          value={stats?.progress.percent || 0} 
          sx={{ height: 4, bgcolor: 'rgba(0,0,0,0.05)' }}
        />
      </AppBar>

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: isMobile ? 2 : 4,
          overflowY: 'auto'
        }}
      >
        {loading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} thickness={4} />
            <Typography sx={{ mt: 2, fontWeight: 'bold', opacity: 0.5 }}>PRÉPARATION...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" variant="filled" sx={{ borderRadius: 4 }}>{error}</Alert>
        ) : (
          session && currentEtape && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {mode === 'timer' || mode === 'combined' ? (
                <TimerView
                  key={currentEtape.id}
                  etape={currentEtape}
                  onResult={handleResult}
                  disabled={processing || protectionDelay}
                  mode={mode}
                />
              ) : (
                <FocusView
                  key={currentEtape.id}
                  etape={currentEtape}
                  onResult={handleResult}
                  disabled={processing || protectionDelay}
                />
              )}
            </Box>
          )
        )}
      </Box>

      {/* Real-time stats footer (Mobile only) */}
      {isMobile && session && stats && !showSummary && (
        <SessionStats
          stats={stats}
          startTime={session.stats.startTime}
          compact={true}
        />
      )}

      {/* Stats side-panel or header (Desktop only) */}
      {!isMobile && session && stats && !showSummary && (
        <Box sx={{ position: 'absolute', top: 100, right: 40, width: 280 }}>
          <SessionStats
            stats={stats}
            startTime={session.stats.startTime}
            compact={false}
          />
        </Box>
      )}

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