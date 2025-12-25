import React from 'react';
import { Box, Typography, Card, Grid, CardActionArea } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimerIcon from '@mui/icons-material/Timer';
import BoltIcon from '@mui/icons-material/Bolt';

function ModeSelector({ onSelectMode }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="text.secondary" sx={{ mb: 2 }}>
        Choisissez votre mode d'entraînement :
      </Typography>
      
      <Grid container spacing={2}>
        {/* Mode Focus */}
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={2} 
            sx={{ 
              height: '100%', 
              border: '2px solid transparent',
              transition: 'all 0.2s',
              '&:hover': { 
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            <CardActionArea 
              onClick={() => onSelectMode('focus')} 
              sx={{ height: '100%', p: 2 }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <VisibilityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Mode Focus
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Auto-évaluation détaillée après chaque essai. Idéal pour la technique.
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Mode Chrono */}
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={2}
            sx={{ 
              height: '100%',
              border: '2px solid transparent',
              transition: 'all 0.2s',
              '&:hover': { 
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            <CardActionArea 
              onClick={() => onSelectMode('timer')} 
              sx={{ height: '100%', p: 2 }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <TimerIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Mode Chrono
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pratique intensive sur la durée. Validation simple en fin de temps.
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Mode Combiné */}
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={2}
            sx={{ 
              height: '100%',
              border: '2px solid transparent',
              transition: 'all 0.2s',
              '&:hover': { 
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            <CardActionArea 
              onClick={() => onSelectMode('combined')} 
              sx={{ height: '100%', p: 2 }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <BoltIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Mode Combiné
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Timer + Auto-évaluation. Pour allier endurance et qualité technique.
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ModeSelector;
