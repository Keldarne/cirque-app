import React from 'react';
import { Box, Typography, Card, Grid, CardActionArea, useTheme, useMediaQuery } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimerIcon from '@mui/icons-material/Timer';
import BoltIcon from '@mui/icons-material/Bolt';

function ModeSelector({ onSelectMode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // On mobile (full width), we can use columns if screen allows, 
  // but in a sidebar (tablet/desktop), stacking is better.
  const gridXs = 12;
  const gridSm = isTablet ? 12 : 4; // Stack on tablet/sidebar, columns on large screens

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="text.secondary" sx={{ mb: 2 }}>
        Choisissez votre mode d'entraînement :
      </Typography>
      
      <Grid container spacing={2}>
        {/* Mode Focus */}
        <Grid item xs={gridXs} sm={gridSm}>
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
              <Box display="flex" flexDirection={isTablet && !isMobile ? "row" : "column"} alignItems="center" textAlign={isTablet && !isMobile ? "left" : "center"} gap={isTablet && !isMobile ? 2 : 0}>
                <VisibilityIcon color="primary" sx={{ fontSize: 40, mb: isTablet && !isMobile ? 0 : 1 }} />
                <Box>
                  <Typography variant="h6" gutterBottom={!(isTablet && !isMobile)}>
                    Mode Focus
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tir unique par essai.
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Mode Chrono */}
        <Grid item xs={gridXs} sm={gridSm}>
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
              <Box display="flex" flexDirection={isTablet && !isMobile ? "row" : "column"} alignItems="center" textAlign={isTablet && !isMobile ? "left" : "center"} gap={isTablet && !isMobile ? 2 : 0}>
                <TimerIcon color="secondary" sx={{ fontSize: 40, mb: isTablet && !isMobile ? 0 : 1 }} />
                <Box>
                  <Typography variant="h6" gutterBottom={!(isTablet && !isMobile)}>
                    Mode Chrono
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validation en fin de temps.
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Mode Combiné */}
        <Grid item xs={gridXs} sm={gridSm}>
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
              <Box display="flex" flexDirection={isTablet && !isMobile ? "row" : "column"} alignItems="center" textAlign={isTablet && !isMobile ? "left" : "center"} gap={isTablet && !isMobile ? 2 : 0}>
                <BoltIcon color="warning" sx={{ fontSize: 40, mb: isTablet && !isMobile ? 0 : 1 }} />
                <Box>
                  <Typography variant="h6" gutterBottom={!(isTablet && !isMobile)}>
                    Mode Combiné
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Timer + Auto-évaluation.
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ModeSelector;
