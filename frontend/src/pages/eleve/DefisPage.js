import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  Timer as TimerIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { api } from '../../utils/api';

const TYPE_DEFI = {
  quotidien: { label: 'Quotidien', color: '#FF9800' },
  hebdomadaire: { label: 'Hebdomadaire', color: '#2196F3' },
  evenement: { label: 'Événement', color: '#9C27B0' }
};

function DefisPage() {
  const [loading, setLoading] = useState(true);
  const [defis, setDefis] = useState([]);
  const [statistiques, setStatistiques] = useState(null);

  useEffect(() => {
    chargerDefis();
    chargerStatistiques();
  }, []);

  const chargerDefis = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/gamification/defis/actifs');
      if (!res.ok) throw new Error('Erreur chargement défis');

      const data = await res.json();
      setDefis(data.defis || []);
    } catch (err) {
      console.error('Erreur chargement défis:', err);
    } finally {
      setLoading(false);
    }
  };

  const chargerStatistiques = async () => {
    try {
      const res = await api.get('/api/gamification/defis/utilisateur');
      if (!res.ok) return;

      const data = await res.json();
      setStatistiques(data.statistiques);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
    }
  };

  // Filtrer les défis par type
  const defisQuotidiens = defis.filter(d => d.type === 'quotidien');
  const defisHebdomadaires = defis.filter(d => d.type === 'hebdomadaire');
  const defisEvenements = defis.filter(d => d.type === 'evenement');

  const formatTempsRestant = (heures) => {
    if (heures < 1) {
      return 'Moins d\'1h';
    } else if (heures < 24) {
      return `${heures}h restantes`;
    } else {
      const jours = Math.floor(heures / 24);
      return `${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`;
    }
  };

  const DefiCard = ({ defi }) => {
    const typeInfo = TYPE_DEFI[defi.type] || TYPE_DEFI.quotidien;
    const pourcentage = Math.min((defi.progression / defi.objectif_valeur) * 100, 100);

    return (
      <Card
        sx={{
          height: '100%',
          opacity: defi.complete ? 0.8 : 1,
          border: defi.complete ? '2px solid #4CAF50' : '2px solid transparent',
          position: 'relative'
        }}
      >
        {/* Badge complété */}
        {defi.complete && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              boxShadow: 3
            }}
          >
            <CheckIcon sx={{ color: 'white' }} />
          </Box>
        )}

        <CardContent>
          {/* En-tête */}
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Chip
              label={typeInfo.label}
              size="small"
              sx={{ bgcolor: typeInfo.color, color: 'white', fontWeight: 'bold' }}
            />
            {!defi.complete && (
              <Box display="flex" alignItems="center" sx={{ color: '#FF5722' }}>
                <TimerIcon sx={{ fontSize: 18, mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {formatTempsRestant(defi.temps_restant)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Titre et description */}
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            {defi.titre}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            {defi.description}
          </Typography>

          {/* Progression */}
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Progression
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {defi.progression} / {defi.objectif_valeur}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={pourcentage}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: '#E0E0E0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: defi.complete ? '#4CAF50' : typeInfo.color,
                  borderRadius: 5
                }
              }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
              {Math.round(pourcentage)}% complété
            </Typography>
          </Box>

          {/* Récompense */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#FFF8E1',
              borderRadius: 2,
              p: 1.5,
              mt: 2
            }}
          >
            <TrophyIcon sx={{ color: '#FFD700', mr: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#F57C00' }}>
              +{defi.xp_recompense} XP
            </Typography>
          </Box>

          {/* Date de complétion */}
          {defi.complete && defi.date_completion && (
            <Typography variant="caption" color="textSecondary" display="block" textAlign="center" mt={2}>
              Complété le {new Date(defi.date_completion).toLocaleDateString('fr-FR')}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="defis-container">
      {/* En-tête */}
      <Box className="defis-header">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Défis Actifs
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Complète des défis pour gagner de l'XP bonus
        </Typography>
      </Box>

      {/* Statistiques */}
      {statistiques && (
        <Paper className="defis-stats-section" sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 3 }}>
            <Box textAlign="center">
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                {statistiques.total_defis}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Défis total
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {statistiques.defis_completes}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Complétés
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                {statistiques.taux_reussite}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Taux de réussite
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#FFD700' }}>
                {statistiques.xp_gagnes}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                XP gagnés
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Défis Quotidiens */}
      {defisQuotidiens.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon sx={{ color: TYPE_DEFI.quotidien.color }} />
            Défis Quotidiens
            <Chip label={`${defisQuotidiens.length}`} size="small" sx={{ bgcolor: TYPE_DEFI.quotidien.color, color: 'white' }} />
          </Typography>
          <div className="defis-grid-wrapper">
            {defisQuotidiens.map((defi) => (
              <div key={defi.id} className="defis-card-item">
                <DefiCard defi={defi} />
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Défis Hebdomadaires */}
      {defisHebdomadaires.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ color: TYPE_DEFI.hebdomadaire.color }} />
            Défis Hebdomadaires
            <Chip label={`${defisHebdomadaires.length}`} size="small" sx={{ bgcolor: TYPE_DEFI.hebdomadaire.color, color: 'white' }} />
          </Typography>
          <div className="defis-grid-wrapper">
            {defisHebdomadaires.map((defi) => (
              <div key={defi.id} className="defis-card-item">
                <DefiCard defi={defi} />
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Défis Événements */}
      {defisEvenements.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon sx={{ color: TYPE_DEFI.evenement.color }} />
            Défis Événements
            <Chip label={`${defisEvenements.length}`} size="small" sx={{ bgcolor: TYPE_DEFI.evenement.color, color: 'white' }} />
          </Typography>
          <div className="defis-grid-wrapper">
            {defisEvenements.map((defi) => (
              <div key={defi.id} className="defis-card-item">
                <DefiCard defi={defi} />
              </div>
            ))}
          </div>
        </Box>
      )}

      {/* Message si aucun défi */}
      {defis.length === 0 && (
        <Alert severity="info" icon={<CalendarIcon />}>
          Aucun défi actif pour le moment. Reviens plus tard pour de nouveaux défis !
        </Alert>
      )}

      {/* Note informative */}
      <Alert severity="info" className="defis-info-note">
        Les défis se renouvellent automatiquement. Les défis quotidiens se réinitialisent chaque jour à minuit,
        et les défis hebdomadaires chaque lundi.
      </Alert>
    </Container>
  );
}

export default DefisPage;
