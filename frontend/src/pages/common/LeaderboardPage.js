import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Chip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Page Classements (Leaderboards)
 * Affiche les classements global, hebdomadaire et par groupe
 */
function LeaderboardPage() {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  // Charger le classement selon l'onglet actif
  const leaderboardType = ['global', 'hebdo', 'groupe'][tabIndex];
  const { leaderboard, userRank, loading, error, loadMore, hasMore, refresh } = useLeaderboard(
    leaderboardType,
    tabIndex === 2 ? (user?.groupe_id || null) : null
  );

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Médailles pour le podium
  const medals = ['🥇', '🥈', '🥉'];

  // Couleurs pour les rangs
  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Or
    if (rank === 2) return '#C0C0C0'; // Argent
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#757575'; // Gris
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* En-tête */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrophyIcon sx={{ fontSize: 50, color: '#FFD700' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Classements
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Découvre les meilleurs performers !
          </Typography>
        </Box>

        {/* Onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab icon={<TrophyIcon />} label="Global" iconPosition="start" />
            <Tab icon={<TrendingUpIcon />} label="Hebdomadaire" iconPosition="start" />
            <Tab icon={<GroupIcon />} label="Mon Groupe" iconPosition="start" disabled={!user?.groupe_id} />
          </Tabs>
        </Box>

        {/* Bouton Rafraîchir */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={refresh}
            disabled={loading}
          >
            Rafraîchir
          </Button>
        </Box>

        {/* Affichage rang utilisateur */}
        {userRank && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Ta position:</strong> #{userRank}
            </Typography>
          </Alert>
        )}

        {/* Chargement */}
        {loading && leaderboard.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Chargement du classement...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">
            Erreur lors du chargement du classement : {error}
          </Alert>
        ) : leaderboard.length === 0 ? (
          <Alert severity="info">
            Aucun classement disponible pour le moment.
          </Alert>
        ) : (
          <>
            {/* Podium Top 3 */}
            {leaderboard.length >= 3 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                {leaderboard.slice(0, 3).map((entry, idx) => (
                  <Card
                    key={entry.utilisateur_id}
                    sx={{
                      width: { xs: '100%', sm: 200 },
                      textAlign: 'center',
                      border: `3px solid ${getRankColor(idx + 1)}`,
                      boxShadow: `0 4px 12px ${getRankColor(idx + 1)}40`
                    }}
                  >
                    <CardContent>
                      <Typography variant="h2" sx={{ mb: 1 }}>
                        {medals[idx]}
                      </Typography>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          mx: 'auto',
                          mb: 1,
                          bgcolor: getRankColor(idx + 1)
                        }}
                      >
                        {entry.pseudo?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                        {entry.pseudo}
                      </Typography>
                      <Chip
                        label={`Niveau ${entry.niveau}`}
                        size="small"
                        sx={{ mt: 0.5, mb: 1 }}
                      />
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: getRankColor(idx + 1) }}>
                        {entry.xp_total?.toLocaleString() || 0} XP
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {/* Liste complète (à partir du 4ème) */}
            {leaderboard.length > 3 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Classement complet:
                </Typography>
                <List>
                  {leaderboard.slice(3).map((entry, idx) => {
                    const rank = idx + 4;
                    const isCurrentUser = entry.utilisateur_id === user?.id;

                    return (
                      <ListItem
                        key={entry.utilisateur_id}
                        sx={{
                          bgcolor: isCurrentUser ? 'action.selected' : 'transparent',
                          borderRadius: 1,
                          mb: 0.5,
                          border: isCurrentUser ? '2px solid' : 'none',
                          borderColor: 'primary.main'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          {/* Rang */}
                          <Typography
                            variant="h6"
                            sx={{
                              minWidth: 50,
                              fontWeight: 'bold',
                              color: getRankColor(rank)
                            }}
                          >
                            #{rank}
                          </Typography>

                          {/* Avatar */}
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#1976d2' }}>
                              {entry.pseudo?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                          </ListItemAvatar>

                          {/* Infos utilisateur */}
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>
                                  {entry.pseudo}
                                </Typography>
                                {isCurrentUser && <Chip label="Toi" size="small" color="primary" />}
                              </Box>
                            }
                            secondary={`Niveau ${entry.niveau} • ${entry.xp_total?.toLocaleString() || 0} XP`}
                          />
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}

            {/* Bouton Charger plus */}
            {hasMore && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Chargement...' : 'Charger plus'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}

export default LeaderboardPage;
