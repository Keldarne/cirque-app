import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  Person as PersonIcon,
  Login as LoginIcon,
  FitnessCenter as FitnessCenterIcon,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Lightbulb as LightbulbIcon
} from "@mui/icons-material";
import { useAuth } from "./contexts/AuthContext";

function NavigationBar() {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <AppBar position="sticky" sx={{ top: 0, zIndex: 1100 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Section Gauche : Menu Mobile + Logo */}
          <Box display="flex" alignItems="center">
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                background: 'linear-gradient(45deg, #2979ff, #0056b3)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '.1rem',
              }}
            >
              CIRQUE APP
            </Typography>
          </Box>

          {/* Section Droite : Liens Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
            {isAuthenticated && (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/mon-programme"
                  startIcon={<FitnessCenterIcon />}
                >
                  Mon Programme
                </Button>
                {/* 
                <Button
                  color="inherit"
                  component={Link}
                  to="/suggestions"
                  startIcon={<LightbulbIcon />}
                >
                  Suggestions
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/classements"
                  startIcon={<LeaderboardIcon />}
                >
                  Classements
                </Button>
                */}
              </>
            )}

            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'school_admin' || user?.role === 'admin') && (
              <>
                <Button
                  color="inherit"
                  component={Link}
                  to="/prof/dashboard"
                  startIcon={<SchoolIcon />}
                >
                  Dashboard
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/prof/programmes"
                  startIcon={<AssignmentIcon />}
                >
                  Programmes
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  to="/admin"
                  startIcon={<AdminIcon />}
                >
                  Administration
                </Button>
              </>
            )}

            {isAuthenticated ? (
              <Button
                color="inherit"
                component={Link}
                to="/profil"
                startIcon={<PersonIcon />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  px: 2,
                  py: 0.5,
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ml: 1 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1 }}>
                    {user?.pseudo}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    Niveau {user?.niveau}
                  </Typography>
                </Box>
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="inherit"
                component={Link}
                to="/auth"
                startIcon={<LoginIcon />}
              >
                Connexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box
          role="presentation"
          onClick={handleMobileMenuClose}
          onKeyDown={handleMobileMenuClose}
        >
          {isAuthenticated && (
            <>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Box sx={{ bgcolor: 'white', color: 'primary.main', p: 1, borderRadius: '50%' }}>
                    <PersonIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {user?.pseudo}
                    </Typography>
                    <Typography variant="caption">
                      Niveau {user?.niveau}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider />
            </>
          )}

          <List>
            {isAuthenticated && (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/mon-programme">
                    <ListItemIcon><FitnessCenterIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Mon Programme" />
                  </ListItemButton>
                </ListItem>
                {/* 
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/suggestions">
                    <ListItemIcon><LightbulbIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Suggestions" />
                  </ListItemButton>
                </ListItem>
                */}
              </>
            )}

            {/* 
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/badges">
                <ListItemIcon><TrophyIcon sx={{ color: '#FFD700' }} /></ListItemIcon>
                <ListItemText primary="Badges" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton component={Link} to="/titres">
                <ListItemIcon><StarIcon sx={{ color: '#FFD700' }} /></ListItemIcon>
                <ListItemText primary="Titres" />
              </ListItemButton>
            </ListItem>
            */}

            <ListItem disablePadding>
              <ListItemButton component={Link} to="/defis">
                <ListItemIcon><FlagIcon color="error" /></ListItemIcon>
                <ListItemText primary="Défis" />
              </ListItemButton>
            </ListItem>

            <Divider sx={{ my: 1 }} />

            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'school_admin' || user?.role === 'admin') && (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/prof/dashboard">
                    <ListItemIcon><SchoolIcon color="secondary" /></ListItemIcon>
                    <ListItemText primary="Dashboard Prof" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/prof/programmes">
                    <ListItemIcon><AssignmentIcon color="secondary" /></ListItemIcon>
                    <ListItemText primary="Gestion Programmes" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/admin">
                    <ListItemIcon><AdminIcon color="action" /></ListItemIcon>
                    <ListItemText primary="Administration" />
                  </ListItemButton>
                </ListItem>
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {isAuthenticated ? (
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/profil">
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Mon Profil" />
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/auth">
                  <ListItemIcon><LoginIcon /></ListItemIcon>
                  <ListItemText primary="Se connecter" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default NavigationBar;