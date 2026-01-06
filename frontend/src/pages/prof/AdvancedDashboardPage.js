import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { api } from '../../utils/api';

// Nouveaux composants d'analytics
import GroupProgressMatrix from '../../components/prof/analytics/GroupProgressMatrix';
import DashboardFilters from '../../components/prof/analytics/DashboardFilters';
import ClassAverageCharts from '../../components/prof/analytics/ClassAverageCharts';
import SuggestionsGroupeWidget from '../../components/prof/analytics/SuggestionsGroupeWidget';

function TeacherDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Données de base
  const [eleves, setEleves] = useState([]);
  const [groupes, setGroupes] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [figures, setFigures] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);

  // Filtres
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tabValue, setTabValue] = useState(0);

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [elevesRes, groupesRes, disciplinesRes, figuresRes] = await Promise.all([
        api.get('/api/prof/eleves'),
        api.get('/api/prof/groupes'),
        api.get('/api/disciplines'),
        api.get('/api/figures')
      ]);

      const elevesData = await elevesRes.json();
      const groupesData = await groupesRes.json();
      const disciplinesData = await disciplinesRes.json();
      const figuresData = await figuresRes.json();

      setEleves(elevesData.eleves || []);
      setGroupes(groupesData.groupes || []);
      setDisciplines(disciplinesData || []);
      setFigures(figuresData || []);

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, []);

  const chargerStatsGlobales = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/api/prof/dashboard/stats-globales');
      const data = await res.json();
      setGlobalStats(data);
    } catch (err) {
      console.error('Erreur stats globales:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
    chargerStatsGlobales();
  }, [chargerDonnees, chargerStatsGlobales]);

  // Filtrage des données
  const filteredEleves = eleves.filter(eleve => {
    const matchesSearch = searchQuery === '' || 
      `${eleve.prenom} ${eleve.nom}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Backend renvoie 'groupes' (minuscule) via ProfService.getElevesByEcole
    // Mais parfois Sequelize brut renvoie 'Groupes'. On vérifie les deux pour être robuste.
    const eleveGroupes = eleve.groupes || eleve.Groupes || [];
    
    const matchesGroup = selectedGroup === '' || 
      (eleveGroupes.some(g => g.id === parseInt(selectedGroup)));

    return matchesSearch && matchesGroup;
  });

  const filteredFigures = figures.filter(fig => {
    return selectedDiscipline === '' || fig.discipline_id === parseInt(selectedDiscipline);
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Tableau de Bord Professeur
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Analyse de la progression collective et individuelle
        </Typography>
      </Box>

      {/* 1. Statistiques Globales (Moyennes de la classe) */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>📊 Aperçu Global</Typography>
      <ClassAverageCharts data={globalStats} loading={statsLoading} />

      <Divider sx={{ my: 4 }} />

      {/* 2. Barre de Filtres */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>🎯 Suivi par Élève & Figure</Typography>
      <DashboardFilters 
        disciplines={disciplines}
        selectedDiscipline={selectedDiscipline}
        onDisciplineChange={setSelectedDiscipline}
        groups={groupes}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Widget Suggestions Groupe */}
      {selectedGroup && (
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>💡 Suggestions Intelligentes pour le Groupe</Typography>
          <SuggestionsGroupeWidget 
            groupeId={selectedGroup} 
            groupeNom={groupes.find(g => g.id === parseInt(selectedGroup))?.nom} 
          />
        </Box>
      )}

      {/* 3. Matrice de Progression */}
      <Paper elevation={3} sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} aria-label="dashboard tabs">
            <Tab label="Matrice de Progression" />
            <Tab label="Alertes (Bientôt)" disabled />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 2 }}>
          {filteredEleves.length === 0 ? (
            <Alert severity="info">Aucun élève ne correspond aux critères.</Alert>
          ) : (
            <GroupProgressMatrix 
              students={filteredEleves} 
              figures={filteredFigures.slice(0, 20)}
              selectedGroup={selectedGroup}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default TeacherDashboardPage;
