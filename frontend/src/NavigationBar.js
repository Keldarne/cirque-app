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
  Divider
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
  Leaderboard as LeaderboardIcon,
  Assignment as AssignmentIcon
} from "@mui/icons-material";
import { useAuth } from "./contexts/AuthContext";

function NavigationBar() {
  // Récupère l'état d'authentification et l'utilisateur depuis le contexte
  const { isAuthenticated, user } = useAuth();

  // État pour gérer l'ouverture du menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fonction pour fermer le menu mobile
  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <AppBar position="sticky" sx={{ top: 0, zIndex: 1100 }}>
        <Toolbar>
          {/* Bouton hamburger - visible uniquement sur mobile */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileMenuOpen(true)}
            className="navbar-mobile-menu-button"
          >
            <MenuIcon />
          </IconButton>

                    {/* Titre / logo de l'app */}          <Typography 

                      variant="h5" 

                      className="navbar-title" 

                      sx={{ 

                        fontWeight: 800, 

                        background: 'linear-gradient(45deg, #2979ff, #0056b3)',

                        backgroundClip: 'text',

                        textFillColor: 'transparent',

                        WebkitBackgroundClip: 'text',

                        WebkitTextFillColor: 'transparent',

                        mr: 4,

                        letterSpacing: '0.05em'

                      }}

                    >

                      CIRQUE APP

                    </Typography>

          {/* Menu desktop - caché sur mobile */}
          <Box className="navbar-links-container">
            {/* Si connecté, on affiche le lien vers Mon Programme */}
            {isAuthenticated && (
              <Button
                color="inherit"
                component={Link}
                to="/mon-programme"
                startIcon={<FitnessCenterIcon />}
              >
                Mon Programme
              </Button>
            )}

            {/* Lien Dashboard Professeur (accessible aux professeurs et admins) */}
            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'admin') && (
              <Button
                color="inherit"
                component={Link}
                to="/prof/dashboard"
                startIcon={<SchoolIcon />}
              >
                Dashboard Prof
              </Button>
            )}

            {/* Lien Programmes Professeur */}
            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'admin') && (
              <Button
                color="inherit"
                component={Link}
                to="/prof/programmes"
                startIcon={<AssignmentIcon />}
              >
                Programmes
              </Button>
            )}

            {/* Lien Administration (accessible aux professeurs et admins) */}
            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'admin') && (
              <Button
                color="inherit"
                component={Link}
                to="/admin"
                startIcon={<AdminIcon />}
              >
                Administration
              </Button>
            )}

            {/* Affiche le bloc utilisateur (pseudo, niveau) ou le lien de connexion */}
            {isAuthenticated ? (
              <Button
                color="inherit"
                component={Link}
                to="/profil"
                startIcon={<PersonIcon />}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>{user?.pseudo}</span>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                    Niveau {user?.niveau}
                  </Typography>
                </Box>
              </Button>
            ) : (
              <Button
                color="inherit"
                component={Link}
                to="/auth"
                startIcon={<LoginIcon />}
              >
                Connexion / Inscription
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu mobile - Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={handleMobileMenuClose}
        >
          <List>
            {/* En-tête du menu mobile avec info utilisateur */}
            {isAuthenticated && (
              <>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={user?.pseudo}
                    secondary={`Niveau ${user?.niveau}`}
                  />
                </ListItem>
                <Divider />
              </>
            )}

            {/* Mon Programme */}
            {isAuthenticated && (
              <ListItemButton component={Link} to="/mon-programme">
                <ListItemIcon>
                  <FitnessCenterIcon />
                </ListItemIcon>
                <ListItemText primary="Mon Programme" />
              </ListItemButton>
            )}

            {/* Badges */}
            {isAuthenticated && (
              <ListItemButton component={Link} to="/badges">
                <ListItemIcon>
                  <TrophyIcon />
                </ListItemIcon>
                <ListItemText primary="Badges" />
              </ListItemButton>
            )}

            {/* Titres */}
            {isAuthenticated && (
              <ListItemButton component={Link} to="/titres">
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText primary="Titres" />
              </ListItemButton>
            )}

            {/* Défis */}
            {isAuthenticated && (
              <ListItemButton component={Link} to="/defis">
                <ListItemIcon>
                  <FlagIcon />
                </ListItemIcon>
                <ListItemText primary="Défis" />
              </ListItemButton>
            )}

            {/* Dashboard Professeur */}
            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'admin') && (
              <ListItemButton component={Link} to="/prof/dashboard">
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard Prof" />
              </ListItemButton>
            )}

            {/* Programmes Professeur */}
            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'admin') && (
              <ListItemButton component={Link} to="/prof/programmes">
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText primary="Programmes" />
              </ListItemButton>
            )}

            {/* Administration */}
            {isAuthenticated && (user?.role === 'professeur' || user?.role === 'admin') && (
              <ListItemButton component={Link} to="/admin">
                <ListItemIcon>
                  <AdminIcon />
                </ListItemIcon>
                <ListItemText primary="Administration" />
              </ListItemButton>
            )}

            <Divider />

            {/* Profil ou Connexion */}
            {isAuthenticated ? (
              <ListItemButton component={Link} to="/profil">
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Mon Profil" />
              </ListItemButton>
            ) : (
              <ListItemButton component={Link} to="/auth">
                <ListItemIcon>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText primary="Connexion / Inscription" />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default NavigationBar;