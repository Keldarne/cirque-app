import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useSuggestionsProf } from '../../hooks/useSuggestionsProf';

/**
 * Composant SuggestionPanel - Affiche les suggestions intelligentes pour un élève
 * @param {number} eleveId - ID de l'élève
 * @param {function} onAssign - Callback après assignation réussie
 */
function SuggestionPanel({ eleveId, onAssign }) {
  const [niveau, setNiveau] = useState('');
  const [limit, setLimit] = useState(10);

  const { suggestions, loading, error, assignerFigure } = useSuggestionsProf(
    eleveId,
    { niveau, limit }
  );

  const handleAssign = async (figureId, figureName) => {
    const result = await assignerFigure(figureId);

    if (result.success) {
      alert(`Figure "${figureName}" assignée avec succès au programme de l'élève !`);
      if (onAssign) onAssign();
    } else {
      alert(`Erreur : ${result.error || 'Impossible d\'assigner la figure'}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Analyse des suggestions...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement des suggestions : {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Niveau</InputLabel>
          <Select value={niveau} onChange={(e) => setNiveau(e.target.value)} label="Niveau">
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="novice">Novice</MenuItem>
            <MenuItem value="intermediaire">Intermédiaire</MenuItem>
            <MenuItem value="expert">Expert</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Limite</InputLabel>
          <Select value={limit} onChange={(e) => setLimit(e.target.value)} label="Limite">
            <MenuItem value={5}>5 suggestions</MenuItem>
            <MenuItem value={10}>10 suggestions</MenuItem>
            <MenuItem value={20}>20 suggestions</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Empty State */}
      {suggestions.length === 0 ? (
        <Alert severity="info" icon={<TrophyIcon />}>
          Aucune suggestion disponible pour cet élève avec les filtres sélectionnés.
          {niveau && ' Essayez de changer le niveau de difficulté.'}
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} trouvée{suggestions.length > 1 ? 's' : ''}
          </Typography>

          {/* Liste des Suggestions */}
          {suggestions.map((suggestion) => (
            <Card key={suggestion.figure.id} sx={{ mb: 2 }} elevation={2}>
              <CardContent>
                {/* En-tête: Nom + Score */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {suggestion.figure.nom}
                  </Typography>
                  <Chip
                    label={`${suggestion.score_pertinence}%`}
                    color={
                      suggestion.score_pertinence >= 80
                        ? 'success'
                        : suggestion.score_pertinence >= 60
                        ? 'warning'
                        : 'default'
                    }
                    icon={
                      suggestion.score_pertinence >= 80 ? <CheckIcon /> : <TrophyIcon />
                    }
                  />
                </Box>

                {/* Discipline */}
                {suggestion.figure.discipline && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Discipline: {suggestion.figure.discipline?.nom || 'N/A'}
                  </Typography>
                )}

                {/* Barre de progression */}
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={suggestion.score_pertinence}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor:
                          suggestion.score_pertinence >= 80
                            ? '#4caf50'
                            : suggestion.score_pertinence >= 60
                            ? '#ff9800'
                            : '#757575'
                      }
                    }}
                  />
                </Box>

                {/* Raison de la suggestion */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                  💡 {suggestion.raison}
                </Typography>

                {/* Prérequis validés */}
                {suggestion.prerequis_valides && suggestion.prerequis_valides.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                      ✅ Prérequis validés :
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {suggestion.prerequis_valides.map((pre) => (
                        <Chip key={pre.id} label={pre.nom} size="small" color="success" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Prérequis manquants */}
                {suggestion.prerequis_manquants && suggestion.prerequis_manquants.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                      ❌ Prérequis manquants :
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {suggestion.prerequis_manquants.map((pre) => (
                        <Chip key={pre.id} label={pre.nom} size="small" color="error" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Badge de statut */}
                <Box sx={{ mb: 2 }}>
                  {suggestion.score_pertinence >= 80 ? (
                    <Chip label="✨ Prêt à commencer" color="success" icon={<CheckIcon />} />
                  ) : suggestion.score_pertinence >= 60 ? (
                    <Chip label="🔥 Bientôt prêt" color="warning" />
                  ) : (
                    <Chip label="🎯 Progression à faire" color="default" />
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAssign(suggestion.figure.id, suggestion.figure.nom)}
                    disabled={loading}
                  >
                    Assigner au programme
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </Box>
  );
}

export default SuggestionPanel;
