import { createTheme } from '@mui/material/styles';

// Palette "Royal Day" - Thème clair, lumineux et pro
const colors = {
  background: '#f4f6f8', // Gris perle très léger
  paper: '#ffffff',      // Blanc pur
  primary: '#2979ff',    // Bleu Royal Électrique (Garde son impact)
  secondary: '#ffab00',  // Ambre Doré (Ajusté pour lisibilité sur blanc)
  textPrimary: '#192231', // Le Bleu Nuit devient la couleur du texte (Chic)
  textSecondary: '#637381', // Gris neutre moderne
  divider: 'rgba(145, 158, 171, 0.24)',
  success: '#2e7d32',    // Vert plus foncé pour contraste sur blanc
  info: '#0288d1',
};

const theme = createTheme({
  palette: {
    mode: 'light', // Passage en mode clair
    background: {
      default: colors.background,
      paper: colors.paper,
    },
    primary: {
      main: colors.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary,
      contrastText: '#212b36',
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.divider,
    success: {
      main: colors.success,
    },
    info: {
      main: colors.info,
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: colors.primary, // Titres majeurs en Bleu Royal
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: colors.textPrimary,
    },
    h3: {
      fontWeight: 700,
      color: colors.textPrimary,
    },
    h4: {
      fontWeight: 600,
      color: colors.textPrimary,
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      color: colors.textPrimary,
    },
    h6: {
      fontWeight: 600,
      color: colors.textPrimary,
    },
    subtitle1: {
      color: colors.textPrimary,
    },
    subtitle2: {
      color: colors.textSecondary,
      fontWeight: 600,
    },
    body1: {
      color: colors.textPrimary,
    },
    body2: {
      color: colors.textSecondary,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
          // Suppression du gradient sombre, retour à un fond simple ou subtil
          backgroundImage: 'none',
          scrollbarColor: `${colors.primary} ${colors.background}`,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: colors.background,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: colors.primary,
            borderRadius: '4px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.paper,
          color: colors.textPrimary,
        },
        elevation1: {
          boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.05), 0px 1px 1px 0px rgba(0,0,0,0.05), 0px 1px 3px 0px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.05), 0px 2px 2px 0px rgba(0,0,0,0.05), 0px 1px 5px 0px rgba(0,0,0,0.05)',
        },
        elevation3: {
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)', // Ombre douce moderne
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paper,
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
          border: 'none', // Plus besoin de bordure claire sur fond blanc
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.24), 0 16px 32px -4px rgba(145, 158, 171, 0.24)',
            // Pas de bordure colorée au survol en light mode, c'est moins élégant
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.paper,
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.24), 0 16px 32px -4px rgba(145, 158, 171, 0.24)',
          border: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        containedPrimary: {
          boxShadow: '0 8px 16px 0 rgba(41, 121, 255, 0.24)',
          '&:hover': {
            boxShadow: '0 10px 20px 0 rgba(41, 121, 255, 0.3)',
          },
        },
        containedSecondary: {
          color: '#ffffff', // Texte blanc sur bouton orange
          boxShadow: '0 8px 16px 0 rgba(255, 171, 0, 0.24)',
          '&:hover': {
             backgroundColor: '#ff9100', // Un peu plus foncé
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)', // Blanc quasi opaque
          color: colors.primary, // Texte et icônes en Bleu Royal
          backdropFilter: 'blur(6px)',
          boxShadow: 'none',
          borderBottom: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          color: colors.primary, // Force la couleur primaire pour le contenu de la barre
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.paper,
          borderRight: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.divider}`,
          color: colors.textPrimary,
        },
        head: {
          color: colors.textSecondary,
          backgroundColor: colors.background,
          fontWeight: 600,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          color: colors.textPrimary,
          '&.Mui-selected': {
            backgroundColor: 'rgba(41, 121, 255, 0.08)', // Tint bleu très léger
            color: colors.primary,
            '& .MuiListItemIcon-root': {
              color: colors.primary,
            },
            '&:hover': {
              backgroundColor: 'rgba(41, 121, 255, 0.16)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(145, 158, 171, 0.08)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: colors.textSecondary,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(145, 158, 171, 0.16)',
          color: colors.textPrimary,
        },
        colorPrimary: {
          backgroundColor: 'rgba(41, 121, 255, 0.16)',
          color: colors.primary,
          border: 'none',
        },
        label: {
            fontWeight: 500,
        }
      },
    },
    MuiTypography: {
        styleOverrides: {
            root: {
                color: colors.textPrimary,
            }
        }
    }
  },
});

export default theme;
