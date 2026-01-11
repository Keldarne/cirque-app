import React, { useState } from 'react';
import {
  Container,
  Alert,
  Box,
  Typography,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Paper,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LibraryBooks as CatalogIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  School as SchoolIcon,
  ImportExport as ImportIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

// Components
import CatalogPanel from '../../components/admin/catalog/CatalogPanel';
import StudentImportPanel from '../../components/admin/students/StudentImportPanel';
import SchoolUsersPanel from '../../components/admin/students/SchoolUsersPanel';
import SchoolSettings from '../../components/admin/catalog/SchoolSettings';
import ClassAverageCharts from '../../components/prof/analytics/ClassAverageCharts'; // Réutilisation des stats
import { api } from '../../utils/api';

function AdminPage() {
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabIndex, setTabIndex] = useState(0);
  const [globalStats, setGlobalStats] = useState(null);

  // Configuration des onglets selon le rôle
  const tabs = [
    { label: 'Vue d\'ensemble', icon: <DashboardIcon />, id: 'dashboard', allowed: true },
    { label: 'Catalogue', icon: <CatalogIcon />, id: 'catalog', allowed: true }, // Tous peuvent voir/gérer selon leur scope
    { label: 'Utilisateurs', icon: <PeopleIcon />, id: 'users', allowed: true }, // Gestion liste élèves/profs
    { label: 'Import Élèves', icon: <ImportIcon />, id: 'import', allowed: true }, // Profs/Admins peuvent importer
    { label: 'Paramètres École', icon: <SchoolIcon />, id: 'school', allowed: user?.role === 'admin' || user?.role === 'school_admin' },
    { label: 'Admin Système', icon: <SettingsIcon />, id: 'system', allowed: user?.role === 'admin' },
  ];

  const activeTabs = tabs.filter(t => t.allowed);

  React.useEffect(() => {
    // Sync URL param with tab index
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const foundIndex = activeTabs.findIndex(t => t.id === tabParam);
      if (foundIndex !== -1) {
        setTabIndex(foundIndex);
      }
    }
  }, [searchParams, user]); // depend on user to re-calc allowed tabs

  React.useEffect(() => {
    // Charger des stats rapides pour le dashboard d'accueil
    if (user) {
        api.get('/api/prof/dashboard/stats-globales')
           .then(res => res.json())
           .then(data => setGlobalStats(data))
           .catch(err => console.error("Erreur stats admin", err));
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    // Update URL
    const newTabId = activeTabs[newValue].id;
    setSearchParams({ tab: newTabId });
  };

  if (isLoading) {
    return <Container sx={{ mt: 4 }}><Typography>Chargement...</Typography></Container>;
  }

  if (!user) {
    return <Container sx={{ mt: 4 }}><Alert severity="error">Accès non autorisé.</Alert></Container>;
  }
  
  const isMasterAdmin = user.role === 'admin';
  const isSchoolAdmin = user.role === 'school_admin';
  const isProf = user.role === 'professeur';

  if (!isMasterAdmin && !isSchoolAdmin && !isProf) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">
          Vous n'avez pas les permissions nécessaires pour accéder à l'administration.
        </Alert>
      </Container>
    );
  }
  
  // Mapping index -> content
  const currentTabId = activeTabs[tabIndex]?.id;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Administration
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {isMasterAdmin ? 'Super Administrateur' : (user.Ecole ? `Administration - ${user.Ecole.nom}` : 'Gestion Enseignant')}
        </Typography>
      </Box>

      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          minHeight: 600,
          overflow: 'hidden'
        }}
      >
        {/* Navigation Latérale (ou Top sur mobile) */}
        <Box 
          sx={{ 
            width: isMobile ? '100%' : 260, 
            borderRight: isMobile ? 'none' : 1, 
            borderBottom: isMobile ? 1 : 'none', 
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Tabs
            orientation={isMobile ? 'horizontal' : 'vertical'}
            variant="scrollable"
            value={tabIndex}
            onChange={handleTabChange}
            sx={{ 
              '& .MuiTab-root': { 
                justifyContent: isMobile ? 'center' : 'flex-start',
                alignItems: 'center',
                textAlign: 'left',
                minHeight: isMobile ? 48 : 56,
                py: 1,
                px: 2,
                gap: 2
              } 
            }}
          >
            {activeTabs.map((tab, index) => (
              <Tab 
                key={tab.id} 
                label={tab.label} 
                iconPosition="start" 
                icon={tab.icon} 
              />
            ))}
          </Tabs>
        </Box>

        {/* Contenu Principal */}
        <Box sx={{ flexGrow: 1, p: 4, overflow: 'auto' }}>
            
          {/* DASHBOARD */}
          {currentTabId === 'dashboard' && (
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold">Tableau de Bord</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Bienvenue dans votre espace d'administration. Utilisez le menu pour naviguer.
              </Alert>

              {globalStats && (
                <Box>
                    <Typography variant="h6" gutterBottom>Statistiques Rapides</Typography>
                    <ClassAverageCharts data={globalStats} loading={!globalStats} />
                </Box>
              )}
            </Box>
          )}

          {/* CATALOGUE */}
          {currentTabId === 'catalog' && (
            <CatalogPanel />
          )}

          {/* UTILISATEURS */}
          {currentTabId === 'users' && (
            <SchoolUsersPanel />
          )}

          {/* IMPORT */}
          {currentTabId === 'import' && (
            <StudentImportPanel />
          )}

          {/* PARAMÈTRES ÉCOLE */}
          {currentTabId === 'school' && (
             <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold">Paramètres de l\'École</Typography>
                <SchoolSettings />
             </Box>
          )}

          {/* SYSTÈME (Admin Global uniquement) */}
          {currentTabId === 'system' && (
            <Box>
               <Typography variant="h5" gutterBottom fontWeight="bold">Administration Système</Typography>
               <Alert severity="warning">
                 Zone réservée à la maintenance système globale (Logs, Backups, etc.).
                 Fonctionnalité à venir.
               </Alert>
            </Box>
          )}

        </Box>
      </Paper>
    </Container>
  );
}

export default AdminPage;