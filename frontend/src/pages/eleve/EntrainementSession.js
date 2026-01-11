import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  LinearProgress,
  Container
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import confetti from 'canvas-confetti';
import { useEntrainement } from '../../hooks/useEntrainement';
import SessionStats from '../../components/entrainement/SessionStats';
import SessionSummary from '../../components/entrainement/SessionSummary';
import FocusView from '../../components/entrainement/FocusView';
import TimerView from '../../components/entrainement/TimerView';

function EntrainementSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { figureId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const mode = location.state?.mode || 'focus';
  const selectedStepIds = location.state?.selectedStepIds || null;

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

  useEffect(() => {
    if (figureId) startSession(figureId, selectedStepIds);
  }, [figureId, startSession, selectedStepIds]);

  const handleResult = async (resultData) => {
    if (processing) return;
    setProcessing(true);
    
    let payload = typeof resultData === 'boolean' ? { reussie: resultData, typeSaisie: 'binaire' } : resultData;
    const result = await recordTentative(payload);

    if (!result.success) {
      setProcessing(false);
      return;
    }

    if (!result.updatedProgression?.idempotent && payload.reussie) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 }, colors: ['#4CAF50', '#8BC34A', '#CDDC39'] });
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
    if (window.confirm('Quitter la session en cours ?')) navigate(-1);
  };

  const currentEtape = getCurrentEtape();
  const stats = getStats();

  return (
    <Box
      sx={{
        // Ajustement pour la hauteur de la barre de navigation (56px mobile, 64px desktop)
        height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        bgcolor: '#f4f6f8',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Immersive Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px' }}>
          <IconButton edge="start" onClick={handleBack} sx={{ color: 'text.primary' }}>
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          
          <Box textAlign="center">
            <Typography variant="overline" display="block" sx={{ lineHeight: 1, fontWeight: 800, color: 'text.secondary', letterSpacing: 2 }}>
              {mode === 'timer' ? 'CHRONO' : 'FOCUS'}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
              ÉTAPE {stats?.progress.current} / {stats?.progress.total}
            </Typography>
          </Box>

          <Box width={40} /> {/* Spacer pour centrer le titre */}
        </Toolbar>
        <LinearProgress 
          variant="determinate" 
          value={stats?.progress.percent || 0} 
          sx={{ height: 3, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
        />
      </AppBar>

      {/* ZONE DE TRAVAIL */}
      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, position: 'relative' }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : session && currentEtape && (
          <Box width="100%" height="100%" display="flex" justifyContent="center">
            {mode === 'timer' || mode === 'combined' ? (
              <TimerView
                key={currentEtape.id}
                etape={currentEtape}
                onResult={handleResult}
                disabled={processing}
                mode={mode}
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
        )}
      </Container>

      {/* FOOTER STATS (Mobile) ou SIDEBAR (Desktop) */}
      {session && stats && !showSummary && (
        <SessionStats stats={stats} startTime={session.stats.startTime} compact={isMobile} />
      )}

      <SessionSummary
        open={showSummary}
        onClose={() => navigate(-1)}
        summary={sessionSummary}
        onRetry={() => { setShowSummary(false); startSession(figureId, selectedStepIds); }}
      />
    </Box>
  );
}

export default EntrainementSession;
