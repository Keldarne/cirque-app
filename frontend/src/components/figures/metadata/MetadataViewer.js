import React from 'react';
import { Box, Typography, Chip, Divider, Grid, Paper } from '@mui/material';
import SiteswapVisualizer from './SiteswapVisualizer';

/**
 * Traduction des clés techniques en labels lisibles
 */
const LABEL_MAP = {
  'siteswap': 'Siteswap',
  'nb_objets': 'Objets',
  'type_objets': 'Matériel',
  'agres': 'Agrès',
  'hauteur_min': 'Hauteur Min',
  'accroche': 'Point d\'attache',
  'support': 'Support',
  'hauteur': 'Hauteur',
  'sub_type': 'Sous-type',
  'nb_personnes': 'Personnes',
  'categorie': 'Catégorie',
  'nombre_de_diabolos': 'Diabolos',
  'niveau_de_difficulte': 'Niveau',
  'source_url': 'Source'
};

/**
 * Composant intelligent qui décide quel visualiseur afficher selon la discipline et les métadonnées.
 * Supporte actuellement : Jonglage (Siteswap) + Affichage générique des métadonnées
 * 
 * @param {object} figure - L'objet figure complet
 */
const MetadataViewer = ({ figure }) => {
  if (!figure || !figure.metadata) return null;

  // Détection de la discipline
  const disciplineName = figure.Discipline?.nom || figure.discipline?.nom || figure.discipline_nom || '';
  const metadata = figure.metadata;

  // --- 1. VISUALISEUR SPÉCIFIQUE (JONGLAGE) ---
  const isJuggling = disciplineName.toLowerCase().includes('jonglage') || 
                     disciplineName.toLowerCase().includes('massues') ||
                     disciplineName.toLowerCase().includes('diabolo') ||
                     (metadata.siteswap && metadata.siteswap.length > 0);

  const renderVisualizer = () => {
    if (isJuggling && metadata.siteswap) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2 }}>
          {figure.gif_url ? (
            // Utiliser le GIF caché si disponible
            <Box
              component="img"
              src={figure.gif_url}
              alt={`Siteswap ${metadata.siteswap}`}
              sx={{
                height: 200,
                maxWidth: '100%',
                objectFit: 'contain',
                bgcolor: 'grey.50',
                borderRadius: 1
              }}
            />
          ) : (
            // Fallback vers génération dynamique
            <SiteswapVisualizer
              siteswap={metadata.siteswap}
              height={200}
              options={{
                bps: metadata.bps || undefined
              }}
            />
          )}
          <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, borderRadius: 1 }}>
            Siteswap: {metadata.siteswap}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // --- 2. AFFICHAGE DES INFOS TECHNIQUES (CHIPS) ---
  const renderTechnicalInfo = () => {
    const entries = Object.entries(metadata).filter(([key, val]) => val !== null && val !== undefined && key !== 'siteswap');
    
    if (entries.length === 0) return null;

    return (
      <Box sx={{ mt: 1 }}>
        <Grid container spacing={1}>
          {entries.map(([key, value]) => (
            <Grid item key={key}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  px: 1.5, 
                  py: 0.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  bgcolor: 'background.default',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                  {LABEL_MAP[key] || key}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Divider sx={{ mb: 2 }}>
        <Chip label="Spécifications Techniques" size="small" variant="outlined" />
      </Divider>
      
      {renderVisualizer()}
      {renderTechnicalInfo()}
    </Box>
  );
};

export default MetadataViewer;
