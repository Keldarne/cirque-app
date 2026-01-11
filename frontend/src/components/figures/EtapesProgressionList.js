import React from 'react';
import { Box, Typography, Checkbox, Divider } from '@mui/material';

/**
 * EtapesProgressionList - Liste des étapes de progression d'une figure
 * Suit les specs de figma.md section 2.5
 *
 * @param {array} etapes - Étapes théoriques de la figure
 * @param {array} etapesUtilisateur - Validation utilisateur [{etape_numero, valide, date_validation}]
 * @param {boolean} editable - Permettre validation/dévalidation
 * @param {function} onValidateStep - Callback validation étape (etapeNumero, valide)
 * @param {boolean} showCheckboxes - Afficher checkboxes
 * @param {object} sx - Styles MUI supplémentaires
 */
function EtapesProgressionList({
  etapes = [],
  etapesUtilisateur = [],
  editable = false,
  onValidateStep,
  showCheckboxes = true,
  selectionMode = false,
  selectedIds = [],
  onToggleSelection,
  sx = {}
}) {
  // Créer un map pour accès rapide aux validations
  const validationsMap = etapesUtilisateur.reduce((acc, etape) => {
    acc[etape.etape_numero] = etape;
    return acc;
  }, {});

  const handleCheckboxChange = (etapeNumero) => {
    if (editable && onValidateStep) {
      const currentValidation = validationsMap[etapeNumero];
      onValidateStep(etapeNumero, !currentValidation?.valide);
    }
  };

  // Si on n'a pas d'étapes définies, générer dynamiquement selon nb_etapes
  const etapesList = etapes.length > 0 ? etapes : etapesUtilisateur;

  return (
    <Box sx={sx}>
      <Typography variant="h6" gutterBottom>
        Étapes de Progression
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {etapesList.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aucune étape définie pour cette figure
        </Typography>
      ) : (
        <Box>
          {etapesList.map((etape, idx) => {
            const etapeNumero = etape.etape_numero || idx + 1;
            const etapeId = etape.id || etape.etape_id; // Support both structures
            const validation = etapesUtilisateur.find(e => e.etape_numero === etapeNumero);
            const estValide = validation?.valide || false;
            const dateValidation = validation?.date_validation;
            
            // Selection logic
            const isSelected = selectedIds.includes(etapeId);

            return (
              <Box
                key={etapeId || etapeNumero}
                display="flex"
                alignItems="center"
                gap={1}
                mb={2}
                onClick={selectionMode && onToggleSelection ? () => onToggleSelection(etapeId) : undefined}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: selectionMode 
                    ? (isSelected ? 'primary.light' : 'transparent')
                    : (estValide ? 'rgba(76, 175, 80, 0.05)' : 'transparent'),
                  border: selectionMode
                    ? (isSelected ? '1px solid #1976d2' : '1px solid rgba(0,0,0,0.1)')
                    : (estValide ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(0,0,0,0.1)'),
                  cursor: selectionMode ? 'pointer' : 'default',
                  opacity: selectionMode && !isSelected ? 0.7 : 1
                }}
              >
                {selectionMode ? (
                  <Checkbox
                    checked={isSelected}
                    onChange={() => onToggleSelection(etapeId)}
                    color="primary"
                    size="small"
                  />
                ) : (
                  showCheckboxes && (
                    <Checkbox
                      checked={estValide}
                      disabled={!editable}
                      size="small"
                      onChange={() => handleCheckboxChange(etapeNumero)}
                      sx={{
                        color: estValide ? 'success.main' : 'grey.400',
                        '&.Mui-checked': { color: 'success.main' }
                      }}
                    />
                  )
                )}

                <Box flexGrow={1}>
                  <Typography
                    variant="body1"
                    color={selectionMode && isSelected ? 'primary.main' : (estValide ? 'text.primary' : 'text.secondary')}
                    fontWeight={isSelected || estValide ? 'medium' : 'regular'}
                  >
                    {etape.titre || etape.nom || (estValide ? validation.descriptif : etape.descriptif) || etape.description || `Étape ${etapeNumero}`}
                  </Typography>
                  {(etape.description || etape.descriptif) && (etape.titre || etape.nom) && (
                    <Typography variant="body2" color="text.secondary">
                      {etape.description || etape.descriptif}
                    </Typography>
                  )}

                  {dateValidation && (
                    <Typography variant="caption" color="text.secondary">
                      Validée le {new Date(dateValidation).toLocaleDateString('fr-FR')}
                    </Typography>
                  )}

                  {!estValide && (
                    <Typography variant="caption" color="text.secondary">
                      Non validée
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default EtapesProgressionList;
