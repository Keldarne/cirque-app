import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, Chip } from '@mui/material';
import { Person as PersonIcon, School as SchoolIcon } from '@mui/icons-material';

/**
 * ProgrammeSelector - Sélecteur de programmes
 * Suit les specs de figma.md section 2.4
 *
 * @param {array} programmes - Liste programmes [{id, nom, type, description, date_assignation}]
 * @param {string|number} selectedId - ID programme sélectionné
 * @param {function} onChange - Callback au changement
 * @param {string} userRole - Rôle utilisateur (pour affichage conditionnel)
 * @param {object} sx - Styles MUI supplémentaires
 */
function ProgrammeSelector({
  programmes = [],
  selectedId = 'personnel',
  onChange,
  userRole = 'eleve',
  sx = {}
}) {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <FormControl sx={{ minWidth: 300, ...sx }}>
      <InputLabel id="programme-select-label">Programme</InputLabel>
      <Select
        labelId="programme-select-label"
        id="programme-select"
        value={selectedId}
        label="Programme"
        onChange={handleChange}
      >
        {programmes.map((prog) => (
          <MenuItem key={prog.id} value={prog.id}>
            <Box display="flex" alignItems="center" gap={1}>
              {/* Icône selon le type */}
              {prog.type === 'personnel' && <PersonIcon fontSize="small" />}
              {prog.type === 'assigne' && <SchoolIcon fontSize="small" />}
              {prog.type === 'prof_cree' && <SchoolIcon fontSize="small" color="primary" />}

              {/* Nom du programme */}
              <Typography>{prog.nom}</Typography>

              {/* Badge selon le type */}
              {prog.type === 'assigne' && (
                <Chip label="Assigné" size="small" color="secondary" />
              )}
              {prog.type === 'prof_cree' && (
                <Chip label="Mes programmes" size="small" color="primary" />
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default ProgrammeSelector;
