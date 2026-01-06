import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const PODIUM_COLORS = {
  1: { bg: '#fcdab7', medal: '🥇', text: 'Or' },
  2: { bg: '#e0e0e0', medal: '🥈', text: 'Argent' },
  3: { bg: '#CD7F32', medal: '🥉', text: 'Bronze' }
};

function ClassementsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState(0); // 0: Global, 1: Hebdo
  const [classementGlobal, setClassementGlobal] = useState([]);
  const [classementHebdo, setClassementHebdo] = useState([]);
  const [maPosition, setMaPosition] = useState(null);

  useEffect(() => {
    chargerClassements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet]);

  const chargerClassements = async () => {
    try {
      setLoading(true);

      if (onglet === 0) {
        // Classement global
        const res = await api.get('/api/gamification/classements/global');
        if (!res.ok) throw new Error('Erreur chargement classement');
        const data = await res.json();
        setClassementGlobal(data.classement || []);
        setMaPosition(data.utilisateur_position);
      } else {
        // Classement hebdomadaire
        const res = await api.get('/api/gamification/classements/hebdomadaire');
        if (!res.ok) throw new Error('Erreur chargement classement');
        const data = await res.json();
        setClassementHebdo(data.classement || []);
      }
    } catch (err) {
      console.error('Erreur chargement classement:', err);
    } finally {
      setLoading(false);
    }
  };

  const classementActuel = onglet === 0 ? classementGlobal : classementHebdo;

  const PodiumCard = ({ joueur, position }) => {
    const podiumInfo = PODIUM_COLORS[position];
    if (!podiumInfo) return null;

    return (
      <Card
        sx={{
          bgcolor: `${podiumInfo.bg}20`,
          border: `2px solid ${podiumInfo.bg}`,
          boxShadow: 4
        }}
      >
        <CardContent sx={{ textAlign: 'center' }}>
          {/* Médaille */}
          <Typography variant="h1" sx={{ mb: 1 }}>
            {podiumInfo.medal}
          </Typography>

          {/* Avatar */}
          <Avatar
            src={joueur.avatar_url}
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              mb: 2,
              border: `3px solid ${podiumInfo.bg}`
            }}
          >
            {joueur.prenom?.[0]}{joueur.nom?.[0]}
          </Avatar>

          {/* Nom */}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {joueur.prenom} {joueur.nom}
          </Typography>

          {/* Titre */}
          {joueur.titre_equipe && (
            <Chip
              label={joueur.titre_equipe}
              size="small"
              icon={<StarIcon />}
              sx={{ mt: 1, mb: 1 }}
            />
          )}

          {/* XP */}
          <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
            <TrophyIcon sx={{ color: '#fcdab7', mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: podiumInfo.bg }}>
              {(joueur.xp_total || 0).toLocaleString()} XP
            </Typography>
          </Box>

          {/* Niveau */}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Niveau {joueur.niveau}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const JoueurListItem = ({ joueur, position }) => {
    const isMe = user && joueur.id === user.id;
    const isPodium = position <= 3;

    return (
      <ListItem
        sx={{
          bgcolor: isMe ? 'rgba(41, 121, 255, 0.15)' : 'transparent',
          borderRadius: 2,
          mb: 1,
          border: isMe ? '2px solid #2979ff' : '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Rang */}
        <Box
          sx={{
            minWidth: 50,
            textAlign: 'center',
            mr: 2
          }}
        >
          {isPodium ? (
            <Typography variant="h4">
              {PODIUM_COLORS[position].medal}
            </Typography>
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              #{position}
            </Typography>
          )}
        </Box>

        {/* Avatar */}
        <ListItemAvatar>
          <Avatar src={joueur.avatar_url}>
            {joueur.prenom?.[0]}{joueur.nom?.[0]}
          </Avatar>
        </ListItemAvatar>

        {/* Nom et infos */}
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body1" sx={{ fontWeight: isMe ? 'bold' : 'normal' }}>
                {joueur.prenom} {joueur.nom}
              </Typography>
              {isMe && (
                <Chip label="Vous" size="small" color="primary" />
              )}
            </Box>
          }
          secondary={
            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
              <Typography variant="body2" color="textSecondary">
                Niveau {joueur.niveau}
              </Typography>
              {joueur.titre_equipe && (
                <>
                  <Typography variant="body2" color="textSecondary">•</Typography>
                  <Chip
                    label={joueur.titre_equipe}
                    size="small"
                    icon={<StarIcon />}
                    sx={{ height: 20 }}
                  />
                </>
              )}
            </Box>
          }
        />

        {/* XP */}
        <Box textAlign="right">
          <Box display="flex" alignItems="center" justifyContent="flex-end">
            <TrophyIcon sx={{ color: '#fcdab7', mr: 0.5, fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: isPodium ? PODIUM_COLORS[position].bg : '#2979ff' }}>
              {(joueur.xp_total || 0).toLocaleString()}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary">
            XP
          </Typography>
        </Box>
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const topTrois = classementActuel.slice(0, 3);
  const reste = classementActuel.slice(3);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Classements
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Compare ta progression avec les autres joueurs
        </Typography>
      </Box>

      {/* Position de l'utilisateur */}
      {maPosition && onglet === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vous êtes actuellement à la <strong>#{maPosition}</strong> position du classement global
        </Alert>
      )}

      {/* Onglets */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={onglet} onChange={(e, val) => setOnglet(val)} variant="fullWidth">
          <Tab label="Classement Global" />
          <Tab label="Classement Hebdomadaire" />
        </Tabs>
      </Paper>

      {/* Podium (Top 3) */}
      {topTrois.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 3 }}>
            🏆 Podium 🏆
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
              gridTemplateAreas: {
                xs: '"first" "second" "third"',
                md: '"second first third"'
              }
            }}
          >
            {/* 2ème place */}
            {topTrois[1] && (
              <Box sx={{ gridArea: 'second', alignSelf: 'end' }}>
                <PodiumCard joueur={topTrois[1]} position={2} />
              </Box>
            )}

            {/* 1ère place - plus haute */}
            {topTrois[0] && (
              <Box sx={{ gridArea: 'first' }}>
                <PodiumCard joueur={topTrois[0]} position={1} />
              </Box>
            )}

            {/* 3ème place */}
            {topTrois[2] && (
              <Box sx={{ gridArea: 'third', alignSelf: 'end' }}>
                <PodiumCard joueur={topTrois[2]} position={3} />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Reste du classement */}
      {reste.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Reste du classement
          </Typography>
          <List>
            {reste.map((joueur, index) => (
              <JoueurListItem
                key={joueur.id}
                joueur={joueur}
                position={index + 4}
              />
            ))}
          </List>
        </Paper>
      )}

      {classementActuel.length === 0 && (
        <Alert severity="info">
          Aucun classement disponible pour le moment
        </Alert>
      )}
    </Container>
  );
}

export default ClassementsPage;
