import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { api } from '../../utils/api';

const RARETE_COLORS = {
  commun: { bg: '#b0bbcf', text: 'Commun' }, // Gris bleuté
  rare: { bg: '#42a5f5', text: 'Rare' }, // Bleu plus vibrant
  epique: { bg: '#ab47bc', text: 'Épique' }, // Violet mystique
  legendaire: { bg: '#fcdab7', text: 'Légendaire' } // Or sablé (Secondaire)
};

const CATEGORIES = {
  progression: 'Progression',
  streak: 'Série',
  social: 'Social',
  maitrise: 'Maîtrise',
  defi: 'Défi',
  special: 'Spécial'
};

function BadgesPage() {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [onglet, setOnglet] = useState(0); // 0: Tous, 1: Obtenus, 2: À obtenir
  const [categorieFiltre, setCategorieFiltre] = useState('tous');

  useEffect(() => {
    chargerBadges();
  }, []);

  const chargerBadges = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/gamification/badges');
      if (!res.ok) throw new Error('Erreur chargement badges');

      const data = await res.json();
      setBadges(data.badges || []);
    } catch (err) {
      console.error('Erreur chargement badges:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtrerBadges = () => {
    let filtres = badges;

    // Filtrer par onglet
    if (onglet === 1) {
      filtres = filtres.filter(b => b.obtenu);
    } else if (onglet === 2) {
      filtres = filtres.filter(b => !b.obtenu);
    }

    // Filtrer par catégorie
    if (categorieFiltre !== 'tous') {
      filtres = filtres.filter(b => b.categorie === categorieFiltre);
    }

    return filtres;
  };

  const badgesFiltres = filtrerBadges();
  const nombreObtenus = badges.filter(b => b.obtenu).length;
  const pourcentageCompletion = badges.length > 0 ? Math.round((nombreObtenus / badges.length) * 100) : 0;

  const BadgeCard = ({ badge }) => {
    const rareteColor = RARETE_COLORS[badge.rarete] || RARETE_COLORS.commun;

    return (
      <Tooltip title={badge.description} arrow>
        <Card
          sx={{
            height: '100%',
            position: 'relative',
            opacity: badge.obtenu ? 1 : 0.6,
            border: badge.obtenu ? `2px solid ${rareteColor.bg}` : '2px solid transparent',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
        >
          {/* Badge obtenu - check en haut à droite */}
          {badge.obtenu && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: '#4CAF50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <CheckIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
          )}

          {/* Badge non obtenu - cadenas */}
          {!badge.obtenu && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: '#9E9E9E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <LockIcon sx={{ color: 'white', fontSize: 16 }} />
            </Box>
          )}

          <CardContent sx={{ textAlign: 'center', pt: 3 }}>
            {/* Icône du badge */}
            <Box
              sx={{
                fontSize: 64,
                mb: 2,
                filter: badge.obtenu ? 'none' : 'grayscale(100%)'
              }}
            >
              {badge.icone}
            </Box>

            {/* Nom */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              {badge.nom}
            </Typography>

            {/* Description */}
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40 }}>
              {badge.description}
            </Typography>

            {/* Rareté */}
            <Chip
              label={rareteColor.text}
              size="small"
              sx={{
                bgcolor: rareteColor.bg,
                color: 'white',
                fontWeight: 'bold',
                mb: 1
              }}
            />

            {/* XP Bonus */}
            <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
              <TrophyIcon sx={{ fontSize: 16, color: '#fcdab7', mr: 0.5 }} />
              <Typography variant="body2" sx={{ color: '#fcdab7', fontWeight: 'bold' }}>
                +{badge.xp_bonus} XP
              </Typography>
            </Box>

            {/* Date d'obtention */}
            {badge.obtenu && badge.date_obtention && (
              <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                Obtenu le {new Date(badge.date_obtention).toLocaleDateString('fr-FR')}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Tooltip>
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
    <Container maxWidth="lg" className="badges-container">
      {/* En-tête */}
      <Box className="badges-header">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Collection de Badges
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Débloque des badges en accomplissant des objectifs
        </Typography>
      </Box>

      {/* Progression globale */}
      <Paper className="badges-progress-section" sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Progression Globale</Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
            {nombreObtenus} / {badges.length}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pourcentageCompletion}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: '#E0E0E0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#2196F3',
              borderRadius: 6
            }
          }}
        />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {pourcentageCompletion}% de badges obtenus
        </Typography>
      </Paper>

      {/* Filtres */}
      <Paper className="badges-filters-section">
        <Tabs value={onglet} onChange={(e, val) => setOnglet(val)} variant="fullWidth">
          <Tab label={`Tous (${badges.length})`} />
          <Tab label={`Obtenus (${nombreObtenus})`} />
          <Tab label={`À obtenir (${badges.length - nombreObtenus})`} />
        </Tabs>
      </Paper>

      {/* Filtres catégories */}
      <Box className="badges-categories-section" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="Tous"
          onClick={() => setCategorieFiltre('tous')}
          color={categorieFiltre === 'tous' ? 'primary' : 'default'}
        />
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            onClick={() => setCategorieFiltre(key)}
            color={categorieFiltre === key ? 'primary' : 'default'}
          />
        ))}
      </Box>

      {/* Grille de badges */}
      {badgesFiltres.length === 0 ? (
        <Alert severity="info">Aucun badge ne correspond à ces filtres.</Alert>
      ) : (
        <div className="badges-grid-wrapper">
          {badgesFiltres.map((badge) => (
            <div key={badge.id} className="badges-card-item">
              <BadgeCard badge={badge} />
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}

export default BadgesPage;
