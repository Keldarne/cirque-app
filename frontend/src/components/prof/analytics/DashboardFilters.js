import React from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const DashboardFilters = ({ 
  disciplines, 
  selectedDiscipline, 
  onDisciplineChange,
  searchQuery,
  onSearchChange,
  groups,
  selectedGroup,
  onGroupChange
}) => {
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <FilterListIcon color="action" />
      
      {/* Recherche Élève */}
      <TextField
        size="small"
        placeholder="Rechercher un élève..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: 200 }}
      />

      {/* Filtre Groupe */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Groupe</InputLabel>
        <Select
          value={selectedGroup || ''}
          label="Groupe"
          onChange={(e) => onGroupChange(e.target.value)}
        >
          <MenuItem value="">Tous les groupes</MenuItem>
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>{g.nom}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Filtre Discipline */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Discipline</InputLabel>
        <Select
          value={selectedDiscipline || ''}
          label="Discipline"
          onChange={(e) => onDisciplineChange(e.target.value)}
        >
          <MenuItem value="">Toutes les disciplines</MenuItem>
          {disciplines.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.nom}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
};

export default DashboardFilters;
